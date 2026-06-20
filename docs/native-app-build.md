# Native App (Capacitor) — Build & TestFlight

Stand: Juni 2026 · Capacitor 8 · iOS + Android · Code: `client/` (Feature-Branch `feature/dior-pilot`)

## Was steht (auf dem Server eingerichtet)
- Capacitor 8 initialisiert: `client/capacitor.config.ts` (appId `de.koreretail.app`, App „KORE")
- Plattformen angelegt: `client/ios/` (Xcode-Projekt) + `client/android/` (Gradle-Projekt)
- Plugins: Camera, Push Notifications, Splash Screen, Status Bar, App, Preferences
- Web-Assets gebündelt; API-Aufrufe gehen an **https://app.kore-retail.de** (beim Build gesetzt
  über `VITE_API_URL`, siehe `npm run build:native`)
- Native-Helper `client/src/lib/native.ts`: Statusleiste/Splash im KORE-CI + Push-Registrierung
  (im Web automatisch No-Op)

## Build-Workflow
```bash
cd client
npm run sync:native     # = build:native (mit Prod-API-URL) + cap sync
npx cap open ios        # öffnet Xcode  (nur auf macOS)
npx cap open android    # öffnet Android Studio
```
> ⚠️ **iOS bauen/signieren geht nur auf einem Mac mit Xcode.** Android geht auch hier (Linux),
> für den Store-Upload aber bequemer über Android Studio.

## Voraussetzung iOS / TestFlight (braucht Nicole + Apple-Account)
1. **Xcode** auf dem Mac, in `client/ios/App` einmal `pod install`
2. In Xcode: Team = Muñoz Bonilla GmbH, Signing automatisch, Bundle-ID `de.koreretail.app`
3. **Push (APNs):** im Apple-Developer-Portal einen **APNs-Auth-Key (.p8)** erstellen → für den
   Push-Versand vom Server hinterlegen; in Xcode die Capability **Push Notifications** + **Background Modes → Remote notifications** aktivieren
4. Archive → Distribute → **App Store Connect / TestFlight** hochladen
5. In App Store Connect interne/externe Tester (Dior) einladen

## Voraussetzung Android (für Push)
- **Firebase-Projekt** anlegen → `google-services.json` nach `client/android/app/`
- FCM-Server-Key für den Push-Versand am Server hinterlegen

## Noch offen (nächste Bausteine)
- **Push-Backend:** Prisma-Model `DeviceToken` + Endpoint `POST /api/notifications/register-device`
  + FCM/APNs-Versand; Trigger bei neuem Spot-Check / fälliger Checkliste. Braucht die Credentials
  aus Schritt 3 (APNs .p8) bzw. Firebase.
- **Token-Registrierung verdrahten:** `registerPush()` aus `native.ts` nach Login aufrufen und
  Token an das Backend senden (TODO im Code markiert).
- **App-Icons & Splash** im KORE-CI generieren (`@capacitor/assets`).
- **Kamera:** der bestehende Foto-Upload (`<input capture>`) funktioniert nativ bereits; optional
  auf das native Camera-Plugin umstellen für besseres UX.
- **Voraussetzung App-Store-Freigabe:** HTTPS-API erreichbar → hängt am **DNS-Cutover**
  (`app.kore-retail.de` → 167.233.135.200) + TLS. iOS (ATS) verlangt HTTPS.

## Wichtig: Reihenfolge
Die native App zeigt fest auf `https://app.kore-retail.de`. Sie wird erst sinnvoll testbar,
**nachdem** der DNS-Cutover auf den neuen Server + TLS erfolgt ist (siehe server-migration-runbook).
Bis dahin: Build-Setup steht, Apple-Account + APNs-Key + Firebase parallel vorbereiten.
