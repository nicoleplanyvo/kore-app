import jwt from 'jsonwebtoken';

export interface JWTPayload {
  sub: string;
  tenantId: string | null;
  role: string;
  impersonatedBy?: string; // Original-Admin-ID bei Impersonation
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'dev-secret-key-min-32-characters-long';
const JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'dev-refresh-secret-min-32-chars-long';

export function signAccessToken(payload: {
  sub: string;
  tenantId: string | null;
  role: string;
  impersonatedBy?: string;
}): string {
  // Only include impersonatedBy if defined
  const tokenPayload: Record<string, unknown> = {
    sub: payload.sub,
    tenantId: payload.tenantId,
    role: payload.role,
  };
  if (payload.impersonatedBy) {
    tokenPayload['impersonatedBy'] = payload.impersonatedBy;
  }
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(sub: string): string {
  return jwt.sign({ sub }, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { sub: string };
}
