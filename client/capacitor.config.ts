import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor-Konfiguration für die native KORE-App (iOS + Android).
 *
 * Die Web-Assets werden gebündelt (webDir: dist) und laufen lokal in der App.
 * API-Aufrufe gehen an die absolute Produktions-URL — gesetzt beim Build über
 * VITE_API_URL (siehe npm run build:native). Erst nach DNS-Cutover + TLS zeigt
 * app.kore-retail.de auf den neuen Server; bis dahin Platzhalter.
 */
const config: CapacitorConfig = {
  appId: 'de.koreretail.app',
  appName: 'KORE',
  webDir: 'dist',
  // KORE CI: heller Hintergrund
  backgroundColor: '#F7F4EF',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#F7F4EF',
      showSpinner: false,
    },
    PushNotifications: {
      // iOS: Badge + Sound + Alert beim Eintreffen anzeigen
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
