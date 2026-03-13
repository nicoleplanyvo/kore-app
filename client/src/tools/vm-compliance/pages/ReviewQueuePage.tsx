import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { useVmSubmissions } from '../../../hooks/useVmCompliance';
import { StatusBadge } from '../components/StatusBadge';

export function ReviewQueuePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVmSubmissions({ page, status: 'PENDING' });
  const items = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Review Queue</h1>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : items.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl text-center">
          <Camera size={48} className="text-kore-faint mx-auto mb-lg" />
          <p className="text-body text-kore-mid">Keine ausstehenden Reviews.</p>
        </div>
      ) : (
        <div className="space-y-md">
          {items.map(sub => (
            <Link key={sub.id} to={`/tools/vm-compliance/submissions/${sub.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <Camera size={18} className="text-kore-mid" />
                  <div>
                    <span className="text-body font-medium text-kore-ink">{sub.guideline?.name}</span>
                    <div className="flex items-center gap-md mt-xs">
                      <span className="text-small text-kore-mid">{sub.store?.name}</span>
                      <span className="text-small text-kore-faint">von {sub.submitter?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-md">
                  <span className="text-small text-kore-faint">{new Date(sub.submittedAt).toLocaleDateString('de-DE')}</span>
                  <StatusBadge status={sub.status} />
                </div>
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-small text-kore-mid disabled:opacity-30">Zurück</button>
              <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-small text-kore-mid disabled:opacity-30">Weiter</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
