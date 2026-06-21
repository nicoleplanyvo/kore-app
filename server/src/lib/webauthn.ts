import type { Request, Response } from 'express';

/**
 * WebAuthn-/Passkey-Konfiguration.
 * rpID = reine Domain (ohne https://, ohne Port). origin = vollständige Origin(s).
 * Mehrere Origins kommagetrennt (z. B. Web + spätere native App-Origin).
 */
export const RP_NAME = process.env['WEBAUTHN_RP_NAME'] ?? 'KORE Retail';
export const RP_ID = process.env['WEBAUTHN_RP_ID'] ?? 'app.kore-retail.de';
export const ORIGINS = (process.env['WEBAUTHN_ORIGIN'] ?? 'https://app.kore-retail.de')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const CHALLENGE_COOKIE = 'kore_wac';
const isProd = process.env['NODE_ENV'] === 'production';

/** Challenge fuer die Dauer einer WebAuthn-Zeremonie als httpOnly-Cookie ablegen (5 Min). */
export function setChallenge(res: Response, challenge: string): void {
  res.cookie(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000,
    path: '/api/auth/passkey',
  });
}

export function getChallenge(req: Request): string | undefined {
  return (req.cookies as Record<string, string> | undefined)?.[CHALLENGE_COOKIE];
}

export function clearChallenge(res: Response): void {
  res.clearCookie(CHALLENGE_COOKIE, { path: '/api/auth/passkey' });
}

/** Einfacher Geraete-Name aus dem User-Agent fuer eine benutzerfreundliche Passkey-Bezeichnung. */
export function deviceNameFromUA(ua: string | undefined): string {
  if (!ua) return 'Passkey';
  if (/iphone/i.test(ua)) return 'iPhone';
  if (/ipad/i.test(ua)) return 'iPad';
  if (/macintosh|mac os x/i.test(ua)) return 'Mac';
  if (/android/i.test(ua)) return 'Android-Geraet';
  if (/windows/i.test(ua)) return 'Windows-Geraet';
  return 'Passkey';
}
