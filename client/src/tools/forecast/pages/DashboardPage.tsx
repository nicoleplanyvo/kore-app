import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Download,
  Store,
} from 'lucide-react';
import {
  useForecastStores,
  useForecastDashboard,
  useForecastAccuracy,
} from '../../../hooks/useForecast';
import { api } from '../../../lib/api';

/* ──────────────────────────────────────────────
   Period presets
   ────────────────────────────────────────────── */
type PeriodPreset = 'today' | 'week' | 'month' | 'year' | 'custom';

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: 'Heute',
  week: 'Woche',
  month: 'Monat',
  year: 'Jahr',
  custom: 'Benutzerdefiniert',
};

function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  switch (preset) {
    case 'today':
      return { from: to, to };
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
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    default:
      return { from: '', to: '' };
  }
}

/* ──────────────────────────────────────────────
   Simple bar chart component (SVG)
   ────────────────────────────────────────────── */
function BarChart({ data }: { data: { period: string; forecast: number; actual: number }[] }) {
  if (!data.length) return <div className="text-small text-kore-mid py-lg text-center">Keine Daten vorhanden</div>;

  const maxVal = Math.max(...data.flatMap((d) => [d.forecast, d.actual]), 1);
  const barWidth = Math.max(8, Math.min(32, Math.floor(600 / data.length / 2.5)));
  const chartWidth = data.length * (barWidth * 2 + 12) + 40;
  const chartHeight = 200;

  return (
    <div className="overflow-x-auto">
      <svg width={Math.max(chartWidth, 400)} height={chartHeight + 60} className="block">
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line
              x1={40}
              y1={chartHeight * (1 - pct) + 10}
              x2={chartWidth}
              y2={chartHeight * (1 - pct) + 10}
              stroke="#e5e5e5"
              strokeDasharray="2,2"
            />
            <text
              x={36}
              y={chartHeight * (1 - pct) + 14}
              textAnchor="end"
              className="fill-kore-mid"
              fontSize={9}
            >
              {Math.round(maxVal * pct).toLocaleString('de-DE')}
            </text>
          </g>
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const x = 50 + i * (barWidth * 2 + 12);
          const fH = (d.forecast / maxVal) * chartHeight;
          const aH = (d.actual / maxVal) * chartHeight;
          return (
            <g key={d.period}>
              {/* Forecast bar */}
              <rect
                x={x}
                y={chartHeight - fH + 10}
                width={barWidth}
                height={fH}
                fill="#1a1a1a"
                rx={1}
              />
              {/* Actual bar */}
              <rect
                x={x + barWidth + 2}
                y={chartHeight - aH + 10}
                width={barWidth}
                height={aH}
                fill="#9E8460"
                rx={1}
              />
              {/* Label */}
              <text
                x={x + barWidth}
                y={chartHeight + 28}
                textAnchor="middle"
                className="fill-kore-mid"
                fontSize={8}
                transform={`rotate(-30, ${x + barWidth}, ${chartHeight + 28})`}
              >
                {d.period.length > 7 ? d.period.slice(5) : d.period}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <rect x={50} y={chartHeight + 44} width={10} height={10} fill="#1a1a1a" rx={1} />
        <text x={64} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Prognose</text>
        <rect x={130} y={chartHeight + 44} width={10} height={10} fill="#9E8460" rx={1} />
        <text x={144} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Ist-Wert</text>
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Accuracy trend line (SVG)
   ────────────────────────────────────────────── */
function AccuracyTrendChart({ data }: { data: { period: string; forecast: number; actual: number }[] }) {
  const points = data
    .filter((d) => d.actual > 0)
    .map((d) => {
      if (d.forecast === 0) return { period: d.period, accuracy: d.actual === 0 ? 100 : 0 };
      const acc = Math.max(0, 100 - Math.abs((d.actual - d.forecast) / d.forecast * 100));
      return { period: d.period, accuracy: Math.round(acc * 100) / 100 };
    });

  if (points.length < 2) return <div className="text-small text-kore-mid py-lg text-center">Nicht genug Daten fuer Trendlinie</div>;

  const chartWidth = Math.max(400, points.length * 40 + 80);
  const chartHeight = 160;
  const maxY = 100;

  const linePoints = points.map((p, i) => {
    const x = 50 + (i / (points.length - 1)) * (chartWidth - 80);
    const y = chartHeight - (p.accuracy / maxY) * chartHeight + 10;
    return { x, y, ...p };
  });

  const pathD = linePoints.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 50} className="block">
        {/* Gridlines */}
        {[0, 25, 50, 75, 100].map((val) => (
          <g key={val}>
            <line
              x1={40}
              y1={chartHeight - (val / maxY) * chartHeight + 10}
              x2={chartWidth - 10}
              y2={chartHeight - (val / maxY) * chartHeight + 10}
              stroke="#e5e5e5"
              strokeDasharray="2,2"
            />
            <text
              x={36}
              y={chartHeight - (val / maxY) * chartHeight + 14}
              textAnchor="end"
              className="fill-kore-mid"
              fontSize={9}
            >
              {val}%
            </text>
          </g>
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke="#9E8460" strokeWidth={2} />
        {/* Dots */}
        {linePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#9E8460" />
        ))}
        {/* X labels */}
        {linePoints.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={chartHeight + 28}
            textAnchor="middle"
            className="fill-kore-mid"
            fontSize={8}
            transform={`rotate(-30, ${p.x}, ${chartHeight + 28})`}
          >
            {p.period.length > 7 ? p.period.slice(5) : p.period}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Dashboard Page
   ────────────────────────────────────────────── */
export function DashboardPage() {
  const { data: stores } = useForecastStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateRange = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  const filters = useMemo(
    () => ({
      storeId: selectedStore || undefined,
      from: dateRange.from || undefined,
      to: dateRange.to || undefined,
    }),
    [selectedStore, dateRange],
  );

  const { data: dashboard, isLoading: dashLoading } = useForecastDashboard(filters);
  const { data: accuracy, isLoading: accLoading } = useForecastAccuracy(filters);

  const isLoading = dashLoading || accLoading;

  // CSV export
  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({ pageSize: '500' });
      if (selectedStore) params.set('storeId', selectedStore);
      if (dateRange.from) params.set('from', dateRange.from);
      if (dateRange.to) params.set('to', dateRange.to);

      const data = await api<{ data: any[] }>(`/api/tools/forecast?${params}`);
      if (!data?.data?.length) return;

      const headers = ['Datum', 'Typ', 'Prognose', 'Ist-Wert', 'Abweichung (%)', 'Genauigkeit (%)', 'Methode', 'Notizen'];
      const rows = data.data.map((f: any) => {
        const deviation = f.actualValue !== null && f.forecastValue > 0
          ? (((f.actualValue - f.forecastValue) / f.forecastValue) * 100).toFixed(2)
          : '';
        const acc = f.actualValue !== null && f.forecastValue > 0
          ? Math.max(0, 100 - Math.abs(Number(deviation))).toFixed(2)
          : '';
        return [
          f.period,
          f.forecastType,
          f.forecastValue,
          f.actualValue ?? '',
          deviation,
          acc,
          f.method,
          (f.notes ?? '').replace(/"/g, '""'),
        ];
      });

      const csvContent = [
        headers.join(';'),
        ...rows.map((r: any[]) => r.map((c: any) => `"${c}"`).join(';')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  }, [selectedStore, dateRange]);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/forecast" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Forecast Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Genauigkeit, Trends und Vergleiche im Ueberblick.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
        >
          <Download size={16} /> CSV Export
        </button>
      </div>

      {/* Controls: Period & Store selector */}
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
        {stores && stores.length > 1 && (
          <div>
            <label className="block text-small text-kore-mid mb-xs">Store</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-kore-border px-md py-sm text-small min-w-[180px]"
            >
              <option value="">Alle Stores</option>
              {stores.map((s) => (
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
                <Target size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Anzahl Prognosen</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{dashboard?.totalForecasts ?? 0}</div>
              <span className="text-small text-kore-mid">{dashboard?.withActuals ?? 0} mit Ist-Wert</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <TrendingUp size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Durchschn. Genauigkeit</span>
              </div>
              <div className={`font-display text-h1 ${
                (dashboard?.avgAccuracy ?? 0) >= 85 ? 'text-emerald-600' :
                (dashboard?.avgAccuracy ?? 0) >= 70 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {(dashboard?.avgAccuracy ?? 0).toFixed(1)}%
              </div>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Store size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Bester Store</span>
              </div>
              <div className="font-display text-h2 text-kore-ink truncate">{dashboard?.bestStore?.name ?? '-'}</div>
              <span className="text-small text-emerald-600">{(dashboard?.bestStore?.accuracy ?? 0).toFixed(1)}% Genauigkeit</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <TrendingDown size={16} className="text-red-500" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Schlechteste Abweichung</span>
              </div>
              <div className="font-display text-h2 text-kore-ink truncate">{dashboard?.worstStore?.name ?? '-'}</div>
              <span className="text-small text-red-500">{(dashboard?.worstStore?.accuracy ?? 0).toFixed(1)}% Genauigkeit</span>
            </div>
          </div>

          {/* Bar Chart: Forecast vs Actual */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Prognose vs. Ist-Wert</h2>
            <BarChart data={dashboard?.trendData ?? []} />
          </div>

          {/* Accuracy trend line */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Genauigkeits-Trend</h2>
            <AccuracyTrendChart data={dashboard?.trendData ?? []} />
          </div>

          {/* Two columns: User ranking + Store accuracy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-xl">
            {/* Staff accuracy ranking */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <Users size={18} /> Mitarbeiter-Genauigkeit
              </h2>
              {dashboard?.accuracyByUser?.length ? (
                <div className="space-y-sm">
                  {dashboard.accuracyByUser.map((u, idx) => (
                    <div key={u.userId} className="flex items-center gap-md">
                      <span className="w-6 text-small text-kore-mid text-right">{idx + 1}.</span>
                      <span className="flex-1 text-small text-kore-ink truncate">{u.userName}</span>
                      <div className="w-32 bg-kore-bg h-3 relative">
                        <div
                          className={`h-full ${u.avgAccuracy >= 85 ? 'bg-emerald-500' : u.avgAccuracy >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${u.avgAccuracy}%` }}
                        />
                      </div>
                      <span className="w-16 text-small text-right font-medium text-kore-ink">{u.avgAccuracy.toFixed(1)}%</span>
                      <span className="w-10 text-small text-right text-kore-mid">{u.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Noch keine Daten vorhanden.</p>
              )}
            </div>

            {/* Store accuracy */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <Store size={18} /> Store-Genauigkeit
              </h2>
              {accuracy?.byStore?.length ? (
                <div className="space-y-sm">
                  {accuracy.byStore
                    .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
                    .map((s, idx) => (
                      <div key={s.storeId} className="flex items-center gap-md">
                        <span className="w-6 text-small text-kore-mid text-right">{idx + 1}.</span>
                        <span className="flex-1 text-small text-kore-ink truncate">{s.storeName}</span>
                        <div className="w-32 bg-kore-bg h-3 relative">
                          <div
                            className={`h-full ${s.avgAccuracy >= 85 ? 'bg-emerald-500' : s.avgAccuracy >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${s.avgAccuracy}%` }}
                          />
                        </div>
                        <span className="w-16 text-small text-right font-medium text-kore-ink">{s.avgAccuracy.toFixed(1)}%</span>
                        <span className="w-10 text-small text-right text-kore-mid">{s.count}x</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Noch keine Daten vorhanden.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
