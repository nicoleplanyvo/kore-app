import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, MessageSquare, Save } from 'lucide-react';
import { useCoachingSession, useUpdateCoachingSession } from '../../../hooks/useCoaching';

const TYPE_LABELS: Record<string, string> = { REGULAR: 'Regulär', AD_HOC: 'Ad-hoc', FOLLOW_UP: 'Follow-up' };
const STATUS_LABELS: Record<string, string> = { SCHEDULED: 'Geplant', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen', NO_SHOW: 'Nicht erschienen' };
const MOOD_EMOJI = ['', '😞', '😐', '🙂', '😊', '🤩'];

export function SessionDetailPage() {
  const { id } = useParams();
  const { data: session, isLoading } = useCoachingSession(id);
  const update = useUpdateCoachingSession();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!session) return <div className="p-xl text-body text-kore-mid">Session nicht gefunden.</div>;

  const startEdit = () => { setForm({ status: session.status, notes: session.notes ?? '', actionItems: session.actionItems ?? '', mood: session.mood ?? '', duration: session.duration ?? '' }); setEditing(true); };
  const handleSave = () => {
    update.mutate({ id: session.id, ...form, mood: form.mood ? Number(form.mood) : null, duration: form.duration ? Number(form.duration) : null }, { onSuccess: () => setEditing(false) });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/coaching" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <MessageSquare size={24} /> Coaching-Session
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {session.coachee?.name ?? 'Unbekannt'} mit {session.coach?.name ?? '—'} · {TYPE_LABELS[session.type] ?? session.type}
          </p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">Bearbeiten</button>
        )}
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Termin</span>
            <p className="text-body text-kore-ink">{new Date(session.scheduledAt).toLocaleString('de-DE')}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Status</span>
            {editing ? (
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="SCHEDULED">Geplant</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="CANCELLED">Abgebrochen</option>
                <option value="NO_SHOW">Nicht erschienen</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{STATUS_LABELS[session.status] ?? session.status}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Dauer (Min.)</span>
            {editing ? (
              <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs" />
            ) : (
              <p className="text-body text-kore-ink">{session.duration ?? '—'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Stimmung</span>
            {editing ? (
              <select value={form.mood} onChange={e => setForm({ ...form, mood: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="">—</option>
                {[1,2,3,4,5].map(v => <option key={v} value={v}>{MOOD_EMOJI[v]} {v}/5</option>)}
              </select>
            ) : (
              <p className="text-body text-kore-ink">{session.mood ? `${MOOD_EMOJI[session.mood]} ${session.mood}/5` : '—'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <h2 className="font-display text-h3 text-kore-ink mb-md">Notizen</h2>
        {editing ? (
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={5} className="w-full border border-kore-border px-md py-sm text-body" />
        ) : (
          <p className="text-body text-kore-mid whitespace-pre-wrap">{session.notes || 'Keine Notizen.'}</p>
        )}
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <h2 className="font-display text-h3 text-kore-ink mb-md">Action Items</h2>
        {editing ? (
          <textarea value={form.actionItems} onChange={e => setForm({ ...form, actionItems: e.target.value })} rows={4} className="w-full border border-kore-border px-md py-sm text-body" />
        ) : (
          <p className="text-body text-kore-mid whitespace-pre-wrap">{session.actionItems || 'Keine Action Items.'}</p>
        )}
      </div>

      {session.followUpDate && (
        <div className="bg-blue-50 border border-blue-200 p-md text-body text-blue-700">
          Follow-up geplant: {new Date(session.followUpDate).toLocaleDateString('de-DE')}
        </div>
      )}

      {editing && (
        <div className="flex gap-sm mt-xl">
          <button onClick={handleSave} disabled={update.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Save size={14} /> {update.isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button onClick={() => setEditing(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Abbrechen</button>
        </div>
      )}
    </div>
  );
}
