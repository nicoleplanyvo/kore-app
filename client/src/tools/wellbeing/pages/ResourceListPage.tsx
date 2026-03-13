import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, ExternalLink } from 'lucide-react';
import { useWellbeingResources, useCreateWellbeingResource } from '../../../hooks/useWellbeing';

export function ResourceListPage() {
  const { data: resources, isLoading } = useWellbeingResources();
  const create = useCreateWellbeingResource();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', description: '', url: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ title: '', category: '', description: '', url: '' }); } });
  };

  const categories = [...new Set(resources?.map((r: any) => r.category).filter(Boolean) ?? [])];

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/wellbeing" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><BookOpen size={24} /> Wellbeing-Ressourcen</h1>
          <p className="text-body text-kore-mid mt-xs">Hilfreiche Materialien und Links für das Team.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Ressource
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kategorie</label>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="z.B. Mental Health, Fitness" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Beschreibung</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">URL</label>
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Ressource anlegen</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Ressourcen...</div>
      ) : !resources?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Ressourcen vorhanden.</div>
      ) : (
        <>
          {categories.length > 0 ? categories.map(cat => (
            <div key={cat as string} className="mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-md">{cat as string}</h2>
              <div className="space-y-sm">
                {resources.filter((r: any) => r.category === cat).map((r: any) => (
                  <div key={r.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                    <div>
                      <span className="font-medium text-kore-ink">{r.title}</span>
                      {r.description && <p className="text-small text-kore-mid mt-xs">{r.description}</p>}
                    </div>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-small text-blue-600 hover:underline">
                        <ExternalLink size={14} /> Öffnen
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )) : (
            <div className="space-y-sm">
              {resources.map((r: any) => (
                <div key={r.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                  <div>
                    <span className="font-medium text-kore-ink">{r.title}</span>
                    {r.description && <p className="text-small text-kore-mid mt-xs">{r.description}</p>}
                  </div>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-small text-blue-600 hover:underline">
                      <ExternalLink size={14} /> Öffnen
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
