import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBudgetPeriods, useBudgetStores } from '../../../hooks/useBudget';
import { BudgetBar } from '../components/BudgetBar';

export function PeriodListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useBudgetStores();
  const { data, isLoading } = useBudgetPeriods(page, storeId || undefined);
  const periods = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/budget" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Budget-Perioden</h1>
          <p className="text-body text-kore-mid mt-xs">Alle Budget-Zeitraeume im Ueberblick</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : periods.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Perioden gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {periods.map((p: any) => {
              const totalBudget = Number(p.totalBudget ?? 0);
              const totalActual = Number(p.totalActual ?? 0);
              return (
                <Link key={p.id} to={`/tools/budget/periods/${p.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                  <div className="flex items-center justify-between mb-md">
                    <div>
                      <span className="text-body font-medium text-kore-ink">{p.name}</span>
                      <div className="flex items-center gap-md mt-xs">
                        <span className="text-small text-kore-mid">{(p.store as any)?.name}</span>
                        <span className="text-small text-kore-faint">{p.period}</span>
                        <span className={`text-small font-medium px-sm py-px border ${p.status === 'CLOSED' ? 'bg-kore-bg text-kore-mid border-kore-border' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{p.status === 'CLOSED' ? 'Geschlossen' : 'Aktiv'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-small text-kore-mid">Budget: {totalBudget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
                      <div className="text-small text-kore-ink">Ist: {totalActual.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
                    </div>
                  </div>
                  <BudgetBar used={totalActual} total={totalBudget || 1} />
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Perioden &middot; Seite {page} von {totalPages}</span>
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
