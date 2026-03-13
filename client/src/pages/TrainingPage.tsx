import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Award, Users, BookOpen } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta';

export function TrainingPage() {
  usePageMeta({
    title: 'Verkaufstraining Einzelhandel | Personalentwicklung & E-Learning Retail | KORE',
    description: 'Praxisnahe Verkaufstrainings, digitale Lernpfade und Führungskräfteentwicklung für den Einzelhandel. Store Manager Coaching, Onboarding und Service Excellence — KORE Training.',
  });

  return (
    <div className="pt-14">
      {/* Hero */}
      <section className="section-padding">
        <div className="container-default">
          <p className="label-default mb-4">Verkaufstraining Einzelhandel</p>
          <h1 className="font-display text-h1 text-kore-ink max-w-3xl">
            Praxisnahe Trainings, die auf der Fläche wirken
          </h1>
          <p className="font-display text-lead italic text-kore-mid mt-4 max-w-2xl">
            Verkaufstraining, Personalentwicklung und digitale Lernpfade für den Einzelhandel — von Kundenansprache bis Visual Merchandising. Für Retail-Teams, die täglich performen müssen.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-kore-surface">
        <div className="container-default">
          <p className="label-default mb-8">Schulung & Weiterbildung</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-default">
              <BookOpen size={24} className="text-kore-brass mb-4" />
              <h3 className="font-display text-h3 text-kore-ink mb-3">Verkaufstraining vor Ort</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Intensive Präsenz-Workshops für Store-Teams im Einzelhandel. Verkaufspsychologie, Kundentypen, Upselling-Techniken und Service Excellence — praxisnah und interaktiv.
              </p>
            </div>
            <div className="card-default">
              <Smartphone size={24} className="text-kore-brass mb-4" />
              <h3 className="font-display text-h3 text-kore-ink mb-3">E-Learning & Onboarding Plattform</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Digitale Lernpfade und Onboarding für den Einzelhandel auf dem Smartphone. Kurze Module, interaktive Quizzes und Video-Content — perfekt für den Retail-Alltag.
              </p>
            </div>
            <div className="card-default">
              <Users size={24} className="text-kore-brass mb-4" />
              <h3 className="font-display text-h3 text-kore-ink mb-3">Führungskräfteentwicklung & Coaching</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Langfristige Personalentwicklung für Filialleiter und High Potentials im Retail. Store Manager Coaching, Talent Development und Succession Planning — für weniger Fluktuation, mehr Performance.
              </p>
            </div>
            <div className="card-default">
              <Award size={24} className="text-kore-brass mb-4" />
              <h3 className="font-display text-h3 text-kore-ink mb-3">Zertifizierung</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Abschluss mit KORE-Zertifikat. Nachweisbare Qualifikation für Mitarbeiter und ein klares Signal an Kunden und Partner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Themen */}
      <section className="section-padding">
        <div className="container-default">
          <p className="label-default mb-8">Trainingsthemen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'Kundenansprache & Bedarfsanalyse',
              'Upselling & Cross-Selling',
              'Visual Merchandising',
              'Service Excellence',
              'Beschwerdemanagement',
              'KPI-Verständnis für Teams',
              'Zeitmanagement auf der Fläche',
              'Clienteling & CRM',
              'Führung im Retail',
            ].map((topic) => (
              <div key={topic} className="border-l-[3px] border-l-kore-brass pl-4 py-2">
                <p className="font-body text-body font-normal text-kore-ink">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-kore-ink">
        <div className="container-narrow text-center">
          <h2 className="font-display text-h1 text-kore-white">
            Trainings, die Ergebnisse liefern
          </h2>
          <p className="font-display text-lead italic text-kore-faint mt-4 mb-10">
            Lassen Sie uns über ein maßgeschneidertes Trainingsprogramm für Ihr Team sprechen.
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
