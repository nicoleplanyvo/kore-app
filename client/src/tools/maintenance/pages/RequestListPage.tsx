import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMaintenanceStores, useMaintenanceRequests } from '../../../hooks/useMaintenance';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Arbeit',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-kore-mid',
  MEDIUM: 'text-amber-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600 font-medium',
};

export function RequestListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');
  const { data: stores } = useMaintenanceStores();
  const { data, isLoading } = useMaintenanceRequests(page, storeId || undefined, status || undefined);
  const requests = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/maintenance" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Maintenance Requests</h1>
          <p className="text-body text-kore-mid mt-xs">Alle Wartungsanfragen</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="OPEN">Offen</option>
          <option value="IN_PROGRESS">In Arbeit</option>
          <option value="RESOLVED">Gelöst</option>
          <option value="CLOSED">Geschlossen</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : requests.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Requests gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {requests.map((r: any) => (
              <Link key={r.id} to={`/tools/maintenance/requests/${r.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-body font-medium text-kore-ink">{r.title}</span>
                    <div className="flex items-center gap-md mt-xs">
                      <span className="text-small text-kore-mid">{r.store?.name}</span>
                      <span className="text-small px-sm py-px border border-kore-border bg-kore-bg">{r.category}</span>
                      <span className={`text-small ${PRIORITY_STYLES[r.priority] ?? 'text-kore-mid'}`}>{r.priority}</span>
                      <span className="text-small text-kore-faint">{new Date(r.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  </div>
                  <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[r.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
                    {STATUS_LABELS[r.status] ?? String(r.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Requests &middot; Seite {page} von {totalPages}</span>
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
