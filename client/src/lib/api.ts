import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { AuthUser } from '@shared/types';

const API_URL = import.meta.env.VITE_API_URL || '';

// Native App: Refresh-Token nativ speichern — Cookies sind im Capacitor-WebView
// cross-origin unzuverlaessig. Web: httpOnly-Cookie wie gehabt (kein Token im JS).
const IS_NATIVE = Capacitor.isNativePlatform();
const REFRESH_KEY = 'kore_refresh_token';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function storeRefreshToken(token: string | null): Promise<void> {
  if (!IS_NATIVE) return;
  try {
    if (token) await Preferences.set({ key: REFRESH_KEY, value: token });
    else await Preferences.remove({ key: REFRESH_KEY });
  } catch { /* Preferences n/a — ignorieren */ }
}

/** Session erneuern — Web: Cookie, Native: nativ gespeicherter Refresh-Token. */
export async function refreshSession(): Promise<{ accessToken: string; user: AuthUser } | null> {
  try {
    const init: RequestInit = { method: 'POST', credentials: 'include' };
    if (IS_NATIVE) {
      const stored = await Preferences.get({ key: REFRESH_KEY });
      init.headers = { 'Content-Type': 'application/json', 'X-KORE-Native': '1' };
      init.body = JSON.stringify(stored.value ? { refreshToken: stored.value } : {});
    }
    const res = await fetch(`${API_URL}/api/auth/refresh`, init);
    if (!res.ok) return null;
    const data = await res.json();
    accessToken = data.accessToken;
    if (typeof data.refreshToken === 'string') void storeRefreshToken(data.refreshToken);
    return data;
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const session = await refreshSession();
  return session?.accessToken ?? null;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (IS_NATIVE) headers['X-KORE-Native'] = '1';

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Automatischer Token-Refresh bei 401
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Netzwerkfehler' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  const json = await res.json();
  if (IS_NATIVE && json && typeof json === 'object') {
    const j = json as { refreshToken?: string };
    if (typeof j.refreshToken === 'string') void storeRefreshToken(j.refreshToken);
    if (path === '/api/auth/logout') void storeRefreshToken(null);
  }
  return json as T;
}

export { API_URL };

/** Upload-Request mit FormData (kein Content-Type Header — Browser setzt multipart) */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(url, {
    method,
    headers,
    body: formData,
    credentials: 'include',
  });

  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method,
        headers,
        body: formData,
        credentials: 'include',
      });
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Netzwerkfehler' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

/** Lädt ein Auth-geschütztes Upload-Bild (z. B. "/uploads/spot-checks/x.jpg") als Objekt-URL */
export async function apiBlobUrl(uploadPath: string): Promise<string> {
  const url = `${API_URL}/api${uploadPath}`;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(url, { headers, credentials: 'include' });
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { headers, credentials: 'include' });
    }
  }
  if (!res.ok) throw new Error(`Bild konnte nicht geladen werden (HTTP ${res.status})`);
  return URL.createObjectURL(await res.blob());
}

/** Lädt eine Auth-geschützte Datei (z. B. PDF) und stößt den Browser-Download an */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(url, { headers, credentials: 'include' });
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, { headers, credentials: 'include' });
    }
  }
  if (!res.ok) throw new Error(`Download fehlgeschlagen (HTTP ${res.status})`);

  const objectUrl = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
