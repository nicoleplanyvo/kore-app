import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateVmGuidelineDoc, useUpdateVmGuidelineDoc, useVmGuidelineDoc } from '../../../hooks/useVmGuidelines';

const CATEGORIES = ['Schaufenster', 'Tisch', 'Wand', 'Eingang', 'Saison'];

export function ManagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { data: existing } = useVmGuidelineDoc(editId || undefined);

  const createMutation = useCreateVmGuidelineDoc();
  const updateMutation = useUpdateVmGuidelineDoc();

  const [title, setTitle] = useState(existing?.title || '');
  const [category, setCategory] = useState(existing?.category || '');
  const [content, setContent] = useState(existing?.content || '');
  const [effectiveFrom, setEffectiveFrom] = useState(existing?.effectiveFrom || '');

  // Update form when existing data loads
  if (existing && !title && existing.title) {
    setTitle(existing.title);
    setCategory(existing.category || '');
    setContent(existing.content || '');
    setEffectiveFrom(existing.effectiveFrom || '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title,
      category: category || undefined,
      content,
      effectiveFrom: effectiveFrom || undefined,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, ...data }, {
        onSuccess: () => navigate(`/app/tools/vm-guidelines/guidelines/${editId}`),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => navigate('/app/tools/vm-guidelines'),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-xl max-w-3xl">
      <Link to="/app/tools/vm-guidelines" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurueck
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">{editId ? 'Guideline bearbeiten' : 'Neue Guideline'}</h1>
      <p className="text-body text-kore-mid mb-2xl">{editId ? 'Aendern Sie die VM-Guideline.' : 'Erstellen Sie eine neue VM-Guideline mit Anweisungen und Bildern.'}</p>

      <form onSubmit={handleSubmit} className="space-y-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Allgemein</h2>
          <div className="space-y-lg">
            <div>
              <label className="text-small text-kore-mid block mb-sm">Titel *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small" placeholder="z.B. Schaufenster Fruehjahr 2026" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="text-small text-kore-mid block mb-sm">Kategorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small bg-kore-white">
                  <option value="">Keine Kategorie</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-small text-kore-mid block mb-sm">Gueltig ab</label>
                <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Anweisungen *</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border border-kore-border px-md py-sm text-small resize-none font-mono"
            rows={12}
            placeholder="Beschreiben Sie die VM-Richtlinien im Detail. Markdown wird unterstuetzt."
            required
          />
        </div>

        <div className="flex gap-md">
          <button
            type="submit"
            disabled={!title || !content || isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Save size={16} /> {isPending ? 'Speichert...' : editId ? 'Speichern' : 'Erstellen'}
          </button>
          <Link to="/app/tools/vm-guidelines" className="flex items-center gap-sm border border-kore-border text-kore-ink px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
