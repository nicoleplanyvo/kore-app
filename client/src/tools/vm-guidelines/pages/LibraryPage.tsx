import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useVmGuidelineDocs } from '../../../hooks/useVmGuidelines';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Veröffentlicht',
  ARCHIVED: 'Archiviert',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-kore-bg text-kore-mid border-kore-border',
};

export function LibraryPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useVmGuidelineDocs(page, status || undefined);
  const docs = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/vm-guidelines" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">VM Guidelines</h1>
          <p className="text-body text-kore-mid mt-xs">Visual-Merchandising-Richtlinien</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="PUBLISHED">Veröffentlicht</option>
          <option value="ARCHIVED">Archiviert</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : docs.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Guidelines gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {docs.map((d: any) => (
              <Link key={d.id} to={`/tools/vm-guidelines/${d.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <FileText size={20} className="text-kore-mid" />
                    <div>
                      <span className="text-body font-medium text-kore-ink">{d.title}</span>
                      <div className="flex items-center gap-md mt-xs">
                        {d.category && <span className="text-small text-kore-mid">{d.category}</span>}
                        <span className="text-small text-kore-faint">v{d.version}</span>
                        <span className="text-small text-kore-faint">{d._count?.images ?? 0} Bilder</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[d.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
                    {STATUS_LABELS[d.status] ?? String(d.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Guidelines &middot; Seite {page} von {totalPages}</span>
              <div className="flex gap-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
