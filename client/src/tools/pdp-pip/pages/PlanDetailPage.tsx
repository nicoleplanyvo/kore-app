import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Compass, Plus, CheckCircle, Circle, Clock, AlertTriangle,
  Trash2, X, MessageSquare, Target, TrendingUp,
} from 'lucide-react';
import {
  useDevelopmentPlan, useCreateGoal, useUpdateGoal, useDeleteGoal,
  useCreateReview, useUpdateDevelopmentPlan,
} from '../../../hooks/usePdpPip';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const TYPE_LABELS: Record<string, string> = { PDP: 'Entwicklungsplan', PIP: 'Verbesserungsplan' };
const TYPE_COLORS: Record<string, string> = { PDP: 'bg-indigo-100 text-indigo-700', PIP: 'bg-orange-100 text-orange-700' };

const GOAL_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Nicht begonnen',
  IN_PROGRESS: 'In Arbeit',
  COMPLETED: 'Erreicht',
};
const GOAL_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-kore-bg text-kore-mid',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const PROGRESS_OPTIONS = [0, 10, 25, 50, 75, 90, 100];

export function PlanDetailPage() {
  const { id } = useParams();
  const { data: plan, isLoading } = useDevelopmentPlan(id);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const createReview = useCreateReview();
  const updatePlan = useUpdateDevelopmentPlan();

  // Goal form
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', measureOfSuccess: '', targetDate: '' });

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ overallProgress: 50, comments: '' });

  // Editing goal
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState(0);

  // Completion modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionComments, setCompletionComments] = useState('');
  const [pipResult, setPipResult] = useState<'COMPLETED' | 'CANCELLED'>('COMPLETED');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!plan) return <div className="p-xl text-body text-kore-mid">Plan nicht gefunden.</div>;

  const goals = plan.goals ?? [];
  const reviews = plan.reviews ?? [];
  const totalGoals = goals.length;
  const completedGoals = goals.filter((g: any) => g.status === 'COMPLETED').length;
  const avgProgress = totalGoals > 0
    ? Math.round(goals.reduce((s: number, g: any) => s + g.progress, 0) / totalGoals)
    : 0;

  const now = new Date();
  const isOverdue = plan.status === 'ACTIVE' && plan.targetDate && new Date(plan.targetDate) < now;
  const daysRemaining = plan.targetDate
    ? Math.ceil((new Date(plan.targetDate).getTime() - now.getTime()) / 86400000)
    : null;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate(
      { planId: plan.id, ...goalForm },
      {
        onSuccess: () => {
          setShowGoalForm(false);
          setGoalForm({ title: '', measureOfSuccess: '', targetDate: '' });
        },
      },
    );
  };

  const handleGoalStatusChange = (goalId: string, status: string) => {
    const progress = status === 'COMPLETED' ? 100 : status === 'NOT_STARTED' ? 0 : undefined;
    updateGoal.mutate({ planId: plan.id, goalId, status, ...(progress !== undefined ? { progress } : {}) });
  };

  const handleProgressUpdate = (goalId: string, progress: number) => {
    const status = progress === 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
    updateGoal.mutate({ planId: plan.id, goalId, progress, status });
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!confirm('Ziel wirklich loeschen?')) return;
    deleteGoal.mutate({ planId: plan.id, goalId });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    createReview.mutate(
      { planId: plan.id, ...reviewForm },
      {
        onSuccess: () => {
          setShowReviewForm(false);
          setReviewForm({ overallProgress: 50, comments: '' });
        },
      },
    );
  };

  const handleCompletePlan = () => {
    // Create final review + update status
    const finalStatus = plan.type === 'PIP' ? pipResult : 'COMPLETED';
    createReview.mutate(
      {
        planId: plan.id,
        overallProgress: finalStatus === 'COMPLETED' ? 100 : avgProgress,
        comments: completionComments || (finalStatus === 'COMPLETED' ? 'Plan abgeschlossen.' : 'Plan nicht bestanden.'),
      },
      {
        onSuccess: () => {
          updatePlan.mutate({ id: plan.id, status: finalStatus });
          setShowCompleteModal(false);
        },
      },
    );
  };

  const handleCancelPlan = () => {
    if (!confirm('Plan wirklich abbrechen? Dies kann nicht rueckgaengig gemacht werden.')) return;
    updatePlan.mutate({ id: plan.id, status: 'CANCELLED' });
  };

  const progressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-blue-500';
    if (pct >= 25) return 'bg-amber-500';
    return 'bg-red-400';
  };

  return (
    <div className="p-lg max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/pdp-pip" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-sm">
            <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
              <Compass size={24} /> {plan.title}
            </h1>
            {isOverdue && (
              <span className="text-red-500" title="Ueberfaellig">
                <AlertTriangle size={18} />
              </span>
            )}
          </div>
          <div className="flex items-center gap-md text-body text-kore-mid mt-xs">
            <span className={`px-sm py-xs text-small ${TYPE_COLORS[plan.type]}`}>
              {TYPE_LABELS[plan.type] ?? plan.type}
            </span>
            <span className={`px-sm py-xs text-small ${STATUS_COLORS[plan.status]}`}>
              {STATUS_LABELS[plan.status] ?? plan.status}
            </span>
          </div>
        </div>
      </div>

      {/* Plan Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-xs text-kore-mid uppercase mb-xs">Mitarbeiter</div>
          <div className="font-medium text-kore-ink">{plan.user?.name ?? '---'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-xs text-kore-mid uppercase mb-xs">Manager</div>
          <div className="font-medium text-kore-ink">{plan.manager?.name ?? '---'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-xs text-kore-mid uppercase mb-xs">Zieldatum</div>
          <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-kore-ink'}`}>
            {plan.targetDate ? new Date(plan.targetDate).toLocaleDateString('de-DE') : '---'}
            {daysRemaining !== null && plan.status === 'ACTIVE' && (
              <span className={`text-xs ml-1 ${daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 7 ? 'text-amber-600' : 'text-kore-mid'}`}>
                ({daysRemaining < 0 ? `${Math.abs(daysRemaining)}T ueberfaellig` : `${daysRemaining}T verbleibend`})
              </span>
            )}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-xs text-kore-mid uppercase mb-xs">Gesamtfortschritt</div>
          <div className="flex items-center gap-sm">
            <div className="flex-1 bg-kore-bg rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${progressColor(avgProgress)}`}
                style={{ width: `${avgProgress}%` }}
              />
            </div>
            <span className="text-lg font-bold text-kore-ink">{avgProgress}%</span>
          </div>
          <div className="text-xs text-kore-mid mt-xs">
            {completedGoals}/{totalGoals} Ziele erreicht
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {plan.status === 'ACTIVE' && (
        <div className="flex gap-sm mb-lg">
          <button
            onClick={() => setShowCompleteModal(true)}
            className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-white text-small hover:bg-emerald-700"
          >
            <CheckCircle size={14} />
            {plan.type === 'PIP' ? 'PIP abschliessen' : 'Plan abschliessen'}
          </button>
          <button
            onClick={handleCancelPlan}
            className="flex items-center gap-xs px-md py-sm border border-red-200 text-red-600 text-small hover:bg-red-50"
          >
            <X size={14} /> Abbrechen
          </button>
        </div>
      )}

      {/* Goals Section */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm">
            <Target size={18} /> Ziele
          </h2>
          {plan.status === 'ACTIVE' && (
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90"
            >
              <Plus size={14} /> Ziel hinzufuegen
            </button>
          )}
        </div>

        {showGoalForm && (
          <form onSubmit={handleAddGoal} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel (SMART)</label>
              <input
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                placeholder="Spezifisch, messbar, erreichbar, relevant, terminiert"
                className="w-full border border-kore-border px-md py-sm text-body"
                required
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Erfolgsmessung</label>
              <input
                value={goalForm.measureOfSuccess}
                onChange={(e) => setGoalForm({ ...goalForm, measureOfSuccess: e.target.value })}
                placeholder="Woran wird der Erfolg gemessen?"
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Zieldatum</label>
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
            <div className="flex gap-sm">
              <button
                type="submit"
                disabled={createGoal.isPending}
                className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
              >
                Hinzufuegen
              </button>
              <button
                type="button"
                onClick={() => setShowGoalForm(false)}
                className="px-md py-sm border border-kore-border text-small text-kore-mid"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {!goals.length ? (
          <p className="text-body text-kore-mid bg-kore-white border border-kore-border p-lg text-center">
            Keine Ziele definiert. Fuegen Sie SMART-Ziele hinzu.
          </p>
        ) : (
          <div className="space-y-sm">
            {goals.map((g: any) => {
              const goalOverdue = g.status !== 'COMPLETED' && g.targetDate && new Date(g.targetDate) < now;
              return (
                <div key={g.id} className="bg-kore-white border border-kore-border p-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-sm flex-1">
                      <button
                        onClick={() => {
                          if (plan.status !== 'ACTIVE') return;
                          if (g.status === 'COMPLETED') handleGoalStatusChange(g.id, 'IN_PROGRESS');
                          else if (g.status === 'IN_PROGRESS') handleGoalStatusChange(g.id, 'COMPLETED');
                          else handleGoalStatusChange(g.id, 'IN_PROGRESS');
                        }}
                        className={`mt-0.5 ${plan.status !== 'ACTIVE' ? 'cursor-default' : 'cursor-pointer'}`}
                        disabled={plan.status !== 'ACTIVE'}
                      >
                        {g.status === 'COMPLETED' ? (
                          <CheckCircle size={18} className="text-emerald-500" />
                        ) : g.status === 'IN_PROGRESS' ? (
                          <TrendingUp size={18} className="text-blue-500" />
                        ) : (
                          <Circle size={18} className="text-kore-mid" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-sm">
                          <span className={`font-medium ${g.status === 'COMPLETED' ? 'text-emerald-600 line-through' : 'text-kore-ink'}`}>
                            {g.title}
                          </span>
                          {goalOverdue && (
                            <span className="text-red-500" title="Ueberfaellig">
                              <AlertTriangle size={12} />
                            </span>
                          )}
                        </div>
                        {g.measureOfSuccess && (
                          <p className="text-small text-kore-mid mt-xs">Erfolgsmessung: {g.measureOfSuccess}</p>
                        )}
                        {g.targetDate && (
                          <p className={`text-small mt-xs flex items-center gap-1 ${goalOverdue ? 'text-red-500' : 'text-kore-mid'}`}>
                            <Clock size={12} />
                            {new Date(g.targetDate).toLocaleDateString('de-DE')}
                          </p>
                        )}

                        {/* Progress bar */}
                        <div className="mt-sm">
                          {editingGoal === g.id ? (
                            <div className="flex items-center gap-sm">
                              <div className="flex gap-1">
                                {PROGRESS_OPTIONS.map((pct) => (
                                  <button
                                    key={pct}
                                    onClick={() => setEditProgress(pct)}
                                    className={`px-xs py-xs text-xs border ${editProgress === pct ? 'border-kore-brass bg-kore-brass/10 text-kore-brass font-bold' : 'border-kore-border text-kore-mid'}`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => handleProgressUpdate(g.id, editProgress)}
                                className="px-sm py-xs bg-kore-ink text-kore-white text-xs"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingGoal(null)}
                                className="text-xs text-kore-mid"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <div
                              className={`flex items-center gap-sm ${plan.status === 'ACTIVE' ? 'cursor-pointer' : ''}`}
                              onClick={() => {
                                if (plan.status !== 'ACTIVE') return;
                                setEditProgress(g.progress);
                                setEditingGoal(g.id);
                              }}
                            >
                              <div className="flex-1 bg-kore-bg rounded-full h-2 max-w-xs">
                                <div
                                  className={`h-2 rounded-full transition-all ${progressColor(g.progress)}`}
                                  style={{ width: `${g.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-kore-mid">{g.progress}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-sm ml-md">
                      <span className={`px-sm py-xs text-xs ${GOAL_STATUS_COLORS[g.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                        {GOAL_STATUS_LABELS[g.status] ?? g.status}
                      </span>
                      {plan.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="text-kore-mid hover:text-red-500"
                          title="Ziel loeschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reviews / Check-Ins Section */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm">
            <MessageSquare size={18} /> Gespraeche / Reviews
          </h2>
          {plan.status === 'ACTIVE' && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90"
            >
              <Plus size={14} /> Review hinzufuegen
            </button>
          )}
        </div>

        {showReviewForm && (
          <form onSubmit={handleAddReview} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Gesamtfortschritt (%)</label>
              <div className="flex items-center gap-sm">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={reviewForm.overallProgress}
                  onChange={(e) => setReviewForm({ ...reviewForm, overallProgress: Number(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-kore-ink w-12 text-right">{reviewForm.overallProgress}%</span>
              </div>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kommentare / Gespraechsnotiz</label>
              <textarea
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                rows={4}
                placeholder="Fortschritt, Hindernisse, naechste Schritte..."
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
            <div className="flex gap-sm">
              <button
                type="submit"
                disabled={createReview.isPending}
                className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
              >
                Review speichern
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-md py-sm border border-kore-border text-small text-kore-mid"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        {!reviews.length ? (
          <p className="text-body text-kore-mid bg-kore-white border border-kore-border p-lg text-center">
            Keine Reviews vorhanden.
          </p>
        ) : (
          <div className="space-y-sm">
            {reviews.map((r: any) => (
              <div key={r.id} className="bg-kore-white border border-kore-border p-md">
                <div className="flex items-center justify-between mb-sm">
                  <div className="flex items-center gap-sm text-small text-kore-mid">
                    <Clock size={14} />
                    {new Date(r.reviewDate).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <span className="text-kore-ink font-medium">{r.reviewer?.name ?? '---'}</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <div className="w-20 bg-kore-bg rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${progressColor(r.overallProgress)}`}
                        style={{ width: `${r.overallProgress}%` }}
                      />
                    </div>
                    <span className="font-bold text-kore-ink">{r.overallProgress}%</span>
                  </div>
                </div>
                {r.comments && (
                  <p className="text-body text-kore-mid whitespace-pre-wrap">{r.comments}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowCompleteModal(false)}>
          <div className="bg-kore-white w-full max-w-md p-xl rounded-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">
                {plan.type === 'PIP' ? 'PIP abschliessen' : 'Plan abschliessen'}
              </h2>
              <button onClick={() => setShowCompleteModal(false)} className="text-kore-mid hover:text-kore-ink">
                <X size={20} />
              </button>
            </div>

            <div className="bg-kore-bg border border-kore-border p-md mb-lg space-y-2 text-small">
              <div className="flex justify-between">
                <span className="text-kore-mid">Ziele erreicht</span>
                <span className="font-medium">{completedGoals}/{totalGoals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-kore-mid">Durchschnittl. Fortschritt</span>
                <span className="font-medium">{avgProgress}%</span>
              </div>
            </div>

            {plan.type === 'PIP' && (
              <div className="mb-lg">
                <label className="block text-small text-kore-mid mb-sm">Ergebnis</label>
                <div className="flex gap-sm">
                  <button
                    onClick={() => setPipResult('COMPLETED')}
                    className={`flex-1 flex items-center justify-center gap-sm p-md border-2 ${pipResult === 'COMPLETED' ? 'border-emerald-500 bg-emerald-50' : 'border-kore-border'}`}
                  >
                    <CheckCircle size={18} className="text-emerald-500" />
                    <span className="font-medium">Bestanden</span>
                  </button>
                  <button
                    onClick={() => setPipResult('CANCELLED')}
                    className={`flex-1 flex items-center justify-center gap-sm p-md border-2 ${pipResult === 'CANCELLED' ? 'border-red-500 bg-red-50' : 'border-kore-border'}`}
                  >
                    <X size={18} className="text-red-500" />
                    <span className="font-medium">Nicht bestanden</span>
                  </button>
                </div>
              </div>
            )}

            <div className="mb-lg">
              <label className="block text-small text-kore-mid mb-xs">Abschlusskommentar</label>
              <textarea
                value={completionComments}
                onChange={(e) => setCompletionComments(e.target.value)}
                rows={3}
                placeholder={plan.type === 'PIP' ? 'Begruendung des Ergebnisses...' : 'Zusammenfassung des Abschlussgespraechs...'}
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>

            <button
              onClick={handleCompletePlan}
              disabled={createReview.isPending || updatePlan.isPending}
              className={`w-full flex items-center justify-center gap-sm px-md py-md text-white font-medium disabled:opacity-50 ${
                plan.type === 'PIP' && pipResult === 'CANCELLED'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <CheckCircle size={18} />
              {plan.type === 'PIP'
                ? pipResult === 'COMPLETED' ? 'PIP als bestanden abschliessen' : 'PIP als nicht bestanden abschliessen'
                : 'Plan abschliessen'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
