import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Plus, Sun, Moon, Star } from 'lucide-react';
import { useBriefings, useCreateBriefing } from '../../../hooks/useBriefings';

const TYPE_ICONS: Record<string, any> = { MORNING: <Sun size={16} className="text-amber-500" />, EVENING: <Moon size={16} className="text-indigo-500" />, SPECIAL: <Star size={16} className="text-emerald-500" /> };
const TYPE_LABELS: Record<string, string> = { MORNING: 'Morgen-Briefing', EVENING: 'Abend-Briefing', SPECIAL: 'Sonder-Briefing' };

export function OverviewPage() {
  const { data: briefings, isLoading } = useBriefings();
  const create = useCreateBriefing();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', date: new Date().toISOString().split('T')[0], type: 'MORNING' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ title: '', content: '', date: new Date().toISOString().split('T')[0], type: 'MORNING' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Megaphone size={24} /> Briefings</h1>
          <p className="text-body text-kore-mid mt-xs">Morgen-, Abend- und Sonder-Briefings für das Team.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neues Briefing
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Datum</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Typ</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                  <option value="MORNING">Morgen</option>
                  <option value="EVENING">Abend</option>
                  <option value="SPECIAL">Sonder</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Inhalt</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Briefing erstellen</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Briefings...</div>
      ) : !briefings?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Briefings vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {briefings.map((b: any) => (
            <Link key={b.id} to={`/tools/briefings/${b.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  {TYPE_ICONS[b.type] ?? <Megaphone size={16} className="text-kore-mid" />}
                  <span className="font-medium text-kore-ink">{b.title}</span>
                </div>
                <span className="text-small text-kore-mid">{TYPE_LABELS[b.type] ?? b.type}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>{new Date(b.date).toLocaleDateString('de-DE')}</span>
                <span>{b.creator?.name ?? '—'}</span>
                <span>{b._count?.acknowledgments ?? 0} gelesen</span>
                {b.store && <span>{b.store.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
