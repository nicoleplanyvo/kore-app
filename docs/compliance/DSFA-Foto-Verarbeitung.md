# Datenschutz-Folgenabschätzung (DSFA / DPIA)
## Foto-Verarbeitung in der KORE Retail Platform (Spot-Checks & VM-Compliance)

**ENTWURF — durch Datenschutzbeauftragten/Anwalt zu finalisieren.** Erstellt durch den
Auftragnehmer als Unterstützung des Verantwortlichen gem. Art. 28 Abs. 3 lit. f, Art. 35 DSGVO.

## 1. Beschreibung der Verarbeitung
Die Plattform erlaubt es Regional-/Country-Managern, **kurzfristige, unangekündigte Foto-Anfragen
(„Spot-Checks")** an Filialen zu stellen (Bereich, Anweisung, Deadline). Filial-Teams reichen per
Smartphone-Kamera ein Foto der Verkaufsfläche ein; Manager geben frei oder fordern Nachbesserung.
Zusätzlich: VM-Compliance (geplante Foto-Einreichungen) und Follow-up-Nachweisfotos aus Store-Visits.

- **Zweck**: Sicherstellung einheitlicher Visual-Merchandising- und Flächenstandards.
- **Rechtsgrundlage** (durch Verantwortlichen final zu bestimmen): Art. 6 Abs. 1 lit. f
  (berechtigtes Interesse an Markenkonsistenz/Flächenexzellenz); im Beschäftigtenkontext
  § 26 BDSG bzw. Betriebsvereinbarung.
- **Gegenstand der Fotos**: Verkaufsfläche, Schaufenster, Ware, Mannequins — **ausdrücklich keine
  Personen** (UI-Hinweis bei jeder Aufnahme).

## 2. Notwendigkeit und Verhältnismäßigkeit
- Foto als Nachweis ist erforderlich, weil Text/Checkbox die tatsächliche Flächenumsetzung nicht
  belegen kann; mildere gleich wirksame Mittel sind nicht ersichtlich.
- **Datenminimierung**: Anweisung „keine Personen im Bild"; Kennzahlen ausschließlich auf
  **Store-Ebene** (keine Mitarbeiter-Leistungsprofile); generierte Dateinamen; Zugriff nur
  authentifiziert und rollen-/store-beschränkt.

## 3. Risiken für die Rechte und Freiheiten Betroffener

| # | Risiko | Eintritt | Schwere | Maßnahme |
|---|---|---|---|---|
| R1 | Zufällige Abbildung von **Mitarbeitenden/Kunden** auf Flächenfotos | mittel | mittel | UI-Hinweis „keine Personen"; Schulung; Möglichkeit der Ablehnung/Neuaufnahme; kurze Retention |
| R2 | **Leistungs-/Verhaltenskontrolle** von Mitarbeitenden durch unangekündigte Checks + Reaktionszeit-Messung (§ 87 Abs. 1 Nr. 6 BetrVG) | mittel | hoch | Kennzahlen **nur auf Store-Ebene**, nie pro Person; Transparenz; **Einbindung Betriebsrat/Betriebsvereinbarung** beim Verantwortlichen |
| R3 | Unbefugter Zugriff auf Fotos | gering | mittel | Auth-geschützter Abruf, TLS, Mandanten-/Store-Trennung, gehärteter Upload |
| R4 | Übermäßige Speicherdauer | mittel | gering | **Retention-Konzept** (Vorschlag: automatische Löschung nach 90 Tagen) |
| R5 | Drittlandtransfer (Hosting/E-Mail) | gering | mittel | Hosting Hetzner DE; E-Mail auf EU-Anbieter vereinheitlichen (`resend` entfernen) |

## 4. Abhilfemaßnahmen (Zusammenfassung)
1. **Store-Ebenen-Prinzip** für alle Kennzahlen — technisch umgesetzt und in der UI ausgewiesen.
2. **„Keine Personen im Bild"** — Hinweis bei jeder Aufnahme; Aufnahme ist ablehnbar/wiederholbar.
3. **Retention**: automatische Foto-Löschung nach definierter Frist (Vorschlag 90 Tage) — *umzusetzen*.
4. **Zugriffsschutz**: Authentifizierung, Rollen/Store-Scope, TLS, gehärtete Upload-Pipeline.
5. **Mitbestimmung**: Empfehlung an den Verantwortlichen, vor produktivem Einsatz eine
   **Betriebsvereinbarung** abzuschließen (Zweckbindung, Store-Ebene, Fristen, keine Sanktionsautomatik).
6. **Transparenz**: Information der Beschäftigten über Zweck und Umfang.

## 5. Bewertung
Bei Umsetzung der Maßnahmen 1–6 wird das Restrisiko als **vertretbar** eingeschätzt. Die
verbleibenden Hauptpunkte sind organisatorisch beim Verantwortlichen zu schließen (R2:
Mitbestimmung; R4: Retention final). Eine vorherige Konsultation der Aufsichtsbehörde (Art. 36)
ist bei Umsetzung der Maßnahmen voraussichtlich nicht erforderlich — finale Bewertung durch den
Datenschutzbeauftragten des Verantwortlichen.

## 6. Offene technische Umsetzungspunkte (KORE)
- [ ] Automatische Foto-Retention/Löschung (z. B. 90 Tage) implementieren — **noch offen**
- [ ] Foto-Löschung in Backups nach Retention sicherstellen
- [ ] E-Mail-Subprozessor auf EU vereinheitlichen
