import { Link } from 'react-router-dom';
import { Map, Store, Wrench, Footprints } from 'lucide-react';
import { useMultiStoreOverview } from '../../../hooks/useMultiStore';

export function OverviewPage() {
  const { data: overview, isLoading } = useMultiStoreOverview();

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Map size={24} /> Multi-Store View</h1>
          <p className="text-body text-kore-mid mt-xs">Vergleichende Übersicht aller Stores auf einen Blick.</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/multi-store/comparison" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Vergleich</Link>
          <Link to="/tools/multi-store/ranking" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Ranking</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Store-Übersicht...</div>
      ) : !overview?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Stores zugewiesen.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {overview.map((s: any) => (
            <div key={s.storeId} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-md">
                <Store size={18} className="text-kore-mid" />
                <div>
                  <span className="font-medium text-kore-ink">{s.storeName}</span>
                  {s.city && <span className="text-small text-kore-mid ml-sm">{s.city}</span>}
                </div>
              </div>

              {/* KPI */}
              {s.kpi ? (
                <div className="grid grid-cols-2 gap-sm mb-md">
                  <div className="bg-kore-bg p-sm text-center">
                    <span className="block text-small text-kore-mid">Revenue</span>
                    <span className="font-medium text-kore-ink">{s.kpi.revenue?.toLocaleString('de-DE')} €</span>
                  </div>
                  <div className="bg-kore-bg p-sm text-center">
                    <span className="block text-small text-kore-mid">Transaktionen</span>
                    <span className="font-medium text-kore-ink">{s.kpi.transactions}</span>
                  </div>
                </div>
              ) : (
                <div className="text-small text-kore-mid mb-md">Keine KPI-Daten</div>
              )}

              {/* Footfall 7d */}
              <div className="flex items-center gap-sm mb-sm text-small">
                <Footprints size={14} className="text-kore-mid" />
                <span className="text-kore-mid">7-Tage Footfall:</span>
                <span className="text-kore-ink font-medium">{s.footfall7d?.totalFootfall?.toLocaleString('de-DE') ?? '—'}</span>
              </div>

              {/* Open Maintenance */}
              {s.openMaintenance > 0 && (
                <div className="flex items-center gap-sm text-small">
                  <Wrench size={14} className="text-amber-500" />
                  <span className="text-amber-700">{s.openMaintenance} offene Wartungsanfragen</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
