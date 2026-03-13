import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Calendar, User } from 'lucide-react';
import { useCoachingSessions, useCreateCoachingSession } from '../../../hooks/useCoaching';

const TYPE_LABELS: Record<string, string> = { REGULAR: 'Regulär', AD_HOC: 'Ad-hoc', FOLLOW_UP: 'Follow-up' };
const STATUS_LABELS: Record<string, string> = { SCHEDULED: 'Geplant', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen', NO_SHOW: 'Nicht erschienen' };
const STATUS_COLORS: Record<string, string> = { SCHEDULED: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-red-100 text-red-700', NO_SHOW: 'bg-amber-100 text-amber-700' };
const MOOD_EMOJI = ['', '😞', '😐', '🙂', '😊', '🤩'];

export function OverviewPage() {
  const { data: sessions, isLoading } = useCoachingSessions();
  const create = useCreateCoachingSession();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ coacheeId: '', scheduledAt: '', type: 'REGULAR', notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ coacheeId: '', scheduledAt: '', type: 'REGULAR', notes: '' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><MessageSquare size={24} /> 1:1 Coaching</h1>
          <p className="text-body text-kore-mid mt-xs">Coaching-Sessions planen, durchführen und dokumentieren.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Session
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Coachee (User-ID)</label>
              <input value={form.coacheeId} onChange={e => setForm({ ...form, coacheeId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Termin</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Typ</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border border-kore-border px-md py-sm text-body">
              <option value="REGULAR">Regulär</option>
              <option value="AD_HOC">Ad-hoc</option>
              <option value="FOLLOW_UP">Follow-up</option>
            </select>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Notizen</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            {create.isPending ? 'Speichern...' : 'Session anlegen'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Sessions...</div>
      ) : !sessions?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Coaching-Sessions vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {sessions.map((s: any) => (
            <Link key={s.id} to={`/tools/coaching/sessions/${s.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <User size={18} className="text-kore-mid" />
                  <div>
                    <span className="font-medium text-kore-ink">{s.coachee?.name ?? 'Unbekannt'}</span>
                    <span className="text-small text-kore-mid ml-sm">mit {s.coach?.name ?? '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  {s.mood && <span title={`Stimmung: ${s.mood}/5`}>{MOOD_EMOJI[s.mood]}</span>}
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[s.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[s.status] ?? s.status}</span>
                </div>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span className="flex items-center gap-xs"><Calendar size={12} /> {new Date(s.scheduledAt).toLocaleDateString('de-DE')}</span>
                <span>{TYPE_LABELS[s.type] ?? s.type}</span>
                {s.duration && <span>{s.duration} Min.</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
