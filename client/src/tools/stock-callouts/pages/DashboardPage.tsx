import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, Package, AlertTriangle, Store,
  TrendingUp, ShoppingCart,
} from 'lucide-react';
import {
  useStockCalloutStores,
  useStockCalloutsDashboard,
} from '../../../hooks/useStockCallouts';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

const URGENCY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export function DashboardPage() {
  const { data: stores } = useStockCalloutStores();
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

  const { data: dashboard, isLoading } = useStockCalloutsDashboard(filters);

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/stock-callouts" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Stock Callouts Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Aggregierte Uebersicht: fehlende Artikel, Store-Vergleich, Buying-Info
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-md mb-lg">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Zeitraum</label>
          <div className="flex gap-xs">
            {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-md py-xs text-small border transition-colors ${
                  preset === p ? 'bg-kore-ink text-kore-white border-kore-ink' : 'border-kore-border text-kore-mid hover:text-kore-ink'
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
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Bis</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
            </div>
          </>
        )}
        {stores && stores.length > 1 && (
          <div>
            <label className="block text-small text-kore-mid mb-xs">Store</label>
            <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border border-kore-border px-md py-sm text-small min-w-[180px]">
              <option value="">Alle Stores</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard-Daten...</div>
      ) : dashboard ? (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <Package size={16} className="text-kore-brass" />
                <span className="text-xs text-kore-mid uppercase tracking-widest">Gesamt</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{dashboard.kpis.total}</div>
              <span className="text-small text-kore-mid">{dashboard.kpis.open} offen</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-xs text-kore-mid uppercase tracking-widest">Kritisch / Hoch</span>
              </div>
              <div className="font-display text-h1 text-red-600">{dashboard.kpis.critical}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-xs text-kore-mid uppercase tracking-widest">Loesungsrate</span>
              </div>
              <div className="font-display text-h1 text-emerald-600">{dashboard.kpis.resolutionRate}%</div>
              <span className="text-small text-kore-mid">{dashboard.kpis.resolved} geloest</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <ShoppingCart size={16} className="text-purple-600" />
                <span className="text-xs text-kore-mid uppercase tracking-widest">In Transfer</span>
              </div>
              <div className="font-display text-h1 text-purple-600">{dashboard.kpis.inTransfer}</div>
              <span className="text-small text-kore-mid">{dashboard.kpis.offered} angeboten</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-lg">
            {/* Top fehlende Artikel */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
                <Package size={18} /> Top fehlende Artikel
              </h2>
              {dashboard.topMissing?.length ? (
                <div className="space-y-sm">
                  {dashboard.topMissing.map((item: any, idx: number) => (
                    <div key={item.sku} className="flex items-center gap-md">
                      <span className="w-6 text-small text-kore-mid text-right">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-small font-medium text-kore-ink block truncate">{item.productName}</span>
                        <span className="text-xs text-kore-mid">SKU: {item.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-small font-bold text-kore-ink block">{item.count}x</span>
                        <span className="text-xs text-kore-mid">{item.storeCount} Store{item.storeCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="w-20 bg-kore-bg h-3">
                        <div
                          className="h-full bg-kore-brass"
                          style={{ width: `${Math.min(100, (item.count / (dashboard.topMissing[0]?.count || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
              )}
            </div>

            {/* Store-Vergleich */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
                <Store size={18} /> Store-Vergleich
              </h2>
              {dashboard.storeComparison?.length ? (
                <div className="space-y-sm">
                  {dashboard.storeComparison.map((store: any, idx: number) => (
                    <div key={store.storeId} className="flex items-center gap-md">
                      <span className="w-6 text-small text-kore-mid text-right">{idx + 1}.</span>
                      <span className="flex-1 text-small text-kore-ink truncate">{store.storeName}</span>
                      <div className="flex gap-sm text-xs">
                        <span className="bg-blue-100 text-blue-700 px-sm py-xs">{store.open} offen</span>
                        <span className="bg-emerald-100 text-emerald-700 px-sm py-xs">{store.resolved} gel.</span>
                        {store.critical > 0 && (
                          <span className="bg-red-100 text-red-700 px-sm py-xs">{store.critical} krit.</span>
                        )}
                      </div>
                      <span className="text-small font-bold text-kore-ink w-10 text-right">{store.total}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
              )}
            </div>
          </div>

          {/* Buying-Info: Aggregierte Uebersicht fuer Buying/Allocation */}
          <div className="bg-kore-white border border-kore-border p-lg mb-lg">
            <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
              <ShoppingCart size={18} /> Buying-Info: Offene Bedarfe
            </h2>
            <p className="text-small text-kore-mid mb-md">
              Aggregierte Uebersicht welche Artikel in welchen Stores fehlen — fuer Buying und Allocation.
            </p>
            {dashboard.buyingInfo?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-kore-border text-left text-kore-mid">
                      <th className="pb-sm pr-md">Artikel</th>
                      <th className="pb-sm pr-md">SKU</th>
                      <th className="pb-sm pr-md">Stores</th>
                      <th className="pb-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-kore-border">
                    {dashboard.buyingInfo.map((item: any) => (
                      <tr key={item.sku}>
                        <td className="py-sm pr-md font-medium text-kore-ink">{item.productName}</td>
                        <td className="py-sm pr-md text-kore-mid">{item.sku}</td>
                        <td className="py-sm pr-md">
                          <span className="bg-kore-brass/10 text-kore-brass px-sm py-xs text-xs font-medium">
                            {item.stores.length} Store{item.stores.length > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-sm">
                          <div className="flex flex-wrap gap-xs">
                            {item.stores.map((s: any, i: number) => (
                              <span key={i} className={`px-sm py-xs text-xs ${URGENCY_COLORS[s.urgency] ?? 'bg-kore-bg text-kore-mid'}`}>
                                {s.storeName}: {s.requestedQty} Stk.
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-small text-kore-mid">Keine offenen Bedarfe vorhanden.</p>
            )}
          </div>

          {/* Trend Chart (simple SVG bar chart) */}
          {dashboard.trends?.length > 1 && (
            <div className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Callout-Verlauf</h2>
              <TrendChart data={dashboard.trends} />
            </div>
          )}
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Dashboard-Daten verfuegbar.
        </div>
      )}
    </div>
  );
}

/* ── Simple SVG Trend Chart ──────────────────────────── */
function TrendChart({ data }: { data: { date: string; created: number; resolved: number }[] }) {
  if (!data.length) return null;

  const maxVal = Math.max(...data.flatMap(d => [d.created, d.resolved]), 1);
  const barWidth = Math.max(8, Math.min(24, Math.floor(600 / data.length / 2.5)));
  const chartWidth = data.length * (barWidth * 2 + 12) + 60;
  const chartHeight = 180;

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartWidth, 400)} height={chartHeight + 60} className="block">
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <g key={pct}>
            <line x1={40} y1={chartHeight * (1 - pct) + 10} x2={chartWidth} y2={chartHeight * (1 - pct) + 10} stroke="#e5e5e5" strokeDasharray="2,2" />
            <text x={36} y={chartHeight * (1 - pct) + 14} textAnchor="end" className="fill-kore-mid" fontSize={9}>
              {Math.round(maxVal * pct)}
            </text>
          </g>
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const x = 50 + i * (barWidth * 2 + 12);
          const cH = (d.created / maxVal) * chartHeight;
          const rH = (d.resolved / maxVal) * chartHeight;
          return (
            <g key={d.date}>
              <rect x={x} y={chartHeight - cH + 10} width={barWidth} height={cH} fill="#1a1a1a" rx={1} />
              <rect x={x + barWidth + 2} y={chartHeight - rH + 10} width={barWidth} height={rH} fill="#9E8460" rx={1} />
              <text x={x + barWidth} y={chartHeight + 28} textAnchor="middle" className="fill-kore-mid" fontSize={8} transform={`rotate(-30, ${x + barWidth}, ${chartHeight + 28})`}>
                {d.date.slice(5)}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <rect x={50} y={chartHeight + 44} width={10} height={10} fill="#1a1a1a" rx={1} />
        <text x={64} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Erstellt</text>
        <rect x={130} y={chartHeight + 44} width={10} height={10} fill="#9E8460" rx={1} />
        <text x={144} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Geloest</text>
      </svg>
    </div>
  );
}
