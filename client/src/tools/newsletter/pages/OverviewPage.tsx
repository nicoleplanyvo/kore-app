import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, Plus } from 'lucide-react';
import { useNewsletters, useCreateNewsletter } from '../../../hooks/useNewsletter';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', PUBLISHED: 'Veröffentlicht', ARCHIVED: 'Archiviert' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-kore-bg text-kore-mid', PUBLISHED: 'bg-emerald-100 text-emerald-700', ARCHIVED: 'bg-blue-100 text-blue-700' };

export function OverviewPage() {
  const { data: newsletters, isLoading } = useNewsletters();
  const create = useCreateNewsletter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ title: '', content: '' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Newspaper size={24} /> Team Newsletter</h1>
          <p className="text-body text-kore-mid mt-xs">Newsletter für das Team erstellen und veröffentlichen.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neuer Newsletter
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Einleitung</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={3} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Newsletter anlegen</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Newsletter...</div>
      ) : !newsletters?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Newsletter vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {newsletters.map((n: any) => (
            <Link key={n.id} to={`/tools/newsletter/${n.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <span className="font-medium text-kore-ink">{n.title}</span>
                <span className={`px-sm py-xs text-small ${STATUS_COLORS[n.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[n.status] ?? n.status}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>{n.creator?.name ?? '—'}</span>
                {n.publishedAt && <span>Veröffentlicht: {new Date(n.publishedAt).toLocaleDateString('de-DE')}</span>}
                <span>{n._count?.sections ?? 0} Abschnitte</span>
                <span>{n._count?.views ?? 0} Aufrufe</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
