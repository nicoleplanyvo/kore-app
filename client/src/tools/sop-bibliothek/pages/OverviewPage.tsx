import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Plus, Filter, Eye, CheckCircle, Clock, FileText } from 'lucide-react';
import { useSopDocuments, useSopCategories } from '../../../hooks/useSop';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Freigegeben',
  ARCHIVED: 'Archiviert',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-amber-600 bg-amber-50 border-amber-200',
  PUBLISHED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  ARCHIVED: 'text-kore-faint bg-kore-bg border-kore-border',
};

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');

  const { data: categories } = useSopCategories();
  const { data: result, isLoading } = useSopDocuments({
    page,
    categoryId: categoryId || undefined,
    status: status || undefined,
    search: search || undefined,
  });

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 0;

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">SOP Bibliothek</h1>
          <p className="text-body text-kore-mid mt-xs">
            Standard Operating Procedures verwalten, versionieren und freigeben
          </p>
        </div>
        <div className="flex gap-md">
          <Link
            to="dashboard"
            className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors"
          >
            <Eye size={16} /> Dashboard
          </Link>
          <Link
            to="create"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} /> Neue SOP
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-xl">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-kore-faint" />
          <input
            type="text"
            placeholder="SOP suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full border border-kore-border pl-10 pr-md py-sm text-small bg-kore-white focus:outline-none focus:border-kore-brass"
          />
        </div>
        <div className="flex items-center gap-xs">
          <Filter size={14} className="text-kore-faint" />
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small bg-kore-white"
          >
            <option value="">Alle Kategorien</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c._count?.documents ?? 0})</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small bg-kore-white"
          >
            <option value="">Alle Status</option>
            <option value="DRAFT">Entwurf</option>
            <option value="PUBLISHED">Freigegeben</option>
            <option value="ARCHIVED">Archiviert</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade SOPs...</div>
      ) : !result || result.data.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <BookOpen size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine SOPs gefunden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            {search || categoryId || status
              ? 'Passen Sie Ihre Filter an oder erstellen Sie eine neue SOP.'
              : 'Erstellen Sie Ihre erste Standard Operating Procedure.'}
          </p>
          <Link
            to="create"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} /> SOP erstellen
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {result.data.map((doc) => (
              <Link
                key={doc.id}
                to={`sops/${doc.id}`}
                className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors"
              >
                <div className="flex items-start justify-between gap-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-md mb-xs">
                      <FileText size={16} className="text-kore-brass flex-shrink-0" />
                      <h3 className="text-body font-medium text-kore-ink truncate">{doc.title}</h3>
                    </div>
                    <div className="flex items-center gap-lg text-small text-kore-mid">
                      {doc.category && <span>{doc.category.name}</span>}
                      <span className="flex items-center gap-xs">
                        <Clock size={12} /> v{doc.version}
                      </span>
                      {doc.creator && <span>von {doc.creator.name}</span>}
                      <span>
                        {new Date(doc.updatedAt).toLocaleDateString('de-DE')}
                      </span>
                      {doc._count && (
                        <span className="flex items-center gap-xs">
                          <CheckCircle size={12} /> {doc._count.acknowledgments} gelesen
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-caption px-md py-xs border ${STATUS_COLORS[doc.status] ?? 'text-kore-mid bg-kore-bg border-kore-border'} uppercase tracking-widest`}>
                    {STATUS_LABELS[doc.status] ?? doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">
                {result.total} SOPs gesamt — Seite {result.page} von {totalPages}
              </span>
              <div className="flex gap-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-md py-xs border border-kore-border text-small hover:bg-kore-bg disabled:opacity-40 transition-colors"
                >
                  Zurueck
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-md py-xs border border-kore-border text-small hover:bg-kore-bg disabled:opacity-40 transition-colors"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
