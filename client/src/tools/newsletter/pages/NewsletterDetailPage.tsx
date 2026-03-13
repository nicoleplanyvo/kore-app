import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Newspaper, Plus, Send } from 'lucide-react';
import { useNewsletter, usePublishNewsletter, useAddNewsletterSection } from '../../../hooks/useNewsletter';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', PUBLISHED: 'Veröffentlicht', ARCHIVED: 'Archiviert' };

export function NewsletterDetailPage() {
  const { id } = useParams();
  const { data: newsletter, isLoading } = useNewsletter(id);
  const publish = usePublishNewsletter();
  const addSection = useAddNewsletterSection();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!newsletter) return <div className="p-xl text-body text-kore-mid">Newsletter nicht gefunden.</div>;

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    addSection.mutate({ id: newsletter.id, ...form }, { onSuccess: () => { setShowForm(false); setForm({ title: '', content: '' }); } });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/newsletter" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Newspaper size={24} /> {newsletter.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {STATUS_LABELS[newsletter.status] ?? newsletter.status} · {newsletter.creator?.name ?? '—'}
            {newsletter.publishedAt && ` · ${new Date(newsletter.publishedAt).toLocaleDateString('de-DE')}`}
          </p>
        </div>
        {newsletter.status === 'DRAFT' && (
          <button onClick={() => publish.mutate(newsletter.id)} disabled={publish.isPending} className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Send size={16} /> {publish.isPending ? 'Wird veröffentlicht...' : 'Veröffentlichen'}
          </button>
        )}
      </div>

      {newsletter.content && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <p className="text-body text-kore-ink whitespace-pre-wrap">{newsletter.content}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-md">
        <h2 className="font-display text-h3 text-kore-ink">Abschnitte ({newsletter.sections?.length ?? 0})</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={14} /> Abschnitt hinzufügen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddSection} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Inhalt</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <button type="submit" disabled={addSection.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Hinzufügen</button>
        </form>
      )}

      {!newsletter.sections?.length ? (
        <p className="text-body text-kore-mid mb-xl">Keine Abschnitte vorhanden.</p>
      ) : (
        <div className="space-y-md mb-xl">
          {newsletter.sections.map((s: any) => (
            <div key={s.id} className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-h3 text-kore-ink mb-sm">{s.title}</h3>
              <p className="text-body text-kore-mid whitespace-pre-wrap">{s.content}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-kore-white border border-kore-border p-lg">
        <h2 className="font-display text-h3 text-kore-ink mb-sm">Aufrufe</h2>
        <p className="text-body text-kore-mid">{newsletter._count?.views ?? newsletter.views?.length ?? 0} Aufrufe insgesamt</p>
      </div>
    </div>
  );
}
