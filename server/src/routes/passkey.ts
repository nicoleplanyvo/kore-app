import { Router, type Router as RouterType, type Response } from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { signAccessToken, signRefreshToken } from '../lib/jwt.js';
import {
  RP_NAME,
  RP_ID,
  ORIGINS,
  setChallenge,
  getChallenge,
  clearChallenge,
  deviceNameFromUA,
} from '../lib/webauthn.js';

export const passkeyRouter: RouterType = Router();

/** Auth-Response-Objekt (identisch zum klassischen Login). */
async function buildAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      storeAssignments: { select: { storeId: true } },
      regionAssignments: { select: { regionId: true } },
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    storeAssignments: user.storeAssignments.map((a: { storeId: string }) => a.storeId),
    regionAssignments: user.regionAssignments.map((a: { regionId: string }) => a.regionId),
  };
}

/** Access-Token ausstellen + Refresh-Cookie setzen (wie /api/auth/login). */
function issueSession(res: Response, user: { id: string; tenantId: string | null; role: string }): string {
  const accessToken = signAccessToken({ sub: user.id, tenantId: user.tenantId, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
  return accessToken;
}

// ─── Registrierung (eingeloggt) ───────────────────────────────────────────────

// POST /api/auth/passkey/register/options
passkeyRouter.post('/register/options', authenticate, async (req, res) => {
  try {
    const userId = req.user!.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }
    const existing = await prisma.passkey.findMany({
      where: { userId },
      select: { credentialId: true, transports: true },
    });
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: user.email,
      userDisplayName: user.name,
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      excludeCredentials: existing.map((c) => ({
        id: c.credentialId,
        transports: c.transports ? (JSON.parse(c.transports) as ('ble' | 'hybrid' | 'internal' | 'nfc' | 'usb' | 'cable' | 'smart-card')[]) : undefined,
      })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    });
    setChallenge(res, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('Passkey register/options error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/auth/passkey/register/verify
passkeyRouter.post('/register/verify', authenticate, async (req, res) => {
  const challenge = getChallenge(req);
  if (!challenge) {
    res.status(400).json({ error: 'Challenge abgelaufen. Bitte erneut versuchen.' });
    return;
  }
  try {
    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });
    if (!verification.verified || !verification.registrationInfo) {
      clearChallenge(res);
      res.status(400).json({ error: 'Passkey-Registrierung fehlgeschlagen.' });
      return;
    }
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await prisma.passkey.create({
      data: {
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: BigInt(credential.counter),
        transports: credential.transports ? JSON.stringify(credential.transports) : null,
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        name: deviceNameFromUA(req.headers['user-agent']),
        userId: req.user!.sub,
      },
    });
    clearChallenge(res);
    res.json({ ok: true });
  } catch (err) {
    clearChallenge(res);
    console.error('Passkey register/verify error:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Verifizierung fehlgeschlagen.' });
  }
});

// ─── Anmeldung per Passkey (oeffentlich, discoverable credentials) ─────────────

// POST /api/auth/passkey/auth/options
passkeyRouter.post('/auth/options', async (_req, res) => {
  try {
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
    });
    setChallenge(res, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('Passkey auth/options error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/auth/passkey/auth/verify
passkeyRouter.post('/auth/verify', async (req, res) => {
  const challenge = getChallenge(req);
  if (!challenge) {
    res.status(400).json({ error: 'Challenge abgelaufen. Bitte erneut versuchen.' });
    return;
  }
  const credId: string | undefined = req.body?.id;
  const passkey = credId
    ? await prisma.passkey.findUnique({ where: { credentialId: credId } })
    : null;
  if (!passkey) {
    clearChallenge(res);
    res.status(400).json({ error: 'Unbekannter Passkey.' });
    return;
  }
  try {
    const verification = await verifyAuthenticationResponse({
      response: req.body,
      expectedChallenge: challenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
      requireUserVerification: false,
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as ('ble' | 'hybrid' | 'internal' | 'nfc' | 'usb' | 'cable' | 'smart-card')[])
          : undefined,
      },
    });
    if (!verification.verified) {
      clearChallenge(res);
      res.status(400).json({ error: 'Passkey-Verifizierung fehlgeschlagen.' });
      return;
    }
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() },
    });
    const user = await prisma.user.findUnique({ where: { id: passkey.userId } });
    if (!user || !user.isActive) {
      clearChallenge(res);
      res.status(403).json({ error: 'Konto ist deaktiviert.' });
      return;
    }
    const accessToken = issueSession(res, user);
    clearChallenge(res);
    const authUser = await buildAuthUser(user.id);
    res.json({ accessToken, user: authUser });
  } catch (err) {
    clearChallenge(res);
    console.error('Passkey auth/verify error:', err);
    res.status(400).json({ error: err instanceof Error ? err.message : 'Verifizierung fehlgeschlagen.' });
  }
});

// ─── Verwaltung (eingeloggt) ───────────────────────────────────────────────────

// GET /api/auth/passkey  — eigene Passkeys auflisten
passkeyRouter.get('/', authenticate, async (req, res) => {
  const list = await prisma.passkey.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      deviceType: true,
      backedUp: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
  res.json(list);
});

// DELETE /api/auth/passkey/:id  — eigenen Passkey entfernen
passkeyRouter.delete('/:id', authenticate, async (req, res) => {
  const result = await prisma.passkey.deleteMany({
    where: { id: String(req.params.id), userId: req.user!.sub },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Passkey nicht gefunden.' });
    return;
  }
  res.json({ ok: true });
});
