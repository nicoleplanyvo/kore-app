import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useSopDocument, useSopCategories, useCreateSop, useUpdateSop } from '../../../hooks/useSop';

export function CreateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existing, isLoading: loadingDoc } = useSopDocument(isEdit ? id : undefined);
  const { data: categories, isLoading: loadingCats } = useSopCategories();
  const createMutation = useCreateSop();
  const updateMutation = useUpdateSop(id ?? '');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing && isEdit) {
      setTitle(existing.title);
      setContent(existing.content);
      setCategoryId(existing.categoryId);
    }
  }, [existing, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim() || !categoryId) {
      setError('Bitte alle Pflichtfelder ausfuellen.');
      return;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ title, content, categoryId });
        navigate(`/app/tools/sop/sops/${id}`);
      } else {
        const result = await createMutation.mutateAsync({ title, content, categoryId });
        navigate(`/app/tools/sop/sops/${result.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern.');
    }
  };

  if (isEdit && loadingDoc) return <div className="p-xl text-body text-kore-mid">Lade SOP...</div>;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <button onClick={() => navigate(-1)} className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">
            {isEdit ? 'SOP bearbeiten' : 'Neue SOP erstellen'}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {isEdit ? `Version ${existing?.version ?? 1} wird aktualisiert` : 'Standard Operating Procedure verfassen'}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-small px-lg py-md mb-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-xl">
        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">Titel *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Kassenabschluss-Prozedur"
            className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
          />
        </div>

        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">Kategorie *</label>
          {loadingCats ? (
            <div className="text-small text-kore-mid">Lade Kategorien...</div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
            >
              <option value="">Kategorie waehlen...</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">
            Inhalt * <span className="text-kore-faint font-normal">(Markdown unterstuetzt)</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="SOP-Inhalt hier eingeben..."
            rows={20}
            className="w-full border border-kore-border px-md py-sm text-body bg-kore-white font-mono text-small leading-relaxed focus:outline-none focus:border-kore-brass resize-y"
          />
        </div>

        <div className="flex items-center gap-md pt-lg border-t border-kore-border">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {createMutation.isPending || updateMutation.isPending
              ? 'Wird gespeichert...'
              : isEdit ? 'Aktualisieren' : 'SOP erstellen'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-xl py-md-sm text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
