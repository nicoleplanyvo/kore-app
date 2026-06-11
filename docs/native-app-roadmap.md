# KORE Native App — Launch-Fahrplan

Stand: 10. Juni 2026 · Basis: Code-Analyse `/var/www/kore/app`

## Ausgangslage (Befund aus dem Code)

| Befund | Konsequenz |
|---|---|
| 36 Tools, Reifegrad sehr unterschiedlich (z. B. Checklisten 2.500+ LOC vs. Training-Hours 360 LOC) | Launch-Set radikal verkleinern |
| DB enthält nur Demo-Daten (3 Tenants, 6 User, 9 Stores) | Kein Migrationsrisiko — Launch = Greenfield |
| Auth ist bereits Bearer-Token + Refresh-Cookie | Native-tauglich, nur Refresh auf Secure Storage umstellen |
| Keine Push-Infrastruktur (Team-Push ist nur in-app) | FCM/APNs muss neu gebaut werden |
| Kaum mobile Optimierung (~165 responsive Klassen im gesamten Client, Sidebar-Layout) | Mobile-first UI-Pass nötig |
| Kein Service Worker / Offline | Offline-Checklisten als v1.1 einplanen |
| `StoreToolAssignment` / `ToolDefinition` existieren bereits | Tools ausblenden = Konfiguration, kein Code löschen |
| SQLite (1,7 MB), Express 5, Helmet, Rate-Limiting vorhanden | Für Pilot-Skala ausreichend; Backups einrichten |

## Empfehlung: Technologie

**Capacitor-Wrapper um den bestehenden React-19-Client** — kein Rewrite in React Native.

- Wiederverwendung von ~35.000 LOC Client-Code, ein Codebase für Web + iOS + Android
- Apple-Risiko (Guideline 4.2 „Minimum Functionality" bei Wrapper-Apps) wird entschärft durch echten nativen Mehrwert: Push-Notifications, Kamera (VM Foto-Compliance), Face ID/Biometric Login, Secure Storage, später Offline
- React Native wäre 3–4 Monate Rewrite ohne Business-Mehrwert in dieser Phase

## Wirkungsmodell: Wofür liefern die Tools messbare Ergebnisse?

Maßstab ist nicht der CFO-Blick (Zeitersparnis), sondern das, woran die Käufer-Personas im
Fashion Retail selbst gemessen werden: **Flächeneffizienz, Elevation der Fläche, Customer
Experience.** Zeitersparnis (ROI-Rechner) bleibt das Tür-Öffner-Argument, ist aber nachgelagert.

### Die drei Personas und woran sie gemessen werden

| Rolle | Wird gemessen an | Will morgens auf einen Blick sehen | KORE-Tools (Datenquelle) |
|---|---|---|---|
| **Store Manager** | Umsatz vs. Ziel, Conversion, ATV/UPT, Mystery/Audit-Score, Team-Performance | „Wie performt meine Fläche heute vs. gestern/Ziel — und was muss ich JETZT fixen?" | KPI-Eingabe, FR Tracking & Conversion (Footfall & Revenue), Checklisten, Standards |
| **Regional Manager** | LFL-Wachstum des Portfolios, Konsistenz der Stores, Execution-Speed von Direktiven, Talent-Pipeline | „Welche Stores fallen ab, WARUM, und wie schnell setzt die Region Vorgaben um?" | RM-Dashboard (Benchmark + Varianz), Audit-Scores, VM Time-to-Compliance, Multi-Store |
| **Country Manager** | Brand-Standard-Konsistenz landesweit, CX-Index, P&L, Fluktuation | „Sieht die Marke überall gleich premium aus — und zahlt Execution auf Umsatz ein?" | Brand-Standard-Index (aggregierte Scores), Korrelations-View, Kampagnen-Rollout-Speed |

### Ergebnis-Hierarchie (neu)

| Ebene | Messgrößen | Datenquelle (heute) | Status |
|---|---|---|---|
| **E1 Flächeneffizienz** | Conversion (Footfall→Bons), ATV/UPT, Sales per Staff Hour, €/m² | FootfallEntry (stündlich!), FRSession, KpiEntry (revenue/transactions/staffHours) | ⚠️ Daten entstehen, kein Trend/Ziel/Benchmark-Reporting. €/m² unmöglich — `Store` hat kein `sqm`-Feld |
| **E2 Elevation der Fläche** | Store-Excellence-Score-Trend, **Score-Varianz über Stores** (Konsistenz!), **VM Time-to-Compliance** (Direktive→Foto approved), Standards-Erfüllung, Maintenance-Durchlaufzeit | AuditSession, VmGuideline→VmSubmission (Timestamps vorhanden), StandardEvaluation, MaintenanceRequest | ⚠️ alles erfasst, nichts davon wird als Kennzahl berechnet |
| **E3 Customer Experience** | FR-Service-Niveau (Check-in→Betreuung), Clienteling-Aktivität (Follow-up-Quote, Termine, Wiederkauf), Kundenauftrags-Durchlaufzeit, NPS am POS | FRSession, ClientInteraction/ClientAppointment, CustomerOrder/OrderStatusUpdate | ⚠️ Rohdaten da; NPS/Kundenstimme fehlt komplett |
| **E4 Zeitersparnis (CFO)** | ersetzte Admin-Vorgänge × Zeitäquivalent → € (ROI-Rechner-Format) | — | ❌ fehlt (StoreBaseline + ToolEvent) |

### Der „Retail Intelligence"-Beweis (Differenzierung!)

Der eigentliche Produktname wird erst wahr, wenn KORE **E2→E1 korreliert**: „Stores mit
Audit-Score > 90 haben +x Pp Conversion und +y % UPT." Kein Wettbewerber im Mittelstand
liefert diesen Satz mit Kundendaten. Das ist die Folie, mit der der Country Manager das
Budget für den Rollout holt — und sie ist mit AuditSession × FootfallEntry/KpiEntry berechenbar.

### Was im Produkt fehlt, damit „messbar" wahr wird (neu in Phase 1)

1. **`Store.sqm` + Zielwerte** → Flächenproduktivität €/m², das Lieblings-KPI jedes Country Managers
2. **Kennzahlen-Berechnung E1–E3** — Conversion-Trend, FR-Conversion, Time-to-Compliance,
   Score-Varianz: alles aus vorhandenen Models ableitbar, heute nirgends berechnet
3. **Rollen-spezifische Home-Screens** — der erste Screen nach Login beantwortet die
   North-Star-Frage der Rolle (Tabelle oben), statt einer Tool-Liste
4. **NPS-Quick-Capture am POS** (1 Frage, 10 Sekunden, anonym) — einzige echte Lücke für E3
5. **Korrelations-/Benchmark-View im RM-Dashboard** (E2→E1, Cross-Store-Varianz)
6. **`StoreBaseline` + `ToolEvent`** (für E4 + Vorher/Nachher-Beweis aller Ebenen)
7. **Wirkungs-Dashboard + Pilot-Report (PDF)** — Ergebnisse in E1–E4-Struktur, pdfmake vorhanden

**Pilot-Playbook (Phase 3):** Woche 0 Baseline (KPIs + Scores + Admin-Zeit) → Woche 1–4 Nutzung →
automatischer Ergebnis-Report entlang E1–E4. Damit ist „Ergebnisse in 4 Wochen" ein Produktfeature,
kein Marketingsatz.

## Empfehlung: Launch-Set (9 Tools statt 36)

Sortiert nach Ergebnis-Hierarchie — jedes Tool zahlt auf E1, E2 oder E3 ein:

**E1 Flächeneffizienz:**
1. **KPI-Schnelleingabe** (KpiEntry mobil: Umsatz/Bons/Frequenz/Staff-Hours als 30-Sekunden-Tageseingabe)
2. **FR Tracking & Conversion** (Footfall & Revenue: stündliche Frequenz → Conversion, Ziele, Optimierung)
   — ⚠️ existiert im Code doppelt (`floor.fr_tracking` mit FootfallEntry + `customer.fr_conversion` mit
   FRRoom/FRSession): in Phase 1 zu EINEM Tool konsolidieren

**E2 Elevation der Fläche:**
3. **Store Excellence Audit** — zweitreifstes Tool, Kern des KORE-Angebots
4. **Checklisten & Audits** — reifstes Tool (Server 1.519 LOC)
5. **VM Foto-Compliance** — Kamera = nativer Mehrwert Nr. 1, liefert Time-to-Compliance
6. **Store Standards** — laufende Standard-Erfüllung zwischen Audits

**E3 Customer Experience / Kommunikation:**
7. **Briefings / My Day** — täglicher Einstiegspunkt (inkl. heutige Zahlen + offene Tasks)
8. **Team-Push + Handover** — Träger der Push-Notifications, Schichtübergabe

**Kaufentscheider-Sicht:**
9. **RM-Dashboard** — Benchmark, Score-Varianz, Korrelations-View (E2→E1)

Bewusst NICHT im Mobile-Launch: Budget Tracker, Forecast, volles KPI-Dashboard, SOP-Bibliothek,
Clienteling (E3-Kandidat für v1.1, braucht aber DSGVO-Review für Kundendaten am Privatgerät),
Live-Floor (v1.1). Metrix bleibt web-only und wird das Scorecard-Backbone für den Pilot-Report.

Alle anderen Tools: per `ToolDefinition`/`StoreToolAssignment` deaktivieren — bleiben in der Web-App verfügbar bzw. werden dort schrittweise gehärtet. Nichts löschen.

## Demand-First: Native Pilot-App mit VM Compliance + Checklisten

**Es liegen konkrete Kundenanfragen für VM Compliance und Checklisten vor — der Kunde besteht
auf einer nativen App** (Stand 10.6.2026). Entscheidender Hebel: „native App" heißt NICHT
„öffentlicher App-Store-Launch". Verteilung an Pilot-Kunden geht deutlich früher:

- **iOS: TestFlight** — bis 10.000 externe Tester, Beta-Review in 1–3 Tagen (viel leichter als
  App-Review), Installation über Einladungslink. Falls der Kunde „echte" Installation ohne
  Beta-Charakter verlangt: **Apple Unlisted App Distribution** (App Store, aber nur per Link
  auffindbar — ideal B2B) als Stufe 2.
- **Android: Play Closed Testing** — Einladungsliste, sofort nach Account-Verifizierung; im
  Notfall direkte APK-Verteilung.

### Was die Pilot-Kunden konkret wollen (Stand 10.6.)

1. **Sicherstellen, dass der Store exakt nach Vorgaben umgesetzt ist** → vorhandener
   Guideline→Submission→Review-Flow, zu ergänzen: Seite-an-Seite-Vergleich (Referenzfoto vs.
   Einreichung), Nachbesserungs-Schleife (REJECTED → Re-Submission), Abdeckungs-Übersicht
   (welche Zone/Kategorie in welchem Store noch offen)
2. **Kurzfristig und unangekündigt Store-Fotos anfordern** → **existiert noch nicht** (geprüft:
   kein Request/Deadline-Konzept im Code). Neues Feature **„Spot-Check"**:
   - RM/Zentrale erstellt Anfrage: Anweisung, Bereich, optional Referenzfoto, Ziel-Stores
     (einzeln/Region/alle), **Deadline** (z. B. 60 Minuten oder „heute 18:00")
   - **Push auf den Sperrbildschirm** → tippen → Kamera öffnet direkt → Foto + Kommentar absenden
   - Live-Status-Board für den Anforderer: geliefert / approved / überfällig, mit Countdown
   - Kennzahlen je Store/Region: **Reaktionszeit**, On-Time-Quote, First-Pass-Approval-Quote
   - Datenmodell: `PhotoRequest` + `PhotoRequestTarget` (Status je Store); `VmSubmission`
     bekommt optionales `requestId`
   - Genau dieses Feature rechtfertigt „native": unangekündigt funktioniert nur mit Push,
     und Push+Kamera in einem Fluss kann der Browser nicht

3. **„Checklisten" = gemeinsamer Store-Visit:** RM besucht den Store regelmäßig, geht die Punkte
   GEMEINSAM mit dem Store-Team durch, jeder Punkt bekommt ein **Rating** und bei Bedarf ein
   **Follow-up**; über die Zeit entsteht eine **Entwicklungskurve**, und Stores werden
   **miteinander verglichen**. Code-Mapping:
   - Rating je Punkt + Kommentar + Foto: ✅ existiert (`AuditResponse.scorePercent/passed`,
     Store-Excellence-Audit — NICHT das einfache Abhak-Tool `checklisten`)
   - Score-Verlauf über Zeit: ✅ Endpoint existiert (`/reports/trends`)
   - Cross-Store-Vergleich: ⚠️ rudimentär in reports.ts, braucht Benchmark-View (Ranking je
     Kategorie, Region-Filter) → zahlt direkt aufs RM-Dashboard ein
   - **Follow-up je Punkt: ❌ fehlt komplett** (einziges `followUpDate`-Feld der App liegt im
     Coaching-Tool). Neues Model `FollowUpAction`: Bezug auf AuditResponse, Beschreibung,
     Verantwortlicher, Fälligkeit, Status, Erledigungs-Nachweis (Foto). **Beim nächsten Visit
     desselben Stores werden offene Follow-ups automatisch zu Beginn angezeigt** („Was ist seit
     dem letzten Besuch passiert?") — das schließt den Kreislauf Visit → Maßnahme → Wirkung
   - Pilot-Kennzahlen: Score-Entwicklung je Store/Kategorie, Follow-up-Erledigungsquote,
     Time-to-Resolution — alles Store-Ebene (Mitbestimmung!)

⚠️ Nebenbefund Code: `vm-compliance/index.ts` enthält eine zweite Generation derselben Routen
(„checks" parallel zu guidelines/submissions/reviews) — beim Härten konsolidieren. Das
Abhak-Tool `checklisten` (ChecklistTemplate/Entry) bleibt für tägliche Routinen erhalten,
ist aber NICHT der Visit-Flow.

### Track A — Native Pilot-App (Ziel: Mitte Juli auf dem Handy des Kunden)

| KW | Schritt |
|---|---|
| **24 (sofort!)** | Apple Developer Program (Organisation, D-U-N-S) + Google Play Console beantragen — **kritischer Pfad, heute starten**. Parallel: Capacitor-Setup |
| 24–27 | Nur VM Compliance + Checklisten mobile härten (Foto-Flow, Touch, QA, Empty States) + **Spot-Check-Feature bauen** (PhotoRequest, Push→Kamera-Flow, Status-Board, Seite-an-Seite-Review) + native Shell: Push, Kamera, Secure-Storage-Auth, Icons/Splash im KORE CI |
| 24–27 | Kennzahlen: Time-to-Compliance (Timestamps existieren), Checklisten-Quote, Score-Trend, `StoreBaseline` |
| **28 (~13. Juli)** | TestFlight + Closed Testing beim Kunden, Baseline-Erhebung Woche 0 |
| 29–32 (Aug) | 4-Wochen-Pilot → automatischer Ergebnis-Report (PDF) → Vertragsabschluss |

Scope-Disziplin: Die Pilot-App enthält NUR diese 2 Tools + Login + Benachrichtigungen.
Jedes weitere Tool gefährdet den Juli-Termin.

### Track C — Enterprise-Readiness (Pflicht: Kunde ist Dior/LVMH, Review angekündigt)

Ein LVMH-Vendor-Assessment prüft Infrastruktur, Prozesse und Legal — nicht Features.
Befund vom 10.6.2026 (Server-Audit):

**Was heute schon besteht:** Uploads nur authentifiziert abrufbar (`/api/uploads` hinter
`authenticate`), Helmet + Rate-Limiting, JWT + Refresh + bcrypt, Zod-Validierung,
AuditLog- und DataProcessingConsent-Modelle, Hosting Hetzner Deutschland.

**Kritische Lücken (vor Pilot-Start beheben):**
1. ~~`server/.env` und `kore.db` waren world-readable (644)~~ → behoben (600, 10.6.)
2. **Shared Server:** KORE-Produktion teilt sich die Maschine mit 5+ anderen Projekten
   (everthine-api, cockpit, openclaw-gateway/Lotta inkl. WhatsApp-Anbindung, Blog-Generator),
   alles läuft als **root**; Node-Dienste binden auf `0.0.0.0:3002/:5000/:18789` an nginx vorbei
   → **dedizierter Server/VM nur für KORE-Prod**, eigener Service-User, Firewall (nur 80/443/22),
   SSH-Härtung (kein Root-Login, Key-only)
3. **Keine Backups** für kore.db und Uploads → täglich, verschlüsselt, offsite (Hetzner Storage
   Box), Recovery getestet und dokumentiert
4. **Kein MFA** — mindestens für kore_admin/tenant_admin; SSO (OIDC/SAML) auf Roadmap, da
   LVMH-IT das üblicherweise fordert
5. **Pen-Test/Security-Audit** vor Go-Live durch externen Dienstleister — die Website behauptet
   bereits „regelmäßige Security-Audits", das muss belegbar sein
6. Dependency-/Vulnerability-Scanning (npm audit + Renovate/Dependabot), Incident-Response-Prozess,
   Monitoring/SLA-Dokument

**Legal-Paket (parallel erstellen, VOR Vertragsunterschrift liefern können):**
- AVV nach Art. 28 DSGVO + TOMs-Dokument + Verarbeitungsverzeichnis
- Subprozessoren-Liste: Hetzner (DE), E-Mail-Provider prüfen! (`resend` im Code = US-Anbieter —
  widerspricht dem Website-Versprechen „keine US-Cloud"; Lettermint/Brevo als EU-Alternative
  konsequent durchziehen)
- Löschkonzept (v. a. Foto-Retention) + Datenschutzerklärung der App
- **DSFA (DPIA) für Spot-Check-Fotos empfohlen** — Store-Fotos können Mitarbeiter zeigen
- ⚠️ **Mitbestimmung beim Kunden:** Unangekündigte Spot-Checks mit Reaktionszeit-Messung können
  als Leistungs-/Verhaltenskontrolle gelten (§ 87 BetrVG) → Kennzahlen NUR auf Store-Ebene
  (nie pro Mitarbeiter), Foto-Anweisung „keine Personen im Bild", Retention z. B. 90 Tage.
  Das proaktiv ins Konzept schreiben — beeindruckt im Review und schützt den Deal.

**Zeitwirkung:** Infrastruktur-Umzug + Legal-Paket laufen parallel zur Feature-Entwicklung
(KW 25–28). Pilot-Start bleibt Mitte/Ende Juli, ABER: Legal-Paket früh an Dior-Procurement
schicken — deren Review-Durchlauf dauert oft länger als unsere Entwicklung.

### Track B — Öffentlicher Store-Launch (Mitte September, wie unten)
Die übrigen 7 Launch-Tools bekommen ihren Mobile-Pass im August (während der Pilot läuft),
öffentlicher Launch mit allen 9 Tools Mitte September. Pilot-Feedback härtet die Hero-Features,
und der Apple-Review sieht eine App mit aktiven Nutzern und referenzierbaren Ergebnissen.

## Fahrplan

### Phase 0 — Entscheidungen & Langläufer starten (KW 24–25, bis 21. Juni)
- [ ] Launch-Set final festlegen (Vorschlag oben)
- [ ] **Sofort beantragen (Vorlauf 1–3 Wochen!):** Apple Developer Program als Organisation (Muñoz Bonilla GmbH, D-U-N-S-Nummer nötig) + Google Play Console Business-Account
- [ ] Nicht-Launch-Tools über bestehende Tool-Zuweisung ausblenden
- [ ] Entscheidung Crash-/Error-Monitoring (Empfehlung: Sentry)

### Phase 1 — Mobile-Reife der Kern-Tools (KW 25–28, ~4 Wochen)
**Reihenfolge: VM Compliance + Checklisten ZUERST (Track A, bis ~28. Juni), dann die übrigen 7.**
- [ ] Mobile-first UI-Pass: Bottom-Navigation statt Sidebar, Touch-Targets, Safe-Areas
- [ ] Tool-Härtung: QA-Durchlauf je Tool, Empty States, Fehlerbehandlung, Ladezustände
- [ ] **FR-Konsolidierung:** `fr-tracking` + `fr-conversion` zu einem Tool zusammenführen (Routen, Hooks, Pages, ToolDefinition) — Duplikat aus der Bauphase
- [ ] Backend: Push-Service (Firebase Cloud Messaging für Android + APNs für iOS), neues Prisma-Model `DeviceToken`, Push-Trigger in Team-Push, Briefings, Checklisten-Fälligkeiten
- [ ] Refresh-Token-Flow für native: Secure Storage statt Cookie
- [ ] **Wirkungsmodell implementieren (E1–E4):** `Store.sqm`, Kennzahlen-Berechnung (Conversion-Trend, FR-Conversion, Time-to-Compliance, Score-Varianz), rollen-spezifische Home-Screens, NPS-Quick-Capture, `StoreBaseline` + `ToolEvent`, Wirkungs-Dashboard + PDF-Pilot-Report — siehe Abschnitt Wirkungsmodell

### Phase 2 — Native Shell (vorgezogen: ab sofort/KW 24, ~3 Wochen — Pilot-Scope zuerst)
- [ ] Capacitor-Setup iOS + Android, App-Icons & Splash im KORE CI (Cormorant/Jost, Brass #9E8460)
- [ ] Native Plugins: Camera (VM-Compliance), Push Notifications, Biometric Auth, Secure Storage
- [ ] Deep Links (app.kore-retail.de → App)
- [ ] CI/CD: Build-Pipeline (GitHub Actions existiert bereits für Deploy — erweitern um Fastlane o. ä.)

### Phase 3 — Beta (KW 29–32, Juli/August)
- [ ] TestFlight (iOS) + Play Internal Testing (Android)
- [ ] Web-Pilot-Kunden aus Track A werden TestFlight-Beta-Nutzer (kennen die Tools schon); ggf. 1–2 weitere Piloten onboarden — **immer mit Baseline-Erhebung in Woche 0**
- [ ] Nach 4 Wochen: automatischer Pilot-Ergebnis-Report (Zeitersparnis €, Score-Trends, KPI-Entwicklung) → Sales-Dokument für Vertragsabschluss
- [ ] Crash-Monitoring auswerten, Feedback-Schleife, Bugfixing
- [ ] Server-Härtung: tägliche SQLite-Backups, Uptime-Monitoring, verwaisten PM2-Prozess `kore-app` (id 1, errored) entfernen

### Phase 4 — Store-Launch (KW 35–37, Anfang–Mitte September)
- [ ] Store-Listings (Screenshots, Texte DE), Datenschutzerklärung, Apple Privacy Labels, Google Data Safety Form
- [ ] Review-Einreichung mit Demo-Account (Pflicht bei Login-only-Apps!) — Demo-Tenant existiert bereits
- [ ] Puffer für 1–2 Review-Ablehnungen einplanen
- [ ] 🚀 **Launch: Mitte September 2026**

### v1.1 (Q4 2026)
- Offline-Modus für Checklisten & Audits (lokale Queue + Sync)
- 2–4 weitere Tools nach Pilot-Feedback (Kandidaten: Shift-Planning, KPI-Dashboard, Pulse-Survey, Wellbeing)

## Timeline-Übersicht

```
Juni 2026        Juli 2026         August 2026       September 2026
|--Phase 0--|----Phase 1----|
       |----Phase 2----|
                       |------Phase 3 Beta------|
                                                |--Phase 4--| → LAUNCH
```

**Realistischer Launch: Mitte September 2026.**
Aggressiv (Beta verkürzt, Offline klar auf v1.1): Mitte/Ende August — nicht empfohlen, da Apple-Review bei Erstveröffentlichung von B2B-Wrapper-Apps der größte Unsicherheitsfaktor ist.

## Größte Risiken

1. **Apple Review (Guideline 4.2)** — Mitigation: Push + Kamera + Biometrie von Anfang an, sauberes natives Gefühl
2. **Mobile-UX-Aufwand unterschätzt** — die App ist heute Desktop-first; der UI-Pass ist der größte Einzelposten
3. **Developer-Account-Vorlauf** — D-U-N-S/Verifizierung kann sich ziehen → diese Woche starten
4. **Scope Creep** — 8 Tools sind genug; jedes weitere Tool verschiebt den Launch
