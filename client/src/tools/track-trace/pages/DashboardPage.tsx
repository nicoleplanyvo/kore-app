import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Truck,
  ArrowRightLeft,
  ShoppingBag,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useTrackTraceStores, useTrackTraceDashboard } from '../../../hooks/useTrackTrace';

/* ── Period presets ────────────────────────────────── */
type PeriodPreset = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  week: 'Woche',
  month: 'Monat',
  quarter: 'Quartal',
  year: 'Jahr',
  custom: 'Benutzerdefiniert',
};

function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  switch (preset) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    default:
      return { from: '', to: '' };
  }
}

/* ── Bar chart ────────────────────────────────────── */
function MonthlyChart({ data }: { data: { month: string; transfers: number; cc: number }[] }) {
  if (!data.length) return <div className="text-small text-kore-mid py-lg text-center">Keine Daten vorhanden</div>;

  const maxVal = Math.max(...data.flatMap((d) => [d.transfers, d.cc]), 1);
  const barWidth = Math.max(8, Math.min(28, Math.floor(600 / data.length / 2.5)));
  const chartWidth = data.length * (barWidth * 2 + 16) + 60;
  const chartHeight = 180;

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartWidth, 400)} height={chartHeight + 60} className="block">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line x1={40} y1={chartHeight * (1 - pct) + 10} x2={chartWidth} y2={chartHeight * (1 - pct) + 10} stroke="#e5e5e5" strokeDasharray="2,2" />
            <text x={36} y={chartHeight * (1 - pct) + 14} textAnchor="end" className="fill-kore-mid" fontSize={9}>
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = 50 + i * (barWidth * 2 + 16);
          const tH = (d.transfers / maxVal) * chartHeight;
          const cH = (d.cc / maxVal) * chartHeight;
          return (
            <g key={d.month}>
              <rect x={x} y={chartHeight - tH + 10} width={barWidth} height={tH} fill="#1a1a1a" rx={1} />
              <rect x={x + barWidth + 2} y={chartHeight - cH + 10} width={barWidth} height={cH} fill="#9E8460" rx={1} />
              <text x={x + barWidth} y={chartHeight + 28} textAnchor="middle" className="fill-kore-mid" fontSize={8} transform={`rotate(-30, ${x + barWidth}, ${chartHeight + 28})`}>
                {d.month}
              </text>
            </g>
          );
        })}
        <rect x={50} y={chartHeight + 44} width={10} height={10} fill="#1a1a1a" rx={1} />
        <text x={64} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Transfers</text>
        <rect x={140} y={chartHeight + 44} width={10} height={10} fill="#9E8460" rx={1} />
        <text x={154} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Click & Collect</text>
      </svg>
    </div>
  );
}

/* ── Dashboard Page ───────────────────────────────── */
export function DashboardPage() {
  const { data: stores } = useTrackTraceStores();
  const [selectedStore, setSelectedStore] = useState('');
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateRange = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  const filters = useMemo(() => ({
    storeId: selectedStore || undefined,
    from: dateRange.from || undefined,
    to: dateRange.to || undefined,
  }), [selectedStore, dateRange]);

  const { data: dashboard, isLoading } = useTrackTraceDashboard(filters);

  const kpis = dashboard?.kpis;

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/track-trace" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Track & Trace Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Transfers, Click & Collect und Differenzen im Ueberblick.
          </p>
        </div>
      </div>

      {/* Controls */}
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
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Bis</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
            </div>
          </>
        )}
        {stores && stores.length > 1 && (
          <div>
            <label className="block text-small text-kore-mid mb-xs">Store</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-kore-border px-md py-sm text-small min-w-[180px]"
            >
              <option value="">Alle Stores</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.city ? ` (${s.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard-Daten...</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Truck size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{kpis?.total ?? 0}</div>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <ArrowRightLeft size={16} className="text-kore-ink" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Transfers</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{kpis?.transferCount ?? 0}</div>
              <span className="text-small text-kore-mid">{kpis?.completedTransfers ?? 0} abgeschlossen</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Clock size={16} className="text-amber-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Durchschn. Laufzeit</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">
                {kpis?.avgTransferDays ?? 0}
              </div>
              <span className="text-small text-kore-mid">Tage (Transfers)</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Differenzquote</span>
              </div>
              <div className={`font-display text-h1 ${
                (kpis?.differenceRate ?? 0) > 10 ? 'text-red-600' :
                (kpis?.differenceRate ?? 0) > 5 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                {kpis?.differenceRate ?? 0}%
              </div>
            </div>
          </div>

          {/* C&C KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <ShoppingBag size={16} className="text-purple-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Click & Collect</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{kpis?.clickCollectCount ?? 0}</div>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeholt</span>
              </div>
              <div className="font-display text-h1 text-emerald-600">{kpis?.ccCompleted ?? 0}</div>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Clock size={16} className="text-amber-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Offen (C&C)</span>
              </div>
              <div className="font-display text-h1 text-amber-600">{kpis?.ccPending ?? 0}</div>
            </div>
          </div>

          {/* Status breakdown */}
          {dashboard?.byStatus && Object.keys(dashboard.byStatus).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Verteilung nach Status</h2>
              <div className="space-y-sm">
                {Object.entries(dashboard.byStatus)
                  .sort(([, a]: any, [, b]: any) => b - a)
                  .map(([status, count]: any) => {
                    const pct = kpis?.total ? Math.round((count / kpis.total) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-md">
                        <span className="w-40 text-small text-kore-ink truncate">
                          {status === 'ORDERED' ? 'Erstellt' :
                           status === 'SHIPPED' ? 'Versendet' :
                           status === 'IN_TRANSIT' ? 'Unterwegs' :
                           status === 'DELIVERED' ? 'Empfangen' :
                           status === 'COMPLETED' ? 'Abgeschlossen' :
                           status === 'IN_STORE' ? 'Im Store' :
                           status === 'READY' ? 'Bereit' :
                           status === 'PICKED_UP' ? 'Abgeholt' :
                           status === 'DIFFERENCE_REPORTED' ? 'Differenz' :
                           status === 'RETURNED' ? 'Retourniert' : status}
                        </span>
                        <div className="flex-1 bg-kore-bg h-3 relative">
                          <div
                            className={`h-full ${
                              status === 'DIFFERENCE_REPORTED' ? 'bg-red-500' :
                              status === 'RETURNED' ? 'bg-red-400' :
                              ['DELIVERED', 'COMPLETED', 'PICKED_UP'].includes(status) ? 'bg-emerald-500' :
                              'bg-kore-brass'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-small text-right text-kore-ink font-medium">{count}</span>
                        <span className="w-12 text-small text-right text-kore-mid">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Monthly trend chart */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Monatlicher Verlauf</h2>
            <MonthlyChart data={dashboard?.trends ?? []} />
          </div>

          {/* Per-store table */}
          {dashboard?.storeStats && dashboard.storeStats.length > 1 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Store-Vergleich</h2>
              <table className="w-full text-small">
                <thead>
                  <tr className="border-b border-kore-border">
                    <th className="text-left px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Store</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Gesamt</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Transfers</th>
                    <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">C&C</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.storeStats.map((s: any) => (
                    <tr key={s.id} className="border-b border-kore-border last:border-0">
                      <td className="px-md py-sm text-kore-ink">{s.name}</td>
                      <td className="px-md py-sm text-right text-kore-ink font-medium">{s.total}</td>
                      <td className="px-md py-sm text-right text-kore-ink">{s.transfers}</td>
                      <td className="px-md py-sm text-right text-kore-ink">{s.cc}</td>
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
