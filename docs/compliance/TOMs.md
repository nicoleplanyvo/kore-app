# Technische und Organisatorische Maßnahmen (TOM)
## gemäß Art. 32 DSGVO — KORE Retail Platform

**ENTWURF — juristisch und durch Geschäftsführung zu prüfen, vor Weitergabe an Dior.**

| | |
|---|---|
| Auftragsverarbeiter | Muñoz Bonilla GmbH („KORE"), Benediktusstraße 46, 40549 Düsseldorf, HRB 88958 AG Düsseldorf |
| Anwendung | KORE Retail Platform (app.kore-retail.de) |
| Hosting | Hetzner Online GmbH, Rechenzentren Deutschland (Nürnberg/Falkenstein) — Auftragsverarbeitung mit AVV |
| Stand | Juni 2026 |

> Legende: **[✓ umgesetzt]** im aktuellen System verifiziert · **[→ Migration]** wird mit dem
> dedizierten Server (siehe Runbook) hergestellt · **[geplant]** terminiert auf Roadmap.

## 1. Vertraulichkeit (Art. 32 Abs. 1 lit. b)

### 1.1 Zutrittskontrolle (physisch)
- Hosting in ISO-27001-zertifizierten Hetzner-Rechenzentren in Deutschland; Zutrittssicherung,
  Videoüberwachung und Zugangskontrolle durch den Betreiber (Nachweis: Hetzner-TOM/Zertifikate). **[✓]**

### 1.2 Zugangskontrolle (System)
- Authentifizierung über JSON Web Tokens (kurzlebiger Access-Token + httpOnly-Refresh-Token). **[✓]**
- Passwörter ausschließlich als **bcrypt-Hash** (Cost-Faktor 12), niemals im Klartext. **[✓]**
- Rollen-Hierarchie mit serverseitiger Durchsetzung (kore_admin > tenant_admin > regional_manager
  > multisite_manager > store_manager > learner). **[✓]**
- Brute-Force-Schutz: Rate-Limiting auf Auth-Endpunkten (20 Anfragen/15 Min/IP),
  global 100/15 Min. **[✓]**
- SSH key-only, kein Root-Login, fail2ban. **[→ Migration]**
- **Mehr-Faktor-Authentifizierung (TOTP)** für administrative Rollen. **[geplant]**

### 1.3 Zugriffskontrolle (Daten)
- Mandantentrennung: jeder Datensatz ist einem `tenantId` zugeordnet; serverseitige Filterung
  in allen Abfragen. **[✓]**
- Store-bezogene Zugriffsbeschränkung pro Nutzer (`toolStoreIds`), serverseitig erzwungen. **[✓]**
- Hochgeladene Fotos nur authentifiziert abrufbar (Static-Mount hinter Auth-Middleware);
  generierte Dateinamen (keine Erratbarkeit, kein Path-Traversal), MIME-Allowlist. **[✓]**
- Eingabevalidierung serverseitig (Zod) auf allen Endpunkten. **[✓]**

### 1.4 Trennungskontrolle
- Logische Mandantentrennung (s. 1.3). **[✓]**
- Dedizierter Server ausschließlich für KORE-Produktion, getrennt von Fremdsystemen. **[→ Migration]**
- Getrennte Umgebungen Entwicklung/Staging/Produktion. **[→ Migration]**

### 1.5 Pseudonymisierung / Datenminimierung
- Kennzahlen (z. B. Spot-Check-Reaktionszeit, Compliance-Quoten) werden **ausschließlich auf
  Store-Ebene** erhoben — keine personenbezogene Mitarbeiter-Auswertung (Design-Entscheidung,
  in der UI dokumentiert; relevant für § 87 BetrVG). **[✓]**
- Fotoanweisungen enthalten den Hinweis „keine Personen im Bild". **[✓]**

## 2. Integrität (Art. 32 Abs. 1 lit. b)

### 2.1 Weitergabekontrolle
- Transportverschlüsselung TLS (Let's Encrypt), HSTS. **[✓ / → Migration für HSTS]**
- Keine personenbezogenen Daten in URL-Parametern. **[✓]**
- Sicherheits-Header via Helmet inkl. Content-Security-Policy (in Produktion aktiv). **[✓]**

### 2.2 Eingabekontrolle
- Manipulationssicheres **Audit-Log** (AuditLog-Modell) für sicherheitsrelevante Vorgänge. **[✓]**
- Review-/Freigabe-Workflows mit Zeitstempel und Prüfer-Zuordnung (Spot-Checks, Submissions). **[✓]**
- Upload-Pipeline gehärtet: ungültige Dateitypen werden sauber abgewiesen (HTTP 400), kein
  Prozess-Absturz (DoS-Vektor behoben). **[✓]**

## 3. Verfügbarkeit und Belastbarkeit (Art. 32 Abs. 1 lit. b, c)

### 3.1 Verfügbarkeitskontrolle
- **Tägliche, verschlüsselte Backups** (Datenbank + Uploads), Offsite auf Hetzner Storage Box,
  Retention 30 Tage, **monatlicher Restore-Test dokumentiert**. **[→ Migration]**
- Prozess-Überwachung und Auto-Restart (PM2), Reboot-Persistenz. **[✓]**
- Uptime-Monitoring und Alarmierung. **[→ Migration]**
- Automatische Sicherheitsupdates (unattended-upgrades). **[→ Migration]**

### 3.2 Rasche Wiederherstellbarkeit (Art. 32 Abs. 1 lit. c)
- Dokumentierter Wiederherstellungsprozess (Runbook), Recovery-Test-Protokoll. **[→ Migration]**

## 4. Verfahren zur regelmäßigen Überprüfung (Art. 32 Abs. 1 lit. d)

- **Dependency-/Vulnerability-Scanning** (npm audit, automatisierte Updates). **[geplant]**
- **Externer Penetrationstest vor Go-Live** und danach regelmäßig. **[geplant]**
- Code-Review-Prozess vor Deployments; getrennte Branches, Build-Verifikation. **[✓]**
- Datenschutz-Folgenabschätzung für die Foto-Verarbeitung (s. separates Dokument DSFA). **[✓ Entwurf]**

## 5. Auftragskontrolle
- Subunternehmer/Subprozessoren nur mit AVV; aktuelle Liste:
  - **Hetzner Online GmbH** (Hosting, DE) — AVV vorhanden.
  - **E-Mail-Versand**: EU-Anbieter (Brevo/Lettermint) — ⚠️ **offen**: im Code ist zusätzlich
    `resend` (US-Anbieter) referenziert; vor Go-Live konsequent auf EU-Anbieter umstellen,
    da andernfalls Widerspruch zum Versprechen „keine US-Cloud" und Drittlandtransfer.
- Subprozessoren-Liste wird aktuell gehalten und dem Verantwortlichen zur Verfügung gestellt.

## 6. Offene Punkte vor Dior-Freigabe (Zusammenfassung)
1. Migration auf dedizierten Server abschließen (Punkte **[→ Migration]**)
2. MFA für Admin-Rollen umsetzen
3. E-Mail-Subprozessor auf EU vereinheitlichen (`resend` entfernen)
4. Externen Penetrationstest beauftragen
5. Dependency-Scanning automatisieren
6. Dieses Dokument juristisch finalisieren und als Anlage zum AVV beifügen
