import {
  startRegistration,
  startAuthentication,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import type { AuthUser } from '@shared/types';
import { api } from './api';

/** Unterstuetzt dieser Browser WebAuthn/Passkeys ueberhaupt? */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.create === 'function'
  );
}

/** Einen neuen Passkey fuer den eingeloggten Nutzer registrieren. */
export async function registerPasskey(): Promise<void> {
  const optionsJSON = await api<PublicKeyCredentialCreationOptionsJSON>(
    '/api/auth/passkey/register/options',
    { method: 'POST' },
  );
  const attResp = await startRegistration({ optionsJSON });
  await api('/api/auth/passkey/register/verify', {
    method: 'POST',
    body: JSON.stringify(attResp),
  });
}

/** Per Passkey anmelden — liefert Access-Token und Nutzer (wie der klassische Login). */
export async function loginWithPasskey(): Promise<{ accessToken: string; user: AuthUser }> {
  const optionsJSON = await api<PublicKeyCredentialRequestOptionsJSON>(
    '/api/auth/passkey/auth/options',
    { method: 'POST' },
  );
  const asseResp = await startAuthentication({ optionsJSON });
  return api<{ accessToken: string; user: AuthUser }>('/api/auth/passkey/auth/verify', {
    method: 'POST',
    body: JSON.stringify(asseResp),
  });
}

export interface PasskeyInfo {
  id: string;
  name: string | null;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

export function listPasskeys(): Promise<PasskeyInfo[]> {
  return api<PasskeyInfo[]>('/api/auth/passkey');
}

export function deletePasskey(id: string): Promise<{ ok: boolean }> {
  return api<{ ok: boolean }>(`/api/auth/passkey/${id}`, { method: 'DELETE' });
}
