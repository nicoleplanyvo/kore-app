import { Capacitor } from '@capacitor/core';
import { api } from './api';

/**
 * Native-Integration (nur in der Capacitor-App aktiv, im Web No-Op).
 * Statusleiste im KORE-CI, Splash ausblenden, Push-Registrierung.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // Dunkler Statusleisten-Text (Uhr/Symbole) auf hellem KORE-Header
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#F7F4EF' });
  } catch { /* StatusBar auf manchen Geräten n/a */ }

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* ignore */ }
}

/**
 * Push-Registrierung. Fordert Erlaubnis an, registriert beim OS und liefert den
 * Device-Token. Der Token wird über `onToken` weitergereicht (→ später an das
 * Backend `POST /api/notifications/register-device`, sobald APNs/FCM konfiguriert).
 * Tippt der Nutzer eine Push-Nachricht an, wird `onOpen` mit den Daten gerufen
 * (z. B. spotCheckId → direkt zur Foto-Antwort navigieren).
 */
export async function registerPush(opts: {
  onToken?: (token: string) => void;
  onOpen?: (data: Record<string, unknown>) => void;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { PushNotifications } = await import('@capacitor/push-notifications');

  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  await PushNotifications.register();

  await PushNotifications.addListener('registration', (token) => {
    opts.onToken?.(token.value);
  });
  await PushNotifications.addListener('registrationError', (err) => {
    console.warn('Push-Registrierung fehlgeschlagen:', err);
  });
  await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    opts.onOpen?.(action.notification.data ?? {});
  });
}

/** Push registrieren und den Device-Token ans Backend melden (nach Login aufrufen). */
export async function registerPushAndSyncToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await registerPush({
    onToken: (token) => {
      const platform = Capacitor.getPlatform(); // 'ios' | 'android'
      void api('/api/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({ token, platform }),
      }).catch(() => { /* Backend evtl. noch ohne Push-Provider — unkritisch */ });
    },
  });
}
