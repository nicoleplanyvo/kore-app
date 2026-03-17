import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Plus, BarChart3, Image } from 'lucide-react';
import { useVmGuidelineDocs } from '../../../hooks/useVmGuidelines';

const CATEGORIES = ['Schaufenster', 'Tisch', 'Wand', 'Eingang', 'Saison'];
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', PUBLISHED: 'Veroeffentlicht', ARCHIVED: 'Archiviert' };
const STATUS_COLORS: Record<string, string> = { DRAFT: 'text-amber-600 bg-amber-50', PUBLISHED: 'text-emerald-600 bg-emerald-50', ARCHIVED: 'text-kore-faint bg-kore-bg' };

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data: result, isLoading } = useVmGuidelineDocs(page, category || undefined, search || undefined);
  const docs = result?.data ?? [];
  const total = result?.total ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">VM Guidelines</h1>
          <p className="text-body text-kore-mid mt-xs">Zentrale Bibliothek fuer Visual-Merchandising-Richtlinien und Planogramme</p>
        </div>
        <div className="flex gap-md">
          <Link to="dashboard" className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link to="manage" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Neue Guideline
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-md mb-xl flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-sm">
          <div className="relative">
            <Search size={14} className="absolute left-md top-1/2 -translate-y-1/2 text-kore-faint" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Suchen..."
              className="border border-kore-border pl-2xl pr-md py-sm text-small bg-kore-white w-60"
            />
          </div>
          <button type="submit" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors">Suchen</button>
        </form>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Kategorien</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-small text-kore-mid self-center">{total} Guidelines</span>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Guidelines...</div>
      ) : docs.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <BookOpen size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Guidelines</h2>
          <p className="text-body text-kore-mid mb-xl max-w-md">Erstellen Sie die erste VM-Guideline, um Standards fuer Ihr Visual Merchandising zu definieren.</p>
          <Link to="manage" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Erste Guideline erstellen
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
            {docs.map((doc: any) => (
              <Link key={doc.id} to={`guidelines/${doc.id}`} className="bg-kore-white border border-kore-border hover:border-kore-brass transition-colors group">
                {/* Thumbnail */}
                <div className="aspect-video bg-kore-bg flex items-center justify-center overflow-hidden">
                  {doc.images?.[0]?.imagePath ? (
                    <img src={doc.images[0].imagePath} alt={doc.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image size={36} className="text-kore-faint" />
                  )}
                </div>
                <div className="p-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <span className={`text-caption px-sm py-xs uppercase tracking-widest ${STATUS_COLORS[doc.status] || ''}`}>
                      {STATUS_LABELS[doc.status] || doc.status}
                    </span>
                    {doc.category && <span className="text-caption text-kore-faint">{doc.category}</span>}
                  </div>
                  <h3 className="text-body font-medium text-kore-ink group-hover:text-kore-brass transition-colors">{doc.title}</h3>
                  <div className="flex items-center justify-between mt-sm">
                    <span className="text-caption text-kore-faint">V{doc.version}</span>
                    <span className="text-caption text-kore-faint">{doc._count?.images ?? 0} Bilder</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {total > 20 && (
            <div className="flex justify-center gap-md mt-xl">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-md py-sm border border-kore-border text-small disabled:opacity-40 hover:bg-kore-bg transition-colors">Zurueck</button>
              <span className="text-small text-kore-mid self-center">Seite {page} von {Math.ceil(total / 20)}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * 20 >= total} className="px-md py-sm border border-kore-border text-small disabled:opacity-40 hover:bg-kore-bg transition-colors">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
