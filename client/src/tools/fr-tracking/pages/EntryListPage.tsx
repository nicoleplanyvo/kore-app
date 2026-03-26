import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFrStores, useFrEntries } from '../../../hooks/useFrTracking';

export function EntryListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useFrStores();
  const { data, isLoading } = useFrEntries(page, storeId || undefined);
  const entries = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 30;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/fr-tracking" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Footfall-Einträge</h1>
          <p className="text-body text-kore-mid mt-xs">Alle erfassten Frequenz-Daten</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : entries.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Einträge gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {entries.map((e: any) => (
              <div key={e.id} className="bg-kore-white border border-kore-border p-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-body font-medium text-kore-ink">{e.store?.name ?? 'Store'}</span>
                    <div className="flex items-center gap-md mt-xs">
                      <span className="text-small text-kore-faint">{e.date}</span>
                      {e.hour != null && <span className="text-small text-kore-faint">{String(e.hour).padStart(2, '0')}:00</span>}
                      <span className="text-small text-kore-mid">{e.footfall} Besucher</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-lg text-right">
                    <div>
                      <div className="text-small text-kore-mid">Umsatz</div>
                      <div className="text-body font-medium text-kore-ink">{Number(e.revenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
                    </div>
                    <div>
                      <div className="text-small text-kore-mid">Conversion</div>
                      <div className="text-body font-medium text-kore-ink">{e.conversionRate != null ? `${Number(e.conversionRate).toFixed(1)}%` : '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Einträge &middot; Seite {page} von {totalPages}</span>
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
