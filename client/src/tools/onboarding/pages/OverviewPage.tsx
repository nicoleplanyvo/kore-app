import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, FileText, Route, List } from 'lucide-react';
import { useOnboardingTemplates, useOnboardingJourneys } from '../../../hooks/useOnboarding';

const STATUS_COLORS: Record<string, string> = { ACTIVE: 'bg-emerald-500', COMPLETED: 'bg-blue-500', CANCELLED: 'bg-red-500' };
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };

export function OverviewPage() {
  const { data: templates, isLoading: tlLoading } = useOnboardingTemplates();
  const { data: journeys, isLoading: jLoading } = useOnboardingJourneys({ pageSize: 5 });

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Onboarding</h1>
          <p className="text-body text-kore-mid mt-xs">Neue Mitarbeiter systematisch einarbeiten</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl flex-wrap">
        <Link to="/tools/onboarding/templates" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <FileText size={14} /> Templates verwalten
        </Link>
        <Link to="/tools/onboarding/journeys" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <Route size={14} /> Alle Journeys
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-lg mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Templates</div>
          <div className="text-h2 font-display text-kore-ink">{tlLoading ? '...' : templates?.length ?? 0}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Aktive Journeys</div>
          <div className="text-h2 font-display text-kore-ink">{jLoading ? '...' : journeys?.total ?? 0}</div>
        </div>
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-md">Neueste Journeys</h2>
      {jLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !journeys?.data?.length ? (
        <div className="text-body text-kore-mid">Keine Journeys vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {journeys.data.map((j: any) => (
            <Link key={j.id} to={`/tools/onboarding/journeys/${j.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between mb-xs">
                <span className="font-medium text-kore-ink flex items-center gap-xs">
                  <UserPlus size={14} /> {j.user?.name ?? 'Unbekannt'}
                </span>
                <div className="flex items-center gap-xs">
                  <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[j.status] ?? 'bg-kore-mid'}`} />
                  <span className="text-small text-kore-mid">{STATUS_LABELS[j.status] ?? j.status}</span>
                </div>
              </div>
              <div className="flex gap-lg text-small text-kore-mid">
                <span>{j.template?.name ?? '—'}</span>
                {j.store && <span>{j.store.name}</span>}
                {j.mentor && <span>Mentor: {j.mentor.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="font-display text-h3 text-kore-ink mb-md mt-xl">Templates</h2>
      {tlLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !templates?.length ? (
        <div className="text-body text-kore-mid">Keine Templates vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div>
                <span className="font-medium text-kore-ink flex items-center gap-xs"><List size={14} /> {t.name}</span>
                <div className="text-small text-kore-mid mt-xs">
                  {t.role && <span>{t.role} · </span>}
                  {t.durationDays} Tage · {t._count?.steps ?? 0} Schritte · {t._count?.journeys ?? 0} Journeys
                  {t.isDefault && <span className="text-emerald-600 ml-sm">Standard</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
