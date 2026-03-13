import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, BookOpen, FileText } from 'lucide-react';
import { useSopCategories, useSopDocuments } from '../../../hooks/useSop';
import { SopStatusBadge } from '../components/SopStatusBadge';

export function LibraryPage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data: categories } = useSopCategories();
  const { data: docsData, isLoading } = useSopDocuments({ page, categoryId: selectedCategory, status: statusFilter, search: search || undefined });
  const documents = docsData?.data ?? [];
  const total = docsData?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">SOP Bibliothek</h1>
          <p className="text-body text-kore-mid mt-xs">{total} Dokumente</p>
        </div>
        <Link to="/tools/sop/documents/new" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
          <Plus size={16} /> Neues SOP
        </Link>
      </div>

      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="mb-xl">
        <div className="relative">
          <Search size={18} className="absolute left-lg top-1/2 -translate-y-1/2 text-kore-mid" />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="SOPs durchsuchen..." className="w-full pl-[44px] pr-lg py-md border border-kore-border bg-kore-white text-small placeholder:text-kore-faint focus:outline-none focus:border-kore-brass" />
        </div>
      </form>

      <div className="flex gap-xl">
        <div className="w-48 flex-shrink-0 hidden md:block">
          <p className="text-caption text-kore-mid uppercase tracking-widest mb-md">Kategorien</p>
          <nav className="space-y-xs">
            <button onClick={() => { setSelectedCategory(undefined); setPage(1); }} className={`block w-full text-left px-md py-sm text-small ${!selectedCategory ? 'bg-kore-ink text-kore-white' : 'text-kore-ink hover:bg-kore-bg'}`}>Alle</button>
            {(categories ?? []).map(c => (
              <button key={c.id} onClick={() => { setSelectedCategory(c.id); setPage(1); }} className={`block w-full text-left px-md py-sm text-small ${selectedCategory === c.id ? 'bg-kore-ink text-kore-white' : 'text-kore-ink hover:bg-kore-bg'}`}>{c.name}</button>
            ))}
          </nav>
          <p className="text-caption text-kore-mid uppercase tracking-widest mt-xl mb-md">Status</p>
          <nav className="space-y-xs">
            {[undefined, 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map(s => (
              <button key={s ?? 'all'} onClick={() => { setStatusFilter(s); setPage(1); }} className={`block w-full text-left px-md py-sm text-small ${statusFilter === s ? 'bg-kore-ink text-kore-white' : 'text-kore-ink hover:bg-kore-bg'}`}>
                {!s ? 'Alle' : s === 'PUBLISHED' ? 'Veröffentlicht' : s === 'DRAFT' ? 'Entwurf' : 'Archiviert'}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : documents.length === 0 ? (
            <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
              <BookOpen size={48} className="text-kore-faint mb-lg" />
              <h2 className="font-display text-h2 text-kore-ink mb-md">Keine SOPs gefunden</h2>
              <p className="text-body text-kore-mid mb-xl">Erstellen Sie Ihr erstes Standard Operating Procedure.</p>
              <Link to="/tools/sop/documents/new" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><Plus size={16} /> Erstes SOP erstellen</Link>
            </div>
          ) : (
            <>
              <div className="space-y-md">
                {documents.map(doc => (
                  <Link key={doc.id} to={`/tools/sop/documents/${doc.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors group">
                    <div className="flex items-start justify-between gap-lg">
                      <div className="flex items-start gap-md min-w-0">
                        <FileText size={20} className="text-kore-mid mt-xs flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-body font-medium text-kore-ink group-hover:text-kore-brass transition-colors truncate">{doc.title}</h3>
                          <div className="flex items-center gap-md mt-xs flex-wrap">
                            {doc.category && <span className="text-small text-kore-mid">{doc.category.name}</span>}
                            <span className="text-small text-kore-faint">v{doc.version}</span>
                            <span className="text-small text-kore-faint">{new Date(doc.updatedAt).toLocaleDateString('de-DE')}</span>
                          </div>
                        </div>
                      </div>
                      <SopStatusBadge status={doc.status} />
                    </div>
                  </Link>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-md mt-xl">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-small text-kore-mid hover:text-kore-ink disabled:opacity-30">Zurück</button>
                  <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-small text-kore-mid hover:text-kore-ink disabled:opacity-30">Weiter</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
