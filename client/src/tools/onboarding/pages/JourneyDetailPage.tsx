import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle, Circle, SkipForward } from 'lucide-react';
import { useOnboardingJourney, useUpdateOnboardingStep } from '../../../hooks/useOnboarding';

const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };
const STEP_STATUS_ICONS: Record<string, any> = {
  PENDING: <Circle size={16} className="text-kore-mid" />,
  COMPLETED: <CheckCircle size={16} className="text-emerald-500" />,
  SKIPPED: <SkipForward size={16} className="text-amber-500" />,
};
const STEP_STATUS_LABELS: Record<string, string> = { PENDING: 'Ausstehend', COMPLETED: 'Erledigt', SKIPPED: 'Übersprungen' };

export function JourneyDetailPage() {
  const { id } = useParams();
  const { data: journey, isLoading } = useOnboardingJourney(id);
  const updateStep = useUpdateOnboardingStep();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!journey) return <div className="p-xl text-body text-kore-mid">Journey nicht gefunden.</div>;

  const handleCompleteStep = (stepId: string) => {
    updateStep.mutate({ journeyId: journey.id, stepId, status: 'COMPLETED' });
  };

  const handleSkipStep = (stepId: string) => {
    updateStep.mutate({ journeyId: journey.id, stepId, status: 'SKIPPED' });
  };

  const completedCount = journey.progress?.filter((p: any) => p.status === 'COMPLETED' || p.status === 'SKIPPED').length ?? 0;
  const totalSteps = journey.progress?.length ?? 0;
  const pct = totalSteps > 0 ? Math.round(completedCount / totalSteps * 100) : 0;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/onboarding/journeys" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <UserPlus size={24} /> {journey.user?.name ?? 'Unbekannt'}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {journey.template?.name ?? '—'} · {STATUS_LABELS[journey.status] ?? journey.status}
            {journey.store && ` · ${journey.store.name}`}
            {journey.mentor && ` · Mentor: ${journey.mentor.name}`}
          </p>
        </div>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-small text-kore-mid">Fortschritt</span>
          <span className="text-small font-medium text-kore-ink">{completedCount} / {totalSteps} ({pct}%)</span>
        </div>
        <div className="w-full bg-kore-bg rounded-full h-3">
          <div className="bg-emerald-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-lg text-small text-kore-mid mt-sm">
          <span>Start: {new Date(journey.startDate).toLocaleDateString('de-DE')}</span>
          {journey.completedAt && <span>Abgeschlossen: {new Date(journey.completedAt).toLocaleDateString('de-DE')}</span>}
        </div>
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-md">Schritte</h2>
      {!journey.progress?.length ? (
        <p className="text-body text-kore-mid">Keine Schritte vorhanden.</p>
      ) : (
        <div className="space-y-sm">
          {journey.progress.map((p: any) => (
            <div key={p.id} className="bg-kore-white border border-kore-border p-md flex items-center gap-md">
              <div className="flex-shrink-0">
                {STEP_STATUS_ICONS[p.status] ?? <Circle size={16} className="text-kore-mid" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${p.status === 'COMPLETED' ? 'text-emerald-600 line-through' : p.status === 'SKIPPED' ? 'text-amber-600' : 'text-kore-ink'}`}>
                    {p.step?.title ?? 'Schritt'}
                  </span>
                  <span className="text-small text-kore-mid">{STEP_STATUS_LABELS[p.status] ?? p.status}</span>
                </div>
                {p.step?.description && <p className="text-small text-kore-mid mt-xs">{p.step.description}</p>}
                <div className="flex gap-sm text-small text-kore-mid mt-xs">
                  {p.step?.dayNumber && <span>Tag {p.step.dayNumber}</span>}
                  {p.step?.category && <span>{p.step.category}</span>}
                  {p.step?.isRequired && <span className="text-amber-600">Pflicht</span>}
                  {p.completedAt && <span>Erledigt: {new Date(p.completedAt).toLocaleDateString('de-DE')}</span>}
                </div>
                {p.notes && <p className="text-small text-kore-mid mt-xs italic">{p.notes}</p>}
              </div>
              {p.status === 'PENDING' && journey.status === 'ACTIVE' && (
                <div className="flex gap-xs flex-shrink-0">
                  <button onClick={() => handleCompleteStep(p.step.id)} disabled={updateStep.isPending} className="px-sm py-xs bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50" title="Erledigt">
                    <CheckCircle size={14} />
                  </button>
                  {!p.step?.isRequired && (
                    <button onClick={() => handleSkipStep(p.step.id)} disabled={updateStep.isPending} className="px-sm py-xs bg-amber-500 text-kore-white text-small hover:opacity-90 disabled:opacity-50" title="Überspringen">
                      <SkipForward size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
