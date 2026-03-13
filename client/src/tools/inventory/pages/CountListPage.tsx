import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInventoryCounts, useInventoryStores } from '../../../hooks/useInventory';

const STATUS_LABELS: any = {
  IN_PROGRESS: 'In Arbeit',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

const STATUS_STYLES: any = {
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const TYPE_LABELS: any = {
  FULL: 'Vollinventur',
  CYCLE: 'Stichprobe',
  SPOT: 'Spot-Check',
};

export function CountListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');
  const { data: stores } = useInventoryStores();
  const { data, isLoading } = useInventoryCounts(page, storeId || undefined, status || undefined);
  const counts = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/inventory" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Inventuren</h1>
          <p className="text-body text-kore-mid mt-xs">Alle Bestandsaufnahmen</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="IN_PROGRESS">In Arbeit</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="CANCELLED">Abgebrochen</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : counts.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Inventuren gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {counts.map((c: any) => (
              <Link key={c.id} to={`/tools/inventory/counts/${c.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-body font-medium text-kore-ink">{(c.store as any)?.name}</span>
                    <div className="flex items-center gap-md mt-xs">
                      <span className="text-small px-sm py-px border border-kore-border bg-kore-bg text-kore-ink">{TYPE_LABELS[c.countType] ?? String(c.countType)}</span>
                      <span className="text-small text-kore-faint">{new Date(c.countedAt).toLocaleDateString('de-DE')}</span>
                      <span className="text-small text-kore-faint">{(c._count as any)?.items ?? 0} Positionen</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-lg">
                    {c.totalVariance != null && (
                      <span className={`text-body font-medium ${Number(c.totalVariance) !== 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {Number(c.totalVariance) > 0 ? '+' : ''}{Number(c.totalVariance).toLocaleString('de-DE')}
                      </span>
                    )}
                    <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[c.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>{STATUS_LABELS[c.status] ?? String(c.status)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Inventuren &middot; Seite {page} von {totalPages}</span>
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
