import { Link } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, TrendingUp, Store, Package, Truck, GraduationCap, Wrench } from 'lucide-react';
import { useRmSummary } from '../../../hooks/useRmDashboard';

export function OverviewPage() {
  const { data: summary, isLoading } = useRmSummary();

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><LayoutDashboard size={24} /> RM Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Executive-Überblick über alle Stores der Region.</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/rm-dashboard/alerts" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <AlertTriangle size={14} /> Alerts
          </Link>
          <Link to="/tools/rm-dashboard/trends" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <TrendingUp size={14} /> Trends
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard...</div>
      ) : !summary ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Daten verfügbar.</div>
      ) : (
        <>
          {/* Top-Level KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Store size={20} className="mx-auto text-kore-mid mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Stores</span>
              <span className="font-display text-h2 text-kore-ink">{summary.storeCount}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">Revenue (7d)</span>
              <span className="font-display text-h2 text-kore-ink">{summary.kpi?.totalRevenue?.toLocaleString('de-DE')} €</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">Transaktionen (7d)</span>
              <span className="font-display text-h2 text-kore-ink">{summary.kpi?.totalTransactions?.toLocaleString('de-DE')}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">Footfall (7d)</span>
              <span className="font-display text-h2 text-kore-ink">{summary.totalFootfall?.toLocaleString('de-DE')}</span>
            </div>
          </div>

          {/* Operational Status */}
          <h2 className="font-display text-h3 text-kore-ink mb-md">Operativer Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Wrench size={20} className="mx-auto text-amber-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Offene Wartung</span>
              <span className="font-display text-h2 text-kore-ink">{summary.openMaintenance}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Package size={20} className="mx-auto text-blue-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Stock Callouts</span>
              <span className="font-display text-h2 text-kore-ink">{summary.openStockCallouts}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Truck size={20} className="mx-auto text-purple-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Laufende Bestellungen</span>
              <span className="font-display text-h2 text-kore-ink">{summary.pendingOrders}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <GraduationCap size={20} className="mx-auto text-emerald-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Training abgeschlossen</span>
              <span className="font-display text-h2 text-kore-ink">{summary.trainingCompletionRate}%</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
