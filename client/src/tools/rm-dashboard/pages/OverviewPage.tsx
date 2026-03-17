import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Store,
  Package,
  Truck,
  GraduationCap,
  Wrench,
  BarChart3,
  Trophy,
  Download,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useRmSummary, useRmRanking, useRmAlerts } from '../../../hooks/useRmDashboard';
import { api } from '../../../lib/api';
import type { RmExportRow } from '../../../hooks/useRmDashboard';

type PeriodPreset = 'week' | 'month' | 'quarter' | 'year' | 'custom';
const PERIOD_LABELS: Record<PeriodPreset, string> = {
  week: '7 Tage',
  month: '30 Tage',
  quarter: '90 Tage',
  year: '1 Jahr',
  custom: 'Eigener Zeitraum',
};

function changeIndicator(value: number) {
  if (value === 0) return <span className="text-small text-kore-mid">--</span>;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-xs text-small font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

function statusDot(status: 'green' | 'yellow' | 'red') {
  const colors = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-red-500' };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]}`} />;
}

export function OverviewPage() {
  const [preset, setPreset] = useState<PeriodPreset>('week');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [rankKpi, setRankKpi] = useState('revenue');

  const periodParams = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return { period: preset };
  }, [preset, customFrom, customTo]);

  const { data: summary, isLoading: summaryLoading } = useRmSummary(periodParams);
  const { data: ranking, isLoading: rankingLoading } = useRmRanking({ ...periodParams, kpi: rankKpi });
  const { data: alerts } = useRmAlerts();

  const criticalAlerts = alerts?.filter((a) => a.severity === 'URGENT' || a.severity === 'CRITICAL').length ?? 0;

  // CSV export
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (preset === 'custom') {
        if (customFrom) params.set('from', customFrom);
        if (customTo) params.set('to', customTo);
      } else {
        params.set('period', preset);
      }

      const rows = await api<RmExportRow[]>(`/api/tools/rm-dashboard/export?${params}`);
      if (!rows?.length) return;

      const headers = ['Store', 'Datum', 'Revenue', 'Transaktionen', 'Footfall', 'Stueck verkauft'];
      const csvRows = rows.map((r) => [
        `"${r.store}"`,
        r.date,
        r.revenue,
        r.transactions,
        r.footfall,
        r.unitsSold,
      ]);

      const csvContent = [headers.join(';'), ...csvRows.map((r) => r.join(';'))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rm-dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  }, [preset, customFrom, customTo]);

  return (
    <div className="p-xl max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <LayoutDashboard size={24} /> RM Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Executive-Ueberblick ueber alle Stores der Region.
          </p>
        </div>
        <div className="flex gap-sm">
          <button
            onClick={handleExport}
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <Download size={14} /> CSV Export
          </button>
          <Link
            to="/tools/rm-dashboard/ranking"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <Trophy size={14} /> Ranking
          </Link>
          <Link
            to="/tools/rm-dashboard/alerts"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors relative"
          >
            <AlertTriangle size={14} /> Alerts
            {criticalAlerts > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {criticalAlerts}
              </span>
            )}
          </Link>
          <Link
            to="/tools/rm-dashboard/trends"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <TrendingUp size={14} /> Trends
          </Link>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-end gap-md mb-xl">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Zeitraum</label>
          <div className="flex gap-xs">
            {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-md py-xs text-small border transition-colors ${
                  preset === p
                    ? 'bg-kore-ink text-kore-white border-kore-ink'
                    : 'border-kore-border text-kore-mid hover:text-kore-ink'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {preset === 'custom' && (
          <>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Von</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="border border-kore-border px-md py-sm text-small"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Bis</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="border border-kore-border px-md py-sm text-small"
              />
            </div>
          </>
        )}
      </div>

      {summaryLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard...</div>
      ) : !summary ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Daten verfuegbar.
        </div>
      ) : (
        <>
          {/* Store count */}
          <div className="mb-lg">
            <span className="text-small text-kore-mid">
              {summary.storeCount} Stores / Zeitraum: {summary.period.from ?? '--'} bis {summary.period.to ?? '--'}
            </span>
          </div>

          {/* KPI Tiles Row 1: Revenue, Transactions, Footfall */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-md">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-sm">
                <span className="text-small text-kore-mid uppercase tracking-widest">Umsatz</span>
                {changeIndicator(summary.kpi.revenueChange)}
              </div>
              <div className="font-display text-h1 text-kore-ink">
                {summary.kpi.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EUR
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-sm">
                <span className="text-small text-kore-mid uppercase tracking-widest">Transaktionen</span>
                {changeIndicator(summary.kpi.transactionChange)}
              </div>
              <div className="font-display text-h1 text-kore-ink">
                {summary.kpi.totalTransactions.toLocaleString('de-DE')}
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-sm">
                <span className="text-small text-kore-mid uppercase tracking-widest">Frequenz</span>
                {changeIndicator(summary.kpi.footfallChange)}
              </div>
              <div className="font-display text-h1 text-kore-ink">
                {summary.kpi.totalFootfall.toLocaleString('de-DE')}
              </div>
            </div>
          </div>

          {/* KPI Tiles Row 2: Conversion, Avg Ticket, Units */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Konversionsrate</span>
              <div className="font-display text-h2 text-kore-ink">{summary.kpi.avgConversionRate}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Durchschn. Bon</span>
              <div className="font-display text-h2 text-kore-ink">{summary.kpi.avgTicket.toLocaleString('de-DE')} EUR</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Stueck verkauft</span>
              <div className="font-display text-h2 text-kore-ink">{summary.kpi.totalUnitsSold.toLocaleString('de-DE')}</div>
            </div>
          </div>

          {/* Operational Status */}
          <h2 className="font-display text-h3 text-kore-ink mb-md">Operativer Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-2xl">
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Wrench size={20} className="mx-auto text-amber-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Offene Wartung</span>
              <span className="font-display text-h2 text-kore-ink">{summary.operational.openMaintenance}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Package size={20} className="mx-auto text-blue-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Stock Callouts</span>
              <span className="font-display text-h2 text-kore-ink">{summary.operational.openStockCallouts}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <Truck size={20} className="mx-auto text-purple-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Laufende Bestellungen</span>
              <span className="font-display text-h2 text-kore-ink">{summary.operational.pendingOrders}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <ShieldAlert size={20} className="mx-auto text-red-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Offene Verluste</span>
              <span className="font-display text-h2 text-kore-ink">{summary.operational.openLossIncidents}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <GraduationCap size={20} className="mx-auto text-emerald-500 mb-sm" />
              <span className="block text-small text-kore-mid mb-xs">Training-Quote</span>
              <span className="font-display text-h2 text-kore-ink">{summary.operational.trainingCompletionRate}%</span>
            </div>
          </div>

          {/* Store Ranking Preview */}
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm">
              <BarChart3 size={18} /> Store-Ranking
            </h2>
            <div className="flex items-center gap-md">
              <select
                value={rankKpi}
                onChange={(e) => setRankKpi(e.target.value)}
                className="border border-kore-border px-md py-xs text-small"
              >
                <option value="revenue">Umsatz</option>
                <option value="transactions">Transaktionen</option>
                <option value="footfall">Frequenz</option>
                <option value="conversionRate">Konversionsrate</option>
                <option value="avgTicket">Durchschn. Bon</option>
                <option value="unitsSold">Stueck verkauft</option>
              </select>
              <Link
                to="/tools/rm-dashboard/ranking"
                className="text-small text-kore-brass hover:text-kore-ink transition-colors"
              >
                Alle anzeigen
              </Link>
            </div>
          </div>

          {rankingLoading ? (
            <div className="text-body text-kore-mid">Lade Ranking...</div>
          ) : !ranking?.length ? (
            <div className="bg-kore-white border border-kore-border p-lg text-center text-small text-kore-mid">
              Keine Ranking-Daten vorhanden.
            </div>
          ) : (
            <div className="bg-kore-white border border-kore-border overflow-hidden mb-2xl">
              <table className="w-full text-small">
                <thead>
                  <tr className="border-b border-kore-border bg-kore-bg">
                    <th className="text-center px-md py-sm text-kore-mid font-medium w-12">#</th>
                    <th className="text-center px-sm py-sm text-kore-mid font-medium w-10"></th>
                    <th className="text-left px-md py-sm text-kore-mid font-medium">Store</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium">Umsatz</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium">Transaktionen</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium">Frequenz</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium">Konversion</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium">Bon</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.slice(0, 10).map((r) => (
                    <tr key={r.storeId} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50 transition-colors">
                      <td className="text-center px-md py-sm text-kore-mid font-medium">{r.rank}</td>
                      <td className="text-center px-sm py-sm">{statusDot(r.status)}</td>
                      <td className="px-md py-sm">
                        <Link
                          to={`/tools/rm-dashboard/store/${r.storeId}`}
                          className="text-kore-ink hover:text-kore-brass transition-colors font-medium"
                        >
                          {r.storeName}
                        </Link>
                        {r.city && <span className="text-kore-mid ml-xs">({r.city})</span>}
                      </td>
                      <td className="text-right px-md py-sm text-kore-ink">{r.revenue.toLocaleString('de-DE')} EUR</td>
                      <td className="text-right px-md py-sm text-kore-ink">{r.transactions.toLocaleString('de-DE')}</td>
                      <td className="text-right px-md py-sm text-kore-ink">{r.footfall.toLocaleString('de-DE')}</td>
                      <td className="text-right px-md py-sm text-kore-ink">{r.conversionRate}%</td>
                      <td className="text-right px-md py-sm text-kore-ink">{r.avgTicket.toLocaleString('de-DE')} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
