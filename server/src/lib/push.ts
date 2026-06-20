import prisma from './prisma.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Push-Versand für die native App.
 *
 * Pipeline ist vollständig: Token-Speicherung (DeviceToken) → Empfänger-Targeting
 * (Nutzer mit Store-Zugriff) → Dispatch. Der eigentliche Provider-Aufruf (FCM/APNs)
 * ist als `dispatchToProvider` gekapselt und greift, sobald die Credentials gesetzt
 * sind (FCM_SERVICE_ACCOUNT / APNS_KEY). Ohne Credentials wird nur geloggt — die App
 * funktioniert, es kommt nur (noch) keine Push-Nachricht an.
 */

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** Sendet eine Push-Nachricht an alle Geräte der Nutzer mit Zugriff auf die Stores. */
export async function sendPushToStores(
  tenantId: string,
  storeIds: string[],
  payload: PushPayload,
): Promise<number> {
  if (storeIds.length === 0) return 0;
  try {
    // Nutzer mit direkter Store-Zuordnung
    const assignments = await prisma.userStoreAssignment.findMany({
      where: { storeId: { in: storeIds } },
      select: { userId: true },
    });
    const userIds = [...new Set(assignments.map((a) => a.userId))];
    if (userIds.length === 0) return 0;

    const tokens = await prisma.deviceToken.findMany({
      where: { tenantId, userId: { in: userIds } },
      select: { token: true, platform: true },
    });
    if (tokens.length === 0) return 0;

    let sent = 0;
    for (const t of tokens) {
      const ok = await dispatchToProvider(t.token, t.platform, payload);
      if (ok) sent += 1;
    }
    return sent;
  } catch (err) {
    console.error('sendPushToStores Fehler:', err);
    return 0;
  }
}

const FCM_CONFIGURED = !!process.env['FCM_SERVICE_ACCOUNT'];
const APNS_CONFIGURED = !!process.env['APNS_KEY'];

/**
 * Provider-Dispatch. HIER die FCM-/APNs-Integration einsetzen, sobald die
 * Credentials vorliegen (Firebase Service Account bzw. Apple APNs-.p8).
 * Bis dahin: strukturiertes Logging, damit der Fluss end-to-end testbar ist.
 */
async function dispatchToProvider(
  token: string,
  platform: string,
  payload: PushPayload,
): Promise<boolean> {
  if (!FCM_CONFIGURED && !APNS_CONFIGURED) {
    console.log(`[push:stub] → ${platform} ${token.slice(0, 12)}… : ${payload.title} — ${payload.body}`);
    return false;
  }
  // TODO: echten Versand implementieren
  //  - Android + iOS via FCM HTTP v1 (Firebase Service Account, OAuth2)
  //  - oder iOS direkt via APNs (JWT mit APNS_KEY/.p8, KeyId, TeamId)
  console.log(`[push] (Provider konfiguriert, Versand noch nicht implementiert) → ${platform}`);
  return false;
}
