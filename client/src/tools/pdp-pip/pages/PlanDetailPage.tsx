import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Target, Plus, CheckCircle, Circle } from 'lucide-react';
import { useDevelopmentPlan, useCreateGoal, useUpdateGoal, useCreateReview } from '../../../hooks/usePdpPip';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };
const GOAL_STATUS: Record<string, string> = { NOT_STARTED: 'Nicht gestartet', IN_PROGRESS: 'In Arbeit', COMPLETED: 'Erledigt', CANCELLED: 'Abgebrochen' };

export function PlanDetailPage() {
  const { id } = useParams();
  const { data: plan, isLoading } = useDevelopmentPlan(id);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const createReview = useCreateReview();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', measureOfSuccess: '', targetDate: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ overallProgress: 50, comments: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!plan) return <div className="p-xl text-body text-kore-mid">Plan nicht gefunden.</div>;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    createGoal.mutate({ planId: plan.id, ...goalForm }, { onSuccess: () => { setShowGoalForm(false); setGoalForm({ title: '', measureOfSuccess: '', targetDate: '' }); } });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    createReview.mutate({ planId: plan.id, ...reviewForm }, { onSuccess: () => { setShowReviewForm(false); setReviewForm({ overallProgress: 50, comments: '' }); } });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/pdp-pip" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Target size={24} /> {plan.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {plan.type} · {STATUS_LABELS[plan.status] ?? plan.status} · {plan.user?.name ?? '—'}
            {plan.targetDate && ` · Ziel: ${new Date(plan.targetDate).toLocaleDateString('de-DE')}`}
          </p>
        </div>
      </div>

      {/* Goals */}
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-display text-h3 text-kore-ink">Ziele</h2>
        <button onClick={() => setShowGoalForm(!showGoalForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={14} /> Ziel hinzufügen
        </button>
      </div>

      {showGoalForm && (
        <form onSubmit={handleAddGoal} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Erfolgsmessung</label>
            <input value={goalForm.measureOfSuccess} onChange={e => setGoalForm({ ...goalForm, measureOfSuccess: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Zieldatum</label>
            <input type="date" value={goalForm.targetDate} onChange={e => setGoalForm({ ...goalForm, targetDate: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={createGoal.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Hinzufügen</button>
        </form>
      )}

      {!plan.goals?.length ? (
        <p className="text-body text-kore-mid mb-xl">Keine Ziele definiert.</p>
      ) : (
        <div className="space-y-sm mb-xl">
          {plan.goals.map((g: any) => (
            <div key={g.id} className="bg-kore-white border border-kore-border p-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  {g.status === 'COMPLETED' ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} className="text-kore-mid" />}
                  <span className={`font-medium ${g.status === 'COMPLETED' ? 'text-emerald-600 line-through' : 'text-kore-ink'}`}>{g.title}</span>
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-small text-kore-mid">{GOAL_STATUS[g.status] ?? g.status}</span>
                  {g.status !== 'COMPLETED' && g.status !== 'CANCELLED' && (
                    <button onClick={() => updateGoal.mutate({ planId: plan.id, goalId: g.id, status: 'COMPLETED' })} className="px-sm py-xs bg-emerald-600 text-kore-white text-small hover:opacity-90" disabled={updateGoal.isPending}>
                      Erledigt
                    </button>
                  )}
                </div>
              </div>
              {g.measureOfSuccess && <p className="text-small text-kore-mid mt-xs">Erfolg: {g.measureOfSuccess}</p>}
              {g.progress > 0 && (
                <div className="mt-sm">
                  <div className="w-full bg-kore-bg rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${g.progress}%` }} /></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reviews */}
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-display text-h3 text-kore-ink">Reviews</h2>
        <button onClick={() => setShowReviewForm(!showReviewForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={14} /> Review hinzufügen
        </button>
      </div>

      {showReviewForm && (
        <form onSubmit={handleAddReview} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Gesamtfortschritt (%)</label>
            <input type="number" min={0} max={100} value={reviewForm.overallProgress} onChange={e => setReviewForm({ ...reviewForm, overallProgress: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Kommentare</label>
            <textarea value={reviewForm.comments} onChange={e => setReviewForm({ ...reviewForm, comments: e.target.value })} rows={3} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={createReview.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Review speichern</button>
        </form>
      )}

      {!plan.reviews?.length ? (
        <p className="text-body text-kore-mid">Keine Reviews vorhanden.</p>
      ) : (
        <div className="space-y-sm">
          {plan.reviews.map((r: any) => (
            <div key={r.id} className="bg-kore-white border border-kore-border p-md">
              <div className="flex items-center justify-between">
                <span className="text-small text-kore-mid">{new Date(r.reviewDate).toLocaleDateString('de-DE')} — {r.reviewer?.name ?? '—'}</span>
                <span className="font-medium text-kore-ink">{r.overallProgress}%</span>
              </div>
              {r.comments && <p className="text-body text-kore-mid mt-xs">{r.comments}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
