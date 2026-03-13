import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Plus } from 'lucide-react';
import { usePulseSurveys, useCreatePulseSurvey } from '../../../hooks/usePulseSurvey';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', CLOSED: 'Geschlossen' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-kore-bg text-kore-mid', ACTIVE: 'bg-emerald-100 text-emerald-700', CLOSED: 'bg-blue-100 text-blue-700' };

export function OverviewPage() {
  const { data: surveys, isLoading } = usePulseSurveys();
  const create = useCreatePulseSurvey();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', startDate: '', endDate: '', isAnonymous: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ title: '', startDate: '', endDate: '', isAnonymous: true }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><BarChart3 size={24} /> Pulse Survey</h1>
          <p className="text-body text-kore-mid mt-xs">Kurze Mitarbeiterbefragungen erstellen und auswerten.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Umfrage
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
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
          <label className="flex items-center gap-sm text-body text-kore-ink">
            <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({ ...form, isAnonymous: e.target.checked })} />
            Anonyme Teilnahme
          </label>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Umfrage anlegen</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Umfragen...</div>
      ) : !surveys?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Umfragen vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {surveys.map((s: any) => (
            <Link key={s.id} to={`/tools/pulse-survey/surveys/${s.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-kore-ink">{s.title}</span>
                <span className={`px-sm py-xs text-small ${STATUS_COLORS[s.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[s.status] ?? s.status}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>{new Date(s.startDate).toLocaleDateString('de-DE')} – {new Date(s.endDate).toLocaleDateString('de-DE')}</span>
                <span>{s._count?.questions ?? 0} Fragen</span>
                <span>{s._count?.responses ?? 0} Antworten</span>
                {s.isAnonymous && <span className="text-indigo-600">Anonym</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
