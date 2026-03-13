import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Plus, User } from 'lucide-react';
import { useDevelopmentPlans, useCreateDevelopmentPlan } from '../../../hooks/usePdpPip';

const TYPE_LABELS: Record<string, string> = { PDP: 'Personal Development Plan', PIP: 'Performance Improvement Plan' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-kore-bg text-kore-mid', ACTIVE: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-red-100 text-red-700' };
const TYPE_COLORS: Record<string, string> = { PDP: 'bg-indigo-100 text-indigo-700', PIP: 'bg-orange-100 text-orange-700' };

export function OverviewPage() {
  const { data: plans, isLoading } = useDevelopmentPlans();
  const create = useCreateDevelopmentPlan();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', type: 'PDP', title: '', targetDate: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ userId: '', type: 'PDP', title: '', targetDate: '' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Target size={24} /> PDP / PIP</h1>
          <p className="text-body text-kore-mid mt-xs">Entwicklungspläne und Performance Improvement Plans verwalten.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neuer Plan
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Mitarbeiter (User-ID)</label>
              <input value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Typ</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="PDP">PDP — Personal Development</option>
                <option value="PIP">PIP — Performance Improvement</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Zieldatum</label>
            <input type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            {create.isPending ? 'Speichern...' : 'Plan anlegen'}
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Pläne...</div>
      ) : !plans?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Entwicklungspläne vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {plans.map((p: any) => (
            <Link key={p.id} to={`/tools/pdp-pip/plans/${p.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <User size={18} className="text-kore-mid" />
                  <div>
                    <span className="font-medium text-kore-ink">{p.title}</span>
                    <span className="text-small text-kore-mid ml-sm">{p.user?.name ?? '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`px-sm py-xs text-small ${TYPE_COLORS[p.type] ?? 'bg-kore-bg text-kore-mid'}`}>{TYPE_LABELS[p.type] ?? p.type}</span>
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[p.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[p.status] ?? p.status}</span>
                </div>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>Manager: {p.manager?.name ?? '—'}</span>
                {p.targetDate && <span>Ziel: {new Date(p.targetDate).toLocaleDateString('de-DE')}</span>}
                <span>{p._count?.goals ?? 0} Ziele</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
