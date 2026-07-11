# KORE — Native iOS App: Build & TestFlight (Anleitung für den Mac)

Diese Anleitung bringt die KORE-App als native iOS-App in **TestFlight** (interner Test) —
und später in den App Store. Alles, was **nicht** den Mac braucht, ist bereits vorbereitet
(App-ID, Icons, Splash, Berechtigungen, Prod-API, CORS, Passkey-AASA). Auf dem Mac musst du
nur noch signieren, archivieren und hochladen.

**Stand der Vorbereitung (erledigt):**
- Capacitor-Projekt + `ios/`-Ordner vorhanden, App-ID `de.koreretail.app`, Name „KORE"
- App-Icon + Splash (cremefarben, Logo) generiert
- Info.plist: Kamera-, Foto-, Face-ID-Berechtigungen + Export-Compliance gesetzt
- Web-Bundle mit Prod-API `https://app.kore-retail.de` eingebacken und ins iOS-Projekt kopiert
- Server-CORS für die native App (`capacitor://localhost`) aktiv
- Passkey-AASA-Route am Server vorbereitet (wartet nur auf die Apple-Team-ID)

---

## 0. Voraussetzungen (einmalig)
- **Mac mit Xcode** (aktuelle Version, aus dem Mac App Store)
- **Apple Developer Program** Mitgliedschaft (hast du)
- **Node.js** (gleiche Version wie hier, z. B. 20/22) + **CocoaPods**: `sudo gem install cocoapods` (falls Capacitor Pods statt SPM nutzt)
- In Xcode einmal einloggen: **Xcode → Settings → Accounts → „+" → Apple-ID**

## 1. Code auf den Mac holen
```bash
git clone git@github.com:nicoleplanyvo/kore-app.git
cd kore-app
```
(oder als ZIP von GitHub herunterladen)

## 2. Abhängigkeiten + nativen Build erzeugen
```bash
# Nur der Client wird gebraucht:
cd client
npm install
npm run sync:native      # baut Web mit Prod-API + kopiert alles ins ios/-Projekt
npx cap open ios         # oeffnet das Projekt in Xcode
```
> `sync:native` = Build mit `VITE_API_URL=https://app.kore-retail.de` + `cap sync`
> (lädt auch die iOS-Pods/Swift-Packages — das geht nur auf dem Mac).

## 3. In Xcode: Signing einrichten
1. Links im Projektnavigator **„App"** anklicken → Ziel **„App"** → Tab **„Signing & Capabilities"**
2. **„Automatically manage signing"** anhaken
3. Bei **„Team"** dein Apple-Developer-Team auswählen
4. **Bundle Identifier** muss `de.koreretail.app` sein (ist voreingestellt)

## 4. In Xcode: Capabilities hinzufügen
Im selben Tab **„Signing & Capabilities"** oben auf **„+ Capability"**:
1. **Push Notifications** hinzufügen (für die Spot-Check-/Audit-Benachrichtigungen)
2. **Associated Domains** hinzufügen → Eintrag:
   ```
   webcredentials:app.kore-retail.de
   ```
   (→ ermöglicht passwortlosen Passkey-Login in der App, sobald die Team-ID am Server gesetzt ist — siehe Schritt 8)

> Kamera/Foto/Face-ID-Berechtigungen sind bereits in der Info.plist — nichts weiter nötig.

## 5. Version & Build-Nummer
Im Tab **„General"**:
- **Version** z. B. `1.0.0`
- **Build** z. B. `1` (bei jedem neuen Upload um 1 erhöhen)

## 6. Archivieren
1. Oben in der Geräte-Auswahl **„Any iOS Device (arm64)"** wählen (nicht den Simulator)
2. Menü **Product → Archive**
3. Nach dem Build öffnet sich der **Organizer** mit dem Archiv

## 7. Nach TestFlight hochladen
1. Vorher in **App Store Connect** (appstoreconnect.apple.com) die App anlegen:
   **Apps → „+" → Neue App** → Plattform iOS, Bundle-ID `de.koreretail.app`, Name „KORE"
2. Im Xcode-Organizer **„Distribute App"** → **„App Store Connect"** → **„Upload"**
3. Standard-Optionen bestätigen → **Upload**
4. Nach dem Upload erscheint der Build nach einigen Minuten unter **TestFlight**
5. Unter **TestFlight → Interne Tests** dich selbst (und Dior-Tester) als Tester hinzufügen
6. Die **TestFlight-App** aufs iPhone laden → Einladung annehmen → KORE testen

---

## 8. Letzter Schritt für Passkeys in der App (brauche ich von dir)
Damit der Passkey-Login **in der nativen App** funktioniert, braucht der Server deine
**Apple-Team-ID** (10-stellig, z. B. `A1B2C3D4E5`):
- Zu finden auf **developer.apple.com → Membership** bzw. App Store Connect → „Mitgliedschaft"

Sobald du sie mir gibst, setze ich am Server `APPLE_TEAM_ID` und aktiviere die AASA-Datei
(`https://app.kore-retail.de/.well-known/apple-app-site-association`). Dann nutzt die App
dieselben Passkeys wie das Web.

---

## Bekannte Einschränkung (für später, kein Blocker fürs erste Testen)
Die App ruft die API cross-origin (`capacitor://localhost` → `app.kore-retail.de`). Der
**Refresh-Token** liegt als Cookie und wird im WebView cross-origin nicht zuverlässig
mitgesendet — d. h. nach ~15 Min Inaktivität kann eine erneute Anmeldung nötig sein.
Fix für Phase 2: Token nativ in `@capacitor/preferences` speichern + header-basierter
Refresh, oder `CapacitorHttp` aktivieren (nativer HTTP-Layer mit Cookie-Handling).
Fürs erste TestFlight-Demo ist die App voll nutzbar.

## Updates ausspielen
Nach Code-Änderungen am Mac:
```bash
cd client && npm run sync:native
```
dann in Xcode: Build-Nummer +1 → Archive → Upload. Fertig.

---

## ⭐ Standard-Upload (ohne Xcode-Anmeldung!) — der zuverlässige Weg

Die Xcode-Apple-ID-Sitzung läuft ständig ab („Unable to authenticate with App Store Connect").
Deshalb laden wir Builds per **App-Store-Connect-API-Schlüssel** hoch — funktioniert immer:

**Voraussetzung (einmalig, bereits erledigt):** API-Key `AuthKey_4VJP95L4QD.p8`
liegt in `~/private_keys/` (Key-ID `4VJP95L4QD`, Issuer `4fe7fd8e-fd99-42b3-814a-dd7ebd5278da`).

**Ablauf pro neuem Build:**
1. Code aktualisieren + Web-Bundle bauen:
   `cd ~/Desktop/kore-app && git pull && cd client && npm run sync:native`
2. In Xcode: Build-Nummer +1 (General → Identity → Build) → `Product → Archive`
3. Upload per Terminal (findet automatisch das neueste Archiv):

```bash
ARCHIVE=$(ls -dt ~/Library/Developer/Xcode/Archives/*/*.xcarchive | head -1) && echo "Archiv: $ARCHIVE"
cat > /tmp/ExportOptions.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>33J7NYF75L</string>
  <key>signingStyle</key><string>automatic</string>
</dict>
</plist>
PLIST
xcodebuild -exportArchive -archivePath "$ARCHIVE" -exportPath ~/Desktop/kore-upload \
  -exportOptionsPlist /tmp/ExportOptions.plist -allowProvisioningUpdates \
  -authenticationKeyID 4VJP95L4QD \
  -authenticationKeyIssuerID 4fe7fd8e-fd99-42b3-814a-dd7ebd5278da \
  -authenticationKeyPath ~/private_keys/AuthKey_4VJP95L4QD.p8 && \
xcrun altool --upload-app -f ~/Desktop/kore-upload/*.ipa -t ios \
  --apiKey 4VJP95L4QD --apiIssuer 4fe7fd8e-fd99-42b3-814a-dd7ebd5278da
```

Erfolg = `UPLOAD SUCCEEDED with no errors`. Build erscheint nach wenigen Minuten in TestFlight.

**Wichtige Lehre (Build 2 vs. 3):** Vor jedem Build prüfen, dass `git pull` wirklich durchlief —
lokale Xcode-Änderungen ggf. mit `git stash` parken und nach dem Pull mit `git stash pop` zurückholen.
Verifikation: `grep -c safe-area-top client/src/index.css` muss `1` liefern.

---

## ⚠️ Update 11.7.2026: altool defekt → Upload per Transporter-App

Auf Nicoles Mac ist `xcrun altool` kaputt (Fehler: „Defaults.properties couldn't be opened" —
die Datei fehlt komplett in der Xcode-Installation). **Neuer Standard-Ablauf pro Build:**

1. Terminal: `cd ~/Desktop/kore-app && git pull && cd client && npm run sync:native`
2. Xcode: Build-Nr +1 → Product → Archive
3. Terminal: **nur den Export-Teil** des Upload-Blocks (bis einschl. `xcodebuild -exportArchive …`,
   die `altool`-Zeile weglassen) → erzeugt `~/Desktop/kore-upload/App.ipa`
4. **Transporter-App** (aus dem Mac App Store, Apple-ID-Login): `App.ipa` reinziehen → „Übermitteln"
   → grüner Haken „Ausgeliefert" = fertig, Build erscheint in TestFlight.

Build 4 (11.7., mit Layout-Fixes + MyDay-Scope + persistentem Login) wurde so ausgeliefert.
