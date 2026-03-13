import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Plus, Star } from 'lucide-react';
import { useAppraisalCycles, useCreateAppraisalCycle, useAppraisals } from '../../../hooks/useAppraisals';

const CYCLE_STATUS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen' };
const APPRAISAL_STATUS: Record<string, string> = { PENDING: 'Ausstehend', SELF_REVIEW: 'Selbstbewertung', MANAGER_REVIEW: 'Managerbewertung', COMPLETED: 'Abgeschlossen' };
const APPRAISAL_COLORS: Record<string, string> = { PENDING: 'bg-kore-bg text-kore-mid', SELF_REVIEW: 'bg-amber-100 text-amber-700', MANAGER_REVIEW: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-emerald-100 text-emerald-700' };

export function OverviewPage() {
  const { data: cycles, isLoading: cyclesLoading } = useAppraisalCycles();
  const { data: appraisals, isLoading: appLoading } = useAppraisals();
  const createCycle = useCreateAppraisalCycle();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', period: '', startDate: '', endDate: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCycle.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ name: '', period: '', startDate: '', endDate: '' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><ClipboardCheck size={24} /> Appraisals</h1>
          <p className="text-body text-kore-mid mt-xs">Bewertungszyklen und Mitarbeitergespräche verwalten.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neuer Zyklus
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Periode</label>
              <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="z.B. Q1 2026" className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Startdatum</label>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Enddatum</label>
              <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <button type="submit" disabled={createCycle.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Zyklus anlegen</button>
        </form>
      )}

      {/* Cycles */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Zyklen</h2>
      {cyclesLoading ? (
        <div className="text-body text-kore-mid mb-xl">Lade...</div>
      ) : !cycles?.length ? (
        <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid mb-xl">Keine Zyklen vorhanden.</div>
      ) : (
        <div className="space-y-sm mb-xl">
          {cycles.map((c: any) => (
            <div key={c.id} className="bg-kore-white border border-kore-border p-md">
              <div className="flex items-center justify-between">
                <span className="font-medium text-kore-ink">{c.name}</span>
                <span className="text-small text-kore-mid">{CYCLE_STATUS[c.status] ?? c.status}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>{c.period}</span>
                <span>{new Date(c.startDate).toLocaleDateString('de-DE')} – {new Date(c.endDate).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appraisals */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Bewertungen</h2>
      {appLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !appraisals?.length ? (
        <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Keine Bewertungen vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {appraisals.map((a: any) => (
            <Link key={a.id} to={`/tools/appraisals/appraisals/${a.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <Star size={18} className="text-kore-mid" />
                  <span className="font-medium text-kore-ink">{a.employee?.name ?? 'Unbekannt'}</span>
                </div>
                <span className={`px-sm py-xs text-small ${APPRAISAL_COLORS[a.status] ?? 'bg-kore-bg text-kore-mid'}`}>{APPRAISAL_STATUS[a.status] ?? a.status}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>Manager: {a.manager?.name ?? '—'}</span>
                {a.overallRating && <span>Bewertung: {a.overallRating}/5</span>}
                {a.cycle && <span>{a.cycle.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
