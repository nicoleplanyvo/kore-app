import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  CheckCircle,
  Circle,
  SkipForward,
  Clock,
  XCircle,
  Users,
  Shield,
} from 'lucide-react';
import {
  useOnboardingJourney,
  useOnboardingUsers,
  useUpdateOnboardingStep,
  useUpdateJourneyStatus,
  useAssignMentor,
} from '../../../hooks/useOnboarding';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'Aktiv',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

const STEP_STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Circle size={16} className="text-kore-mid" />,
  IN_PROGRESS: <Clock size={16} className="text-amber-500" />,
  COMPLETED: <CheckCircle size={16} className="text-emerald-500" />,
  SKIPPED: <SkipForward size={16} className="text-amber-500" />,
};
const STEP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Erledigt',
  SKIPPED: 'Uebersprungen',
};

export function JourneyDetailPage() {
  const { id } = useParams();
  const { data: journey, isLoading } = useOnboardingJourney(id);
  const { data: users } = useOnboardingUsers();
  const updateStep = useUpdateOnboardingStep();
  const updateStatus = useUpdateJourneyStatus();
  const assignMentor = useAssignMentor();

  const [showMentorSelect, setShowMentorSelect] = useState(false);
  const [mentorId, setMentorId] = useState('');
  const [noteInput, setNoteInput] = useState<{ stepId: string; value: string } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!journey) return <div className="p-xl text-body text-kore-mid">Journey nicht gefunden.</div>;

  const handleCompleteStep = (stepId: string, notes?: string) => {
    updateStep.mutate({
      journeyId: journey.id,
      stepId,
      status: 'COMPLETED',
      notes: notes || undefined,
    });
    setNoteInput(null);
  };

  const handleSkipStep = (stepId: string) => {
    updateStep.mutate({ journeyId: journey.id, stepId, status: 'SKIPPED' });
  };

  const handleStartStep = (stepId: string) => {
    updateStep.mutate({ journeyId: journey.id, stepId, status: 'IN_PROGRESS' });
  };

  const handleCompleteJourney = () => {
    updateStatus.mutate({ id: journey.id, status: 'COMPLETED' });
  };

  const handleCancelJourney = () => {
    updateStatus.mutate({ id: journey.id, status: 'CANCELLED' });
  };

  const handleReactivate = () => {
    updateStatus.mutate({ id: journey.id, status: 'IN_PROGRESS' });
  };

  const handleAssignMentor = () => {
    assignMentor.mutate({ id: journey.id, mentorId: mentorId || null });
    setShowMentorSelect(false);
  };

  const progress: any[] = journey.progress ?? [];
  const completedCount = progress.filter(
    (p) => p.status === 'COMPLETED' || p.status === 'SKIPPED',
  ).length;
  const totalSteps = progress.length;
  const requiredTotal = progress.filter((p) => p.step?.isRequired).length;
  const requiredDone = progress.filter(
    (p) => p.step?.isRequired && (p.status === 'COMPLETED' || p.status === 'SKIPPED'),
  ).length;
  const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Collect categories for filter
  const categories = Array.from(
    new Set(progress.map((p) => p.step?.category).filter(Boolean)),
  ) as string[];

  // Group by day
  const filteredProgress = categoryFilter
    ? progress.filter((p) => p.step?.category === categoryFilter)
    : progress;

  const dayGroups = new Map<number, any[]>();
  filteredProgress.forEach((p) => {
    const day = p.step?.dayNumber ?? 0;
    const existing = dayGroups.get(day) ?? [];
    existing.push(p);
    dayGroups.set(day, existing);
  });
  const sortedDays = Array.from(dayGroups.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/onboarding/journeys"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <UserPlus size={24} /> {journey.user?.name ?? 'Unbekannt'}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {journey.template?.name ?? '--'} · {STATUS_LABELS[journey.status] ?? journey.status}
            {journey.store && ` · ${journey.store.name}`}
          </p>
        </div>
      </div>

      {/* Info + actions */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-small text-kore-mid">Fortschritt</span>
          <span className="text-small font-medium text-kore-ink">
            {completedCount} / {totalSteps} ({pct}%)
          </span>
        </div>
        <div className="w-full bg-kore-bg h-3">
          <div
            className={`h-3 transition-all ${
              journey.status === 'COMPLETED'
                ? 'bg-blue-500'
                : journey.status === 'CANCELLED'
                  ? 'bg-red-400'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="flex gap-lg text-small text-kore-mid mt-sm flex-wrap">
          <span>Start: {new Date(journey.startDate).toLocaleDateString('de-DE')}</span>
          {journey.template?.durationDays && (
            <span>Geplant: {journey.template.durationDays} Tage</span>
          )}
          <span>
            Pflicht: {requiredDone} / {requiredTotal}
          </span>
          {journey.completedAt && (
            <span>
              Abgeschlossen: {new Date(journey.completedAt).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>

        {/* Mentor */}
        <div className="mt-md flex items-center gap-sm flex-wrap">
          <span className="text-small text-kore-mid flex items-center gap-xs">
            <Users size={14} /> Buddy:
          </span>
          {journey.mentor ? (
            <span className="text-small text-kore-ink font-medium">{journey.mentor.name}</span>
          ) : (
            <span className="text-small text-kore-mid italic">Nicht zugewiesen</span>
          )}
          <button
            onClick={() => {
              setMentorId(journey.mentorId ?? '');
              setShowMentorSelect(!showMentorSelect);
            }}
            className="text-small text-kore-brass hover:text-kore-ink underline"
          >
            {journey.mentor ? 'Aendern' : 'Zuweisen'}
          </button>
        </div>
        {showMentorSelect && (
          <div className="flex items-center gap-sm mt-sm">
            <select
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="border border-kore-border px-sm py-xs text-small bg-kore-white"
            >
              <option value="">Kein Mentor</option>
              {(users ?? []).map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignMentor}
              disabled={assignMentor.isPending}
              className="px-sm py-xs bg-kore-ink text-kore-white text-small disabled:opacity-50"
            >
              Speichern
            </button>
          </div>
        )}

        {/* Actions */}
        {journey.status === 'IN_PROGRESS' && (
          <div className="flex gap-sm mt-md">
            <button
              onClick={handleCompleteJourney}
              disabled={updateStatus.isPending}
              className="flex items-center gap-xs px-md py-sm bg-blue-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <Shield size={14} /> Manager-Bestaetigung
            </button>
            <button
              onClick={handleCancelJourney}
              disabled={updateStatus.isPending}
              className="flex items-center gap-xs px-md py-sm border border-red-300 text-red-600 text-small hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle size={14} /> Abbrechen
            </button>
          </div>
        )}
        {(journey.status === 'COMPLETED' || journey.status === 'CANCELLED') && (
          <div className="mt-md">
            <button
              onClick={handleReactivate}
              disabled={updateStatus.isPending}
              className="flex items-center gap-xs px-md py-sm border border-kore-border text-small hover:bg-kore-bg disabled:opacity-50"
            >
              <Clock size={14} /> Reaktivieren
            </button>
          </div>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-xs mb-lg flex-wrap">
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-md py-xs text-small border transition-colors ${
              !categoryFilter
                ? 'bg-kore-ink text-kore-white border-kore-ink'
                : 'border-kore-border text-kore-mid hover:text-kore-ink'
            }`}
          >
            Alle
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-md py-xs text-small border transition-colors ${
                categoryFilter === cat
                  ? 'bg-kore-ink text-kore-white border-kore-ink'
                  : 'border-kore-border text-kore-mid hover:text-kore-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Steps grouped by day */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Schritte</h2>
      {!progress.length ? (
        <p className="text-body text-kore-mid">Keine Schritte vorhanden.</p>
      ) : (
        <div className="space-y-lg">
          {sortedDays.map(([day, steps]) => (
            <div key={day}>
              <h3 className="text-small font-medium text-kore-mid uppercase tracking-widest mb-sm">
                Tag {day}
              </h3>
              <div className="space-y-sm">
                {steps.map((p: any) => (
                  <div
                    key={p.id}
                    className="bg-kore-white border border-kore-border p-md flex items-start gap-md"
                  >
                    <div className="flex-shrink-0 mt-xs">
                      {STEP_STATUS_ICONS[p.status] ?? <Circle size={16} className="text-kore-mid" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-sm">
                        <span
                          className={`font-medium ${
                            p.status === 'COMPLETED'
                              ? 'text-emerald-600 line-through'
                              : p.status === 'SKIPPED'
                                ? 'text-amber-600'
                                : 'text-kore-ink'
                          }`}
                        >
                          {p.step?.title ?? 'Schritt'}
                        </span>
                        <span className="text-small text-kore-mid flex-shrink-0">
                          {STEP_STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </div>
                      {p.step?.description && (
                        <p className="text-small text-kore-mid mt-xs">{p.step.description}</p>
                      )}
                      <div className="flex gap-sm text-small text-kore-mid mt-xs flex-wrap">
                        {p.step?.category && (
                          <span className="px-xs py-0 border border-kore-border">{p.step.category}</span>
                        )}
                        {p.step?.isRequired && (
                          <span className="text-amber-600">Pflicht</span>
                        )}
                        {p.completedAt && (
                          <span>
                            Erledigt: {new Date(p.completedAt).toLocaleDateString('de-DE')}
                          </span>
                        )}
                        {p.verifiedBy && <span>Bestaetigt</span>}
                      </div>
                      {p.notes && (
                        <p className="text-small text-kore-mid mt-xs italic">{p.notes}</p>
                      )}

                      {/* Note input for completion */}
                      {noteInput?.stepId === p.step?.id && (
                        <div className="flex gap-sm mt-sm">
                          <input
                            value={noteInput!.value}
                            onChange={(e) =>
                              setNoteInput({ stepId: noteInput!.stepId, value: e.target.value })
                            }
                            placeholder="Notiz (optional)"
                            className="flex-1 border border-kore-border px-sm py-xs text-small"
                          />
                          <button
                            onClick={() => handleCompleteStep(p.step.id, noteInput!.value)}
                            disabled={updateStep.isPending}
                            className="px-sm py-xs bg-emerald-600 text-kore-white text-small disabled:opacity-50"
                          >
                            Erledigt
                          </button>
                          <button
                            onClick={() => setNoteInput(null)}
                            className="px-sm py-xs border border-kore-border text-small"
                          >
                            Abbrechen
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {journey.status === 'IN_PROGRESS' && p.status === 'PENDING' && (
                      <div className="flex gap-xs flex-shrink-0">
                        <button
                          onClick={() => handleStartStep(p.step.id)}
                          disabled={updateStep.isPending}
                          className="px-sm py-xs bg-amber-500 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                          title="Starten"
                        >
                          <Clock size={14} />
                        </button>
                        <button
                          onClick={() => setNoteInput({ stepId: p.step.id, value: '' })}
                          disabled={updateStep.isPending}
                          className="px-sm py-xs bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                          title="Erledigt"
                        >
                          <CheckCircle size={14} />
                        </button>
                        {!p.step?.isRequired && (
                          <button
                            onClick={() => handleSkipStep(p.step.id)}
                            disabled={updateStep.isPending}
                            className="px-sm py-xs bg-kore-mid text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                            title="Ueberspringen"
                          >
                            <SkipForward size={14} />
                          </button>
                        )}
                      </div>
                    )}
                    {journey.status === 'IN_PROGRESS' && p.status === 'IN_PROGRESS' && (
                      <div className="flex gap-xs flex-shrink-0">
                        <button
                          onClick={() => setNoteInput({ stepId: p.step.id, value: '' })}
                          disabled={updateStep.isPending}
                          className="px-sm py-xs bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                          title="Erledigt"
                        >
                          <CheckCircle size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
