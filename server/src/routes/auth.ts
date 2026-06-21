import { Router, type Router as RouterType } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { loginSchema } from '@shared/validators';
import { sendEmail, passwordResetEmail } from '../lib/email.js';

const APP_URL = process.env['APP_URL'] ?? 'https://app.kore-retail.de';
const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

export const authRouter: RouterType = Router();

/** Helper: Lade User-Daten inkl. Store- und Region-Zuweisungen für Auth-Response */
async function buildAuthResponse(userId: string, impersonatedBy?: string) {
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
    impersonatedBy: impersonatedBy || undefined,
    storeAssignments: user.storeAssignments.map((a: { storeId: string }) => a.storeId),
    regionAssignments: user.regionAssignments.map((a: { regionId: string }) => a.regionId),
  };
}

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validierungsfehler',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const refreshToken = signRefreshToken(user.id);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
      path: '/api/auth',
    });

    const authUser = await buildAuthResponse(user.id);

    res.json({ accessToken, user: authUser });
  } catch (err) {
    console.error('Auth login error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/auth/forgot-password — Reset-Link per E-Mail anfordern
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
    // Immer 200 zurückgeben (keine Account-Enumeration)
    if (!parsed.success) return res.json({ ok: true });

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: hashToken(token), resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) }, // 1 Std.
      });
      const resetLink = `${APP_URL}/reset-password?token=${token}`;
      await sendEmail(passwordResetEmail({ name: user.name, email: user.email, resetLink }));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.json({ ok: true }); // bewusst kein 500 nach außen
  }
});

// POST /api/auth/reset-password — neues Passwort mit Token setzen
authRouter.post('/reset-password', async (req, res) => {
  try {
    const parsed = z.object({
      token: z.string().min(10),
      password: z.string().min(8, 'Mindestens 8 Zeichen.'),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const user = await prisma.user.findFirst({
      where: { resetTokenHash: hashToken(parsed.data.token), resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'Link ungültig oder abgelaufen. Bitte neu anfordern.' });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(parsed.data.password, 12),
        resetTokenHash: null,
        resetTokenExpiry: null,
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.['refreshToken'];
    if (!token) {
      res.status(401).json({ error: 'Kein Refresh-Token.' });
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Benutzer nicht gefunden oder deaktiviert.' });
      return;
    }

    const accessToken = signAccessToken({
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const authUser = await buildAuthResponse(user.id);

    res.json({ accessToken, user: authUser });
  } catch {
    res.status(401).json({ error: 'Refresh-Token ungültig oder abgelaufen.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  res.json({ success: true });
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req, res) => {
  try {
    const authUser = await buildAuthResponse(
      req.user!.sub,
      req.user!.impersonatedBy,
    );

    if (!authUser) {
      res.status(404).json({ error: 'Benutzer nicht gefunden.' });
      return;
    }

    res.json({ user: authUser });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/auth/impersonate — nur kore_admin
authRouter.post('/impersonate', authenticate, requireRole('kore_admin'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId ist erforderlich.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, role: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      res.status(404).json({ error: 'Ziel-Benutzer nicht gefunden oder deaktiviert.' });
      return;
    }

    // Erstelle Token mit impersonatedBy
    const accessToken = signAccessToken({
      sub: targetUser.id,
      tenantId: targetUser.tenantId,
      role: targetUser.role,
      impersonatedBy: req.user!.sub,
    });

    const authUser = await buildAuthResponse(targetUser.id, req.user!.sub);

    res.json({ accessToken, user: authUser });
  } catch (err) {
    console.error('Impersonate error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /api/auth/stop-impersonation
authRouter.post('/stop-impersonation', authenticate, async (req, res) => {
  try {
    const impersonatedBy = req.user!.impersonatedBy;
    if (!impersonatedBy) {
      res.status(400).json({ error: 'Keine aktive Impersonation.' });
      return;
    }

    // Lade Original-Admin
    const adminUser = await prisma.user.findUnique({
      where: { id: impersonatedBy },
      select: { id: true, tenantId: true, role: true, isActive: true },
    });

    if (!adminUser || !adminUser.isActive) {
      res.status(404).json({ error: 'Original-Admin nicht gefunden.' });
      return;
    }

    // Erstelle neuen Token für den Admin (ohne impersonatedBy)
    const accessToken = signAccessToken({
      sub: adminUser.id,
      tenantId: adminUser.tenantId,
      role: adminUser.role,
    });

    const authUser = await buildAuthResponse(adminUser.id);

    res.json({ accessToken, user: authUser });
  } catch (err) {
    console.error('Stop impersonation error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
