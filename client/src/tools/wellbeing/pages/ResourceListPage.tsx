import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, ExternalLink, Trash2 } from 'lucide-react';
import {
  useWellbeingResources,
  useCreateWellbeingResource,
  useDeleteWellbeingResource,
} from '../../../hooks/useWellbeing';

const CATEGORY_OPTIONS = [
  'Mental Health',
  'Fitness',
  'Ernaehrung',
  'Achtsamkeit',
  'Externe Hilfsangebote',
  'Sonstiges',
];

export function ResourceListPage() {
  const { data: resources, isLoading } = useWellbeingResources();
  const create = useCreateWellbeingResource();
  const deleteResource = useDeleteWellbeingResource();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: '', description: '', url: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        title: form.title,
        category: form.category || undefined,
        description: form.description || undefined,
        url: form.url || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ title: '', category: '', description: '', url: '' });
        },
      },
    );
  };

  const categories = [...new Set(resources?.map((r: any) => r.category).filter(Boolean) ?? [])];

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/wellbeing" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BookOpen size={24} /> Wellbeing-Ressourcen
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Hilfreiche Materialien, Uebungen und externe Hilfsangebote.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
        >
          <Plus size={16} /> Neue Ressource
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                required
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                <option value="">-- Waehlen --</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-kore-border px-md py-sm text-body"
            />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">URL</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              className="w-full border border-kore-border px-md py-sm text-body"
            />
          </div>
          <div className="flex items-center gap-md">
            <button
              type="submit"
              disabled={create.isPending}
              className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? 'Speichern...' : 'Ressource anlegen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-md py-sm border border-kore-border text-kore-mid text-small hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
          {create.isError && (
            <p className="text-small text-red-600 mt-sm">{(create.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Resource list */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Ressourcen...</div>
      ) : !resources?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <BookOpen size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Ressourcen vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Legen Sie hilfreiche Materialien und externe Hilfsangebote fuer Ihr Team an.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Erste Ressource anlegen
          </button>
        </div>
      ) : categories.length > 0 ? (
        categories.map((cat) => (
          <div key={cat as string} className="mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-md">{cat as string}</h2>
            <div className="space-y-sm">
              {resources
                .filter((r: any) => r.category === cat)
                .map((r: any) => (
                  <div key={r.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-kore-ink">{r.title}</span>
                      {r.description && (
                        <p className="text-small text-kore-mid mt-xs">{r.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-sm ml-md">
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-xs text-small text-kore-brass hover:text-kore-ink"
                        >
                          <ExternalLink size={14} /> Oeffnen
                        </a>
                      )}
                      <button
                        onClick={() => deleteResource.mutate(r.id)}
                        className="text-kore-mid hover:text-red-600"
                        title="Entfernen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      ) : (
        <div className="space-y-sm">
          {resources.map((r: any) => (
            <div key={r.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-kore-ink">{r.title}</span>
                {r.description && (
                  <p className="text-small text-kore-mid mt-xs">{r.description}</p>
                )}
              </div>
              <div className="flex items-center gap-sm ml-md">
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-xs text-small text-kore-brass hover:text-kore-ink"
                  >
                    <ExternalLink size={14} /> Oeffnen
                  </a>
                )}
                <button
                  onClick={() => deleteResource.mutate(r.id)}
                  className="text-kore-mid hover:text-red-600"
                  title="Entfernen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
