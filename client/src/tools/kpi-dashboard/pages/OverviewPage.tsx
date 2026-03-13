import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, List } from 'lucide-react';
import { useKpiSummary } from '../../../hooks/useKpi';

export function OverviewPage() {
  const { data: stats, isLoading } = useKpiSummary();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">KPI Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Kennzahlen erfassen, vergleichen und Trends analysieren</p>
        </div>
        <div className="flex gap-md">
          <Link to="/tools/kpi/trends" className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors"><TrendingUp size={16} /> Trends</Link>
          <Link to="/tools/kpi/entries" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> Alle Eintraege</Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : stats && stats.totalEntries > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Umsatz</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(stats.avgRevenue ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Kundenfrequenz</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Math.round(stats.avgFootfall ?? 0)}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Conversion</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(stats.avgConversion ?? 0).toFixed(1)}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Bon-Wert</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(stats.avgAvgBasket ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Eintraege gesamt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalEntries}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Stores</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.storeCount ?? '-'}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø UPT</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{Number(stats.avgUpt ?? 0).toFixed(1)}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <BarChart3 size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine KPI-Daten</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erfassen Sie taegliche Kennzahlen, um Ihren Store-Performance-Ueberblick zu starten.</p>
          <Link to="/tools/kpi/entries" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> KPIs erfassen</Link>
        </div>
      )}
    </div>
  );
}
