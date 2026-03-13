import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { useHandovers, useCreateHandover } from '../../../hooks/useHandover';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', SUBMITTED: 'Eingereicht', ACKNOWLEDGED: 'Bestätigt' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-kore-bg text-kore-mid', SUBMITTED: 'bg-blue-100 text-blue-700', ACKNOWLEDGED: 'bg-emerald-100 text-emerald-700' };

export function OverviewPage() {
  const { data: handovers, isLoading } = useHandovers();
  const create = useCreateHandover();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ shiftDate: new Date().toISOString().split('T')[0], shiftType: '', salesUpdate: '', openTasks: '', generalNotes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ shiftDate: new Date().toISOString().split('T')[0], shiftType: '', salesUpdate: '', openTasks: '', generalNotes: '' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><ArrowRightLeft size={24} /> Handover</h1>
          <p className="text-body text-kore-mid mt-xs">Schichtübergaben dokumentieren und nachverfolgen.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Übergabe
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Schichtdatum</label>
              <input type="date" value={form.shiftDate} onChange={e => setForm({ ...form, shiftDate: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Schichttyp</label>
              <input value={form.shiftType} onChange={e => setForm({ ...form, shiftType: e.target.value })} placeholder="z.B. Früh, Spät" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Umsatz-Update</label>
            <textarea value={form.salesUpdate} onChange={e => setForm({ ...form, salesUpdate: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Offene Aufgaben</label>
            <textarea value={form.openTasks} onChange={e => setForm({ ...form, openTasks: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Allgemeine Notizen</label>
            <textarea value={form.generalNotes} onChange={e => setForm({ ...form, generalNotes: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Übergabe erstellen</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Übergaben...</div>
      ) : !handovers?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Handover-Protokolle vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {handovers.map((h: any) => (
            <Link key={h.id} to={`/tools/handover/${h.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-kore-ink">{new Date(h.shiftDate).toLocaleDateString('de-DE')}</span>
                  {h.shiftType && <span className="text-small text-kore-mid ml-sm">{h.shiftType}</span>}
                </div>
                <span className={`px-sm py-xs text-small ${STATUS_COLORS[h.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[h.status] ?? h.status}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>Von: {h.fromUser?.name ?? '—'}</span>
                <span>An: {h.toUser?.name ?? '—'}</span>
                {h.store && <span>{h.store.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
