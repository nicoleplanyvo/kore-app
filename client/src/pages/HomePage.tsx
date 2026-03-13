import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, GraduationCap, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react';
import t from '../locales/de.json';
import { usePageMeta } from '../hooks/usePageMeta';

export function HomePage() {
  usePageMeta({
    title: 'KORE — Retail Intelligence | Analyse, Strategie & Custom Tools für Einzelhandel',
    description: 'KORE analysiert operative Painpoints im Einzelhandel, entwickelt individuelle Strategien und baut maßgeschneiderte digitale Tools — KPI-Dashboards, Trainingsplattformen & mehr. Premium Retail Consulting für DACH.',
  });

  return (
    <div className="pt-14">
      {/* === HERO === */}
      <section className="min-h-[90vh] flex items-center relative overflow-hidden">
        {/* Dekorativer Brass-Kreis rechts oben */}
        <div className="absolute -right-32 -top-32 w-[400px] h-[400px] rounded-full border border-kore-brass-lt/20 hidden lg:block" />
        <div className="absolute -right-16 -top-16 w-[300px] h-[300px] rounded-full border border-kore-brass-lt/10 hidden lg:block" />

        <div className="container-default w-full">
          <div className="max-w-4xl">
            {/* Brass Accent Line */}
            <div className="w-12 h-[2px] bg-kore-brass mb-8 animate-fade-up" />

            <h1 className="font-display text-display text-kore-ink leading-[0.92] animate-fade-up">
              {t.hero.title}
            </h1>
            <p className="font-display text-h1 text-kore-mid mt-2 animate-fade-up-delay-1">
              {t.hero.subtitle}
            </p>
            <p className="font-display text-lead italic text-kore-mid mt-8 max-w-xl animate-fade-up-delay-2">
              {t.hero.lead}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-12 animate-fade-up-delay-3">
              <Link to="/audit" className="btn-brass">
                {t.hero.cta_primary}
                <ArrowRight size={16} />
              </Link>
              <Link to="/consulting" className="btn-secondary">
                {t.hero.cta_secondary}
              </Link>
            </div>
          </div>

          {/* Stat Bar */}
          <div className="mt-20 pt-8 border-t border-kore-border grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl sm:text-[2.8rem] font-light text-kore-brass leading-none">
                10+
              </span>
              <span className="font-body text-small font-normal text-kore-mid">
                {t.hero.stat_experience}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl sm:text-[2.8rem] font-light text-kore-brass leading-none">
                  3
                </span>
                <span className="font-body text-small font-normal text-kore-mid">
                  {t.hero.stat_streams}
                </span>
              </div>
              <p className="font-body text-small font-normal text-kore-brass/70 mt-1 pl-[2.6rem] sm:pl-[3.4rem]">
                {t.hero.stat_streams_sub}
              </p>
            </div>
            <div>
              <span className="font-display text-3xl sm:text-[2.8rem] font-light text-kore-brass leading-none">
                DACH
              </span>
              <p className="font-body text-small font-normal text-kore-mid mt-2">
                {t.hero.stat_region}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === SERVICES OVERVIEW === */}
      <section className="section-padding surface-pattern">
        <div className="container-default">
          <div className="flex items-center gap-4 mb-4">
            <p className="label-default">{t.services.heading}</p>
            <div className="flex-1 h-px bg-kore-border" />
          </div>
          <p className="font-body text-lead font-normal text-kore-mid mt-4 max-w-3xl">
            KORE arbeitet in drei aufeinander abgestimmten Bereichen — von der Analyse über die Befähigung Ihres Teams bis hin zu maßgeschneiderten digitalen Werkzeugen. Einzeln buchbar oder als integriertes Gesamtkonzept.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <ServiceCard
              icon={<Briefcase size={24} />}
              title={t.services.consulting.title}
              description={t.services.consulting.description}
              href="/consulting"
              num="01"
            />
            <ServiceCard
              icon={<GraduationCap size={24} />}
              title={t.services.training.title}
              description={t.services.training.description}
              href="/training"
              num="02"
            />
            <ServiceCard
              icon={<BarChart3 size={24} />}
              title={t.services.suite.title}
              description={t.services.suite.description}
              href="/suite"
              num="03"
            />
          </div>
        </div>
      </section>

      {/* === WARUM KORE === */}
      <section className="section-padding">
        <div className="container-default">
          <div className="flex items-center gap-4 mb-4">
            <p className="label-default">{t.why.heading}</p>
            <div className="flex-1 h-px bg-kore-border" />
          </div>
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            <div className="relative">
              <div className="border-l-[3px] border-l-kore-brass pl-8 relative">
                <blockquote className="font-display text-h1 text-kore-ink italic">
                  &ldquo;{t.why.quote}&rdquo;
                </blockquote>
                <div className="w-12 h-[2px] bg-kore-brass mt-6" />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <p className="font-body text-body font-normal text-kore-ink leading-relaxed">
                {t.why.text_1}
              </p>
              <p className="font-body text-body font-normal text-kore-mid leading-relaxed">
                {t.why.text_2}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === KORE SUITE TEASER === */}
      <section className="section-padding">
        <div className="container-default">
          <div className="flex items-center gap-4 mb-4">
            <p className="label-default">{t.suiteTeaser.heading}</p>
            <div className="flex-1 h-px bg-kore-border" />
          </div>
          <p className="font-display text-lead italic text-kore-mid mt-4 mb-12">
            {t.suiteTeaser.lead}
          </p>

          {/* 3 konkrete Problem → Lösung Beispiele */}
          <div className="flex flex-col gap-5 mb-12">
            {[
              {
                problem: 'Audit-Ergebnisse verschwinden in PDFs. Keiner verfolgt, ob Maßnahmen umgesetzt werden.',
                solution: 'Digitales Audit-System mit automatischem Follow-up, Aufgaben und Deadlines — nachverfolgbar pro Filiale.',
              },
              {
                problem: 'Das Team wird geschult, aber niemand weiß, ob es auf der Fläche wirkt. Kein Link zwischen Training und Performance.',
                solution: 'Trainingsplattform, die Lernfortschritt mit Verkaufskennzahlen verbindet — individuell für Ihre KPIs gebaut.',
              },
              {
                problem: 'Neue Standards werden definiert, aber im Alltag nicht eingehalten. Es fehlt ein System zur Umsetzungskontrolle.',
                solution: 'Custom Monitoring-Tool, das Standardeinhaltung pro Store trackt und Abweichungen sofort sichtbar macht.',
              },
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-kore-ink/[0.03] border border-kore-border rounded-md p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-kore-error shrink-0" />
                    <p className="font-body text-caption uppercase tracking-widest text-kore-error font-medium">Problem</p>
                  </div>
                  <p className="font-body text-small font-normal text-kore-ink leading-relaxed">
                    {item.problem}
                  </p>
                </div>
                <div className="bg-kore-brass/[0.04] border border-kore-brass/20 rounded-md p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} className="text-kore-brass shrink-0" />
                    <p className="font-body text-caption uppercase tracking-widest text-kore-brass font-medium">KORE Lösung</p>
                  </div>
                  <p className="font-body text-small font-normal text-kore-ink leading-relaxed">
                    {item.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Custom-Aspekt hervorheben */}
          <div className="border-l-[3px] border-l-kore-brass pl-6 mb-10">
            <p className="font-display text-h3 text-kore-ink italic">
              &ldquo;Gibt es für Ihr Problem noch kein Tool? Dann bauen wir es.&rdquo;
            </p>
            <p className="font-body text-small font-normal text-kore-mid mt-2">
              Jede Lösung wird individuell auf Ihren Betrieb zugeschnitten — kein Standard-SaaS, das halb passt.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/suite" className="btn-brass">
              Alle Module ansehen
              <ArrowRight size={16} />
            </Link>
            <Link to="/audit" className="btn-secondary">
              Ihr Problem besprechen
            </Link>
          </div>
        </div>
      </section>

      {/* === KONTAKT / CTA === */}
      <section className="section-padding gradient-dark relative overflow-hidden">
        {/* Dekorativer Kreis */}
        <div className="absolute -left-20 -bottom-20 w-[300px] h-[300px] rounded-full border border-kore-brass/10" />

        <div className="container-narrow text-center relative">
          <div className="w-12 h-[2px] bg-kore-brass mx-auto mb-8" />
          <h2 className="font-display text-h1 text-kore-white">
            {t.contactCta.heading}
          </h2>
          <p className="font-display text-lead italic text-kore-faint mt-6 mb-12">
            {t.contactCta.lead}
          </p>
          <Link to="/audit" className="btn-brass">
            {t.contactCta.cta}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  href,
  num,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  num: string;
}) {
  return (
    <Link to={href} className="card-default group block relative overflow-hidden">
      {/* Nummer oben rechts */}
      <span className="absolute top-6 right-6 font-display text-[3rem] font-light text-kore-border/60 leading-none select-none group-hover:text-kore-brass-lt/40 transition-colors">
        {num}
      </span>
      <div className="mb-5 text-kore-brass group-hover:text-kore-brass-dk transition-colors">{icon}</div>
      <h3 className="font-display text-h3 text-kore-ink mb-3 group-hover:text-kore-brass transition-colors">
        {title}
      </h3>
      <p className="font-body text-small font-normal text-kore-mid mb-6">
        {description}
      </p>
      <div className="flex items-center gap-2 text-kore-brass font-body text-caption uppercase tracking-widest group-hover:gap-3 transition-all">
        Mehr erfahren <ArrowRight size={12} />
      </div>
    </Link>
  );
}
