import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';

export function AboutPage() {
  usePageMeta({
    title: 'Über KORE | Nicole Muñoz Bonilla — 10+ Jahre Premium Retail Expertise im DACH Einzelhandel',
    description: 'KORE wurde von Nicole Muñoz Bonilla gegründet — über 10 Jahre Erfahrung im Premium Retail. Praxiserprobte Methoden und maßgeschneiderte digitale Tools für den stationären Einzelhandel in DACH.',
  });

  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="section-padding">
        <div className="container-default">
          <p className="label-default mb-4">Über KORE</p>
          <h1 className="font-display text-h1 text-kore-ink max-w-3xl">
            Retail-Expertise, geboren auf der Fläche
          </h1>
          <p className="font-display text-lead italic text-kore-mid mt-4 max-w-2xl">
            KORE wurde von Nicole Muñoz Bonilla gegründet — nach über einem Jahrzehnt operativer Führungserfahrung im Premium Einzelhandel. Als Unternehmensberatung, die den stationären Handel wirklich versteht.
          </p>
        </div>
      </section>

      {/* Gründerin */}
      <section className="section-padding bg-kore-surface">
        <div className="container-default">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-start">
            {/* Bild — links */}
            <div className="lg:col-span-2">
              <div className="relative">
                {/* Dekorativer Brass-Rahmen hinter dem Bild */}
                <div className="absolute -bottom-4 -right-4 w-full h-full border border-kore-brass/30 hidden lg:block" />
                <img
                  src="/nicole-munoz-bonilla.jpg"
                  alt="Nicole Muñoz Bonilla — Gründerin von KORE, Premium Retail Consulting"
                  className="w-full aspect-[3/4] object-cover object-top relative"
                  loading="eager"
                />
              </div>
            </div>

            {/* Text — rechts */}
            <div className="lg:col-span-3 flex flex-col gap-8">
              <div>
                <p className="label-default mb-3">Gründerin</p>
                <h2 className="font-display text-h1 text-kore-ink">Nicole Muñoz Bonilla</h2>
                <p className="font-body text-small text-kore-brass mt-2">
                  Geschäftsführerin, planyvo GmbH
                </p>
              </div>

              <div className="border-l-[3px] border-l-kore-brass pl-8">
                <blockquote className="font-display text-h2 text-kore-ink italic">
                  &ldquo;Ich habe über zehn Jahre lang Stores geführt, Teams aufgebaut und operative Performance gemessen. KORE ist alles, was ich mir als Store Manager gewünscht hätte.&rdquo;
                </blockquote>
                <p className="font-body text-caption uppercase tracking-[0.16em] text-kore-mid mt-4">
                  Nicole Muñoz Bonilla, Gründerin
                </p>
              </div>

              <p className="font-body text-body text-kore-ink">
                Nicole Muñoz Bonilla bringt über ein Jahrzehnt Erfahrung im Premium-Segment mit — von der Kundenberatung über das Visual Merchandising bis zur strategischen Filialsteuerung. Als Store Managerin hat sie Teams aufgebaut, Verkaufsprozesse optimiert und KPI-getriebene Performance-Kultur in Filialen etabliert.
              </p>

              <p className="font-body text-body text-kore-mid">
                Aus der täglichen Arbeit auf der Fläche entstand die Überzeugung: Der stationäre Einzelhandel verdient bessere Werkzeuge. Nicht generische Management-Frameworks, nicht akademische Theorien — sondern praxiserprobte Methoden und maßgeschneiderte digitale Tools, die für den Alltag im Retail gebaut sind. So wurde KORE geboren.
              </p>

              <p className="font-body text-body text-kore-mid">
                Dieses operative Know-how fließt direkt in jedes Retail Consulting-Projekt, jedes Verkaufstraining und jede digitale Lösung von KORE. Nicole versteht, was auf der Fläche funktioniert — und was nicht. Genau das macht den Unterschied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Was KORE ausmacht */}
      <section className="section-padding">
        <div className="container-default">
          <p className="label-default mb-4">Was KORE heute ist</p>
          <div className="max-w-2xl mb-10">
            <p className="font-body text-body text-kore-ink">
              KORE vereint persönliche Unternehmensberatung für den Einzelhandel mit individuell entwickelten digitalen Tools unter einem Dach. Das Ziel: Die operative Performance im stationären Handel messbar und nachhaltig verbessern — vom einzelnen Store bis zur gesamten Retail-Organisation im DACH-Raum.
            </p>
          </div>

          <p className="label-default mb-8">Was uns antreibt</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-accent">
              <h3 className="font-display text-h3 text-kore-ink mb-3">Praxisnähe</h3>
              <p className="font-body text-small text-kore-mid">
                Jede Empfehlung basiert auf echten Erfahrungen auf der Fläche. Kein Elfenbeinturm, kein Buzzword-Bingo.
              </p>
            </div>
            <div className="card-accent">
              <h3 className="font-display text-h3 text-kore-ink mb-3">Messbarkeit</h3>
              <p className="font-body text-small text-kore-mid">
                Was sich nicht messen lässt, lässt sich nicht verbessern. Wir arbeiten mit klaren Kennzahlen, KPI-Tracking und nachvollziehbaren Ergebnissen.
              </p>
            </div>
            <div className="card-accent">
              <h3 className="font-display text-h3 text-kore-ink mb-3">Nachhaltigkeit</h3>
              <p className="font-body text-small text-kore-mid">
                Quick Fixes sind nicht unser Ding. Wir bauen Strukturen und Fähigkeiten, die langfristig wirken.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Legal Entity */}
      <section className="section-padding bg-kore-surface">
        <div className="container-narrow">
          <p className="label-default mb-4">Unternehmen</p>
          <p className="font-body text-body text-kore-ink">
            KORE ist eine Marke der planyvo GmbH mit Sitz in Meerbusch, Deutschland. Geschäftsführer: Nicole Muñoz Bonilla und Mathis Wienand. Wir beraten Retailer im gesamten DACH-Raum.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-kore-ink">
        <div className="container-narrow text-center">
          <h2 className="font-display text-h1 text-kore-white">
            Lassen Sie uns sprechen
          </h2>
          <p className="font-display text-lead italic text-kore-faint mt-4 mb-10">
            Erzählen Sie uns von Ihren Herausforderungen — wir finden eine Lösung.
          </p>
          <Link to="/contact" className="btn-brass">
            Kontakt aufnehmen
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
