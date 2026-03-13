import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';

export function LegalPage() {
  usePageMeta({
    title: 'Impressum, Datenschutz & AGB | KORE — planyvo GmbH',
    description: 'Impressum, Datenschutzerklärung und Allgemeine Geschäftsbedingungen der planyvo GmbH (KORE). Rechtliche Informationen gemäß DSGVO.',
  });

  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [hash]);

  return (
    <div className="pt-14">
      {/* ═══════════════════ IMPRESSUM ═══════════════════ */}
      <section id="impressum" className="section-padding">
        <div className="container-narrow">
          <p className="label-default mb-4">Rechtliches</p>
          <h1 className="font-display text-h1 text-kore-ink mb-12">Impressum</h1>

          <div className="flex flex-col gap-6 font-body text-body text-kore-ink">
            <div>
              <p className="font-medium text-kore-ink">planyvo GmbH</p>
              <p>Rudolf-Diesel-Str. 5</p>
              <p>40670 Meerbusch</p>
              <p>Deutschland</p>
            </div>

            <div>
              <p className="label-default mb-2">Kontakt</p>
              <p>Telefon: +49 211 97263420</p>
              <p>E-Mail: hello@planyvo.com</p>
            </div>

            <div>
              <p className="label-default mb-2">Vertretungsberechtigt</p>
              <p>Geschäftsführer: Nicole Muñoz Bonilla, Mathis Wienand</p>
            </div>

            <div>
              <p className="label-default mb-2">Handelsregister</p>
              <p>Amtsgericht Neuss, HRB 23921</p>
            </div>

            <div>
              <p className="label-default mb-2">Umsatzsteuer-Identifikationsnummer</p>
              <p>gemäß § 27a Umsatzsteuergesetz: DE366129673</p>
            </div>

            <div>
              <p className="label-default mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</p>
              <p>Nicole Muñoz Bonilla</p>
              <p>Rudolf-Diesel-Str. 5, 40670 Meerbusch</p>
            </div>

            <div>
              <p className="label-default mb-2">Hinweis</p>
              <p className="text-kore-mid">
                KORE ist eine Marke der planyvo GmbH. Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung der planyvo GmbH.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ DATENSCHUTZ ═══════════════════ */}
      <section id="datenschutz" className="section-padding bg-kore-surface">
        <div className="container-narrow">
          <h2 className="font-display text-h1 text-kore-ink mb-4">Datenschutzerklärung</h2>
          <p className="font-body text-small text-kore-mid mb-12">Stand: Februar 2026</p>

          <div className="flex flex-col gap-8 font-body text-body text-kore-ink">
            {/* 1. Verantwortlicher */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">1. Verantwortlicher</h3>
              <p className="mb-2">
                planyvo GmbH<br />
                Rudolf-Diesel-Str. 5<br />
                40670 Meerbusch<br />
                Deutschland
              </p>
              <p>
                Geschäftsführer: Nicole Muñoz Bonilla, Mathis Wienand<br />
                E-Mail: hello@planyvo.com<br />
                Telefon: +49 211 97263420
              </p>
            </div>

            {/* 2. Übersicht */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">2. Übersicht der Verarbeitungen</h3>
              <p className="mb-3">
                <span className="font-medium">Arten der verarbeiteten Daten:</span> Bestandsdaten (Namen, Adressen), Kontaktdaten (E-Mail, Telefonnummern), Inhaltsdaten (Eingaben in Formularen), Nutzungsdaten (besuchte Seiten, Zugriffszeit), Meta-/Kommunikationsdaten (Geräte-Informationen, IP-Adressen).
              </p>
              <p>
                <span className="font-medium">Kategorien betroffener Personen:</span> Kunden, Interessenten, Website-Besucher, Geschäfts- und Vertragspartner.
              </p>
            </div>

            {/* 3. Rechtsgrundlagen */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">3. Rechtsgrundlagen</h3>
              <p>
                Die Verarbeitung personenbezogener Daten erfolgt auf Grundlage folgender Rechtsgrundlagen: Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), Vertragserfüllung und vorvertragliche Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO), rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO) sowie berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO).
              </p>
            </div>

            {/* 4. Website-Besuch */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">4. Erhebung und Verarbeitung bei Websitebesuch</h3>
              <p className="mb-3">
                Bei jedem Aufruf unserer Website werden automatisch folgende technisch notwendige Daten erhoben: IP-Adresse (anonymisiert), Datum und Uhrzeit des Zugriffs, Name und URL der abgerufenen Seite, Referrer-URL, verwendeter Browser und Betriebssystem sowie der Name des Access-Providers.
              </p>
              <p className="mb-3">
                Die vorübergehende Speicherung der IP-Adresse durch das System ist notwendig, um eine Auslieferung der Website an den Rechner des Nutzers zu ermöglichen. Die Daten werden gelöscht, sobald der Zweck der Erhebung entfällt.
              </p>
              <p className="text-kore-mid">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an der Bereitstellung und Sicherheit der Website.
              </p>
            </div>

            {/* 5. Kontaktformular */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">5. Kontakt- und Audit-Formulare</h3>
              <p className="mb-3">
                Wenn Sie unser Kontaktformular oder Audit-Anfrageformular nutzen, werden die von Ihnen eingegebenen Daten (Name, E-Mail-Adresse, Unternehmen, Nachricht bzw. Herausforderung) zwecks Bearbeitung Ihrer Anfrage verarbeitet und gespeichert.
              </p>
              <p className="mb-3">
                Diese Daten werden nicht ohne Ihre Einwilligung an Dritte weitergegeben. Die Daten werden gelöscht, sobald die Anfrage abschließend bearbeitet wurde, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
              </p>
              <p className="text-kore-mid">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Beantwortung von Anfragen).
              </p>
            </div>

            {/* 6. E-Mail */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">6. E-Mail-Kommunikation</h3>
              <p className="mb-3">
                Für den Versand transaktionaler E-Mails (z.B. Bestätigungen, Benachrichtigungen) nutzen wir den Dienst Resend. Dabei werden E-Mail-Adresse, Name und relevante Daten an Resend als Auftragsverarbeiter übermittelt.
              </p>
              <p className="text-kore-mid">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO bzw. Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an einer effektiven Kommunikation.
              </p>
            </div>

            {/* 7. Cookies */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">7. Cookies und Tracking</h3>
              <p className="mb-3">
                <span className="font-medium">Technisch notwendige Cookies:</span> Diese Website verwendet technisch notwendige Cookies, die für den Betrieb der Website erforderlich sind (z.B. Session-Cookies, Cookie-Consent-Einstellung). Diese Cookies können nicht deaktiviert werden.
              </p>
              <p className="mb-3">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an der technischen Funktionsfähigkeit der Website.
              </p>
              <p className="mb-3">
                <span className="font-medium">Analyse-Cookies (Google Analytics 4):</span> Mit Ihrer Einwilligung setzen wir Google Analytics 4 ein, um die Nutzung unserer Website statistisch auszuwerten. Dabei werden IP-Adressen anonymisiert (IP-Anonymisierung). Die Daten werden an Google LLC, USA, übermittelt. Google ist unter dem EU-US Data Privacy Framework zertifiziert.
              </p>
              <p className="mb-3">
                Google Analytics wird nur aktiviert, wenn Sie im Cookie-Banner ausdrücklich zustimmen. Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie den Cookie-Speicher Ihres Browsers löschen.
              </p>
              <p className="text-kore-mid">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO — Einwilligung. Weitere Informationen: <a href="https://policies.google.com/privacy" className="underline hover:text-kore-brass" target="_blank" rel="noopener noreferrer">Google Datenschutzerklärung</a>. Sie können die Erfassung durch Google Analytics auch über das <a href="https://tools.google.com/dlpage/gaoptout" className="underline hover:text-kore-brass" target="_blank" rel="noopener noreferrer">Browser-Add-on zur Deaktivierung von Google Analytics</a> verhindern.
              </p>
            </div>

            {/* 8. Hosting */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">8. Hosting und Content Delivery</h3>
              <p className="mb-3">
                Diese Website wird auf einem Server in der EU gehostet. Der Hosting-Anbieter kann technisch bedingt Zugriffsdaten (Server-Logfiles) erheben. Content Delivery Networks können dabei Nutzerdaten (insbesondere IP-Adressen) an CDN-Anbieter übermitteln.
              </p>
              <p className="text-kore-mid">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse an einer sicheren und effizienten Bereitstellung der Website.
              </p>
            </div>

            {/* 9. Ihre Rechte */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">9. Ihre Rechte als betroffene Person</h3>
              <p className="mb-3">Sie haben folgende Rechte in Bezug auf Ihre personenbezogenen Daten:</p>
              <ul className="list-disc list-inside space-y-2 text-kore-mid">
                <li><span className="font-medium text-kore-ink">Auskunftsrecht (Art. 15 DSGVO):</span> Bestätigung, ob personenbezogene Daten verarbeitet werden, und Zugang zu den Daten.</li>
                <li><span className="font-medium text-kore-ink">Berichtigungsrecht (Art. 16 DSGVO):</span> Berichtigung unrichtiger oder unvollständiger Daten.</li>
                <li><span className="font-medium text-kore-ink">Löschungsrecht (Art. 17 DSGVO):</span> Löschung Ihrer Daten, soweit die gesetzlichen Voraussetzungen vorliegen.</li>
                <li><span className="font-medium text-kore-ink">Einschränkung der Verarbeitung (Art. 18 DSGVO):</span> Einschränkung der Datenverarbeitung unter bestimmten Voraussetzungen.</li>
                <li><span className="font-medium text-kore-ink">Datenübertragbarkeit (Art. 20 DSGVO):</span> Erhalt Ihrer Daten in einem strukturierten, maschinenlesbaren Format.</li>
                <li><span className="font-medium text-kore-ink">Widerspruchsrecht (Art. 21 DSGVO):</span> Widerspruch gegen die Verarbeitung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.</li>
                <li><span className="font-medium text-kore-ink">Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</span> Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft.</li>
              </ul>
              <p className="mt-3">
                Kontaktieren Sie uns unter hello@planyvo.com zur Ausübung Ihrer Rechte.
              </p>
            </div>

            {/* 10. Beschwerderecht */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">10. Beschwerderecht</h3>
              <p>
                Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung Ihrer personenbezogenen Daten zu beschweren. Die zuständige Aufsichtsbehörde ist: Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestr. 2–4, 40213 Düsseldorf.
              </p>
            </div>

            {/* 11. Datensicherheit */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">11. Datensicherheit</h3>
              <p className="mb-3">
                Wir setzen umfangreiche technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten gegen Manipulation, Verlust, Zerstörung oder unbefugten Zugriff zu schützen:
              </p>
              <ul className="list-disc list-inside space-y-1 text-kore-mid">
                <li>SSL/TLS-Verschlüsselung</li>
                <li>Verschlüsselte Datenspeicherung</li>
                <li>Regelmäßige Sicherheitsupdates</li>
                <li>Zugriffskontrolle nach dem Minimalprinzip</li>
                <li>Automatisierte Backups</li>
              </ul>
            </div>

            {/* 12. Speicherdauer */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">12. Speicherdauer</h3>
              <p className="mb-3">
                Personenbezogene Daten werden nur so lange gespeichert, wie der Verarbeitungszweck dies erfordert oder gesetzliche Aufbewahrungspflichten bestehen.
              </p>
              <ul className="list-disc list-inside space-y-1 text-kore-mid">
                <li>Kontaktanfragen: Bis zur abschließenden Bearbeitung, maximal 6 Monate</li>
                <li>Vertragsdaten: Vertragsdauer zzgl. gesetzlicher Aufbewahrungsfrist (6 Jahre handelsrechtlich, 10 Jahre steuerrechtlich)</li>
                <li>Server-Logfiles: 7 Tage</li>
                <li>Analysedaten (Google Analytics): 14 Monate</li>
              </ul>
            </div>

            {/* 13. Drittlandtransfer */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">13. Drittlandtransfer</h3>
              <p>
                Eine Übermittlung personenbezogener Daten in Länder außerhalb des EWR erfolgt nur, wenn dies zur Vertragserfüllung erforderlich ist, gesetzlich vorgeschrieben oder auf Grundlage Ihrer Einwilligung. Auftragsverarbeiter in Drittländern gewährleisten ein angemessenes Schutzniveau durch EU-Standardvertragsklauseln und Angemessenheitsbeschlüsse.
              </p>
            </div>

            {/* 14. Aktualität */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">14. Aktualität und Änderungen</h3>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung bei Änderungen der Rechtslage oder bei Änderungen unserer Leistungen anzupassen. Die jeweils aktuelle Fassung finden Sie auf dieser Website.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ AGB ═══════════════════ */}
      <section id="agb" className="section-padding">
        <div className="container-narrow">
          <h2 className="font-display text-h1 text-kore-ink mb-4">Allgemeine Geschäftsbedingungen</h2>
          <p className="font-body text-small text-kore-mid mb-12">Stand: Februar 2026</p>

          <div className="flex flex-col gap-8 font-body text-body text-kore-ink">
            {/* § 1 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 1 Geltungsbereich</h3>
              <p className="mb-3">
                Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen der planyvo GmbH, Rudolf-Diesel-Str. 5, 40670 Meerbusch (nachfolgend „KORE" oder „Anbieter") und dem Kunden über die Erbringung von Beratungs-, Trainings- und Softwareentwicklungsleistungen im Bereich Retail.
              </p>
              <p>
                Abweichende Bedingungen des Kunden gelten nur, wenn der Anbieter diesen ausdrücklich schriftlich zugestimmt hat.
              </p>
            </div>

            {/* § 2 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 2 Vertragsgegenstand</h3>
              <p className="mb-3">
                KORE erbringt Beratungs- und Dienstleistungen im Bereich Retail, insbesondere:
              </p>
              <ul className="list-disc list-inside space-y-1 text-kore-mid mb-3">
                <li>Operative Audits und Painpoint-Analysen</li>
                <li>Individuelle Strategieentwicklung und Prozessoptimierung</li>
                <li>Verkaufstrainings, Coaching und E-Learning-Plattformen</li>
                <li>Entwicklung maßgeschneiderter digitaler Tools (KORE Suite)</li>
                <li>Laufendes Monitoring und Performance-Tracking</li>
              </ul>
              <p>
                Der konkrete Leistungsumfang ergibt sich aus dem jeweiligen individuellen Angebot bzw. der Leistungsbeschreibung.
              </p>
            </div>

            {/* § 3 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 3 Vertragsschluss</h3>
              <p className="mb-3">
                Die Darstellung der Leistungen auf der Website stellt kein verbindliches Angebot dar. Ein Vertrag kommt erst durch die schriftliche Bestätigung des Angebots durch den Anbieter zustande.
              </p>
              <p>
                Der Kunde bestätigt die Richtigkeit seiner Angaben und verpflichtet sich, Änderungen unverzüglich mitzuteilen.
              </p>
            </div>

            {/* § 4 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 4 Vergütung und Zahlungsbedingungen</h3>
              <p className="mb-3">
                Die Vergütung richtet sich nach dem individuellen Angebot. Alle Preise verstehen sich zzgl. der gesetzlichen Umsatzsteuer, soweit nicht anders angegeben.
              </p>
              <p className="mb-3">
                Rechnungen sind innerhalb von 14 Tagen nach Rechnungsdatum ohne Abzug fällig, sofern nicht abweichend vereinbart. Bei Zahlungsverzug gelten die gesetzlichen Regelungen.
              </p>
              <p>
                Für die Entwicklung individueller Software (KORE Suite Module) kann eine Anzahlung vereinbart werden. Die Modalitäten werden im jeweiligen Angebot festgelegt.
              </p>
            </div>

            {/* § 5 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 5 Mitwirkungspflichten des Kunden</h3>
              <p className="mb-3">
                Der Kunde stellt dem Anbieter alle für die Leistungserbringung erforderlichen Informationen, Daten und Unterlagen rechtzeitig und vollständig zur Verfügung.
              </p>
              <p>
                Der Kunde benennt einen Ansprechpartner, der für die Projektkoordination zuständig ist und Entscheidungen treffen kann.
              </p>
            </div>

            {/* § 6 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 6 Vertragsdauer und Kündigung</h3>
              <p className="mb-3">
                Einmalige Leistungen (Audits, Workshops) enden mit der Erbringung der vereinbarten Leistung. Laufende Leistungen (Beratung, Software) haben die im Angebot vereinbarte Mindestlaufzeit und Kündigungsfrist.
              </p>
              <p>
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt. Die Kündigung bedarf der Schriftform.
              </p>
            </div>

            {/* § 7 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 7 Geistiges Eigentum</h3>
              <p className="mb-3">
                Alle vom Anbieter erstellten Konzepte, Strategiedokumente, Analysen, Trainingsmaterialien und Software-Entwicklungen unterliegen dem Urheberrecht des Anbieters.
              </p>
              <p className="mb-3">
                Der Kunde erhält ein einfaches, nicht übertragbares Nutzungsrecht an den im Rahmen des Vertrags erstellten Arbeitsergebnissen für die Dauer des Vertragsverhältnisses. Eine Weitergabe an Dritte bedarf der vorherigen schriftlichen Zustimmung.
              </p>
              <p>
                Individuell entwickelte Software-Module (KORE Suite) werden dem Kunden nach vollständiger Bezahlung zur Nutzung überlassen. Der Quellcode verbleibt beim Anbieter, sofern nicht anders vereinbart.
              </p>
            </div>

            {/* § 8 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 8 Vertraulichkeit</h3>
              <p>
                Beide Parteien verpflichten sich, alle im Rahmen der Zusammenarbeit erhaltenen vertraulichen Informationen geheim zu halten und nur für den vereinbarten Zweck zu verwenden. Diese Verpflichtung besteht auch nach Beendigung des Vertragsverhältnisses fort.
              </p>
            </div>

            {/* § 9 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 9 Haftung</h3>
              <p className="mb-3">
                Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie für Schäden an Leben, Körper und Gesundheit. Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten, begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
              </p>
              <p>
                Die vorstehenden Haftungsbeschränkungen gelten auch zugunsten der Mitarbeiter und Erfüllungsgehilfen des Anbieters.
              </p>
            </div>

            {/* § 10 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 10 Datenschutz</h3>
              <p>
                Der Anbieter verarbeitet personenbezogene Daten des Kunden gemäß den Bestimmungen der DSGVO und des BDSG. Weitere Informationen finden sich in unserer Datenschutzerklärung. Soweit der Anbieter im Auftrag des Kunden personenbezogene Daten verarbeitet, schließen die Parteien einen Auftragsverarbeitungsvertrag gemäß Art. 28 DSGVO ab.
              </p>
            </div>

            {/* § 11 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 11 Änderungen der AGB</h3>
              <p>
                Der Anbieter behält sich Änderungen dieser AGB bei Änderungen der Rechtslage, Gerichtsentscheidungen, Marktgegebenheiten oder gleichwertigen Gründen vor, sofern hierdurch keine unangemessene Benachteiligung des Kunden entsteht. Änderungen werden dem Kunden mit einer Frist von 30 Tagen per E-Mail mitgeteilt.
              </p>
            </div>

            {/* § 12 */}
            <div>
              <h3 className="font-display text-h3 text-kore-ink mb-3">§ 12 Schlussbestimmungen</h3>
              <p className="mb-3">
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Düsseldorf. Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
              <p className="text-kore-mid">
                planyvo GmbH — Rudolf-Diesel-Str. 5, 40670 Meerbusch — hello@planyvo.com<br />
                Geschäftsführer: Nicole Muñoz Bonilla, Mathis Wienand
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
