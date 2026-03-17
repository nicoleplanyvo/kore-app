import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Heart,
  Zap,
  AlertTriangle,
  Briefcase,
  Users,
  Store,
} from 'lucide-react';
import {
  useWellbeingStores,
  useWellbeingDashboard,
} from '../../../hooks/useWellbeing';

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

function scoreColor(val: number | null, inverted?: boolean): string {
  if (val === null) return 'text-kore-mid';
  if (inverted) {
    if (val > 3) return 'text-red-600';
    if (val > 2) return 'text-amber-600';
    return 'text-emerald-600';
  }
  if (val >= 4) return 'text-emerald-600';
  if (val >= 3) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(val: number | null, inverted?: boolean): string {
  if (val === null) return 'bg-kore-bg';
  if (inverted) {
    if (val > 3) return 'bg-red-500';
    if (val > 2) return 'bg-amber-500';
    return 'bg-emerald-500';
  }
  if (val >= 4) return 'bg-emerald-500';
  if (val >= 3) return 'bg-amber-500';
  return 'bg-red-500';
}

/* SVG Trend Line */
function TrendLineChart({ data }: { data: { date: string; avgMood: number; checkIns: number }[] }) {
  if (data.length < 2) return <div className="text-small text-kore-mid py-lg text-center">Nicht genug Daten fuer Trendlinie</div>;

  const chartWidth = Math.max(400, data.length * 30 + 80);
  const chartHeight = 160;
  const maxY = 5;

  const points = data.map((p, i) => ({
    x: 50 + (i / (data.length - 1)) * (chartWidth - 80),
    y: chartHeight - (p.avgMood / maxY) * chartHeight + 10,
    ...p,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 50} className="block">
        {[1, 2, 3, 4, 5].map((val) => (
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
              {val}
            </text>
          </g>
        ))}
        <path d={pathD} fill="none" stroke="#9E8460" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#9E8460" />
        ))}
        {points.map((p, i) => (
          <text
            key={`l-${i}`}
            x={p.x}
            y={chartHeight + 28}
            textAnchor="middle"
            className="fill-kore-mid"
            fontSize={8}
            transform={`rotate(-30, ${p.x}, ${chartHeight + 28})`}
          >
            {p.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function DashboardPage() {
  const { data: stores } = useWellbeingStores();
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

  const { data: dashboard, isLoading } = useWellbeingDashboard(filters);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/wellbeing" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Wellbeing Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Trend, Teilnahmequote, Alerts und Store-Vergleich.
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
      ) : !dashboard ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Daten vorhanden.
        </div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Heart size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Stimmung</span>
              </div>
              <div className={`font-display text-h1 ${scoreColor(dashboard.kpis.avgMood)}`}>
                {dashboard.kpis.avgMood !== null ? dashboard.kpis.avgMood.toFixed(1) : '--'}
              </div>
              <span className="text-small text-kore-mid">von 5.0</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Users size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Teilnahme</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{dashboard.kpis.total}</div>
              <span className="text-small text-kore-mid">{dashboard.kpis.participationCount} Teilnehmer</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Zap size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Energie</span>
              </div>
              <div className={`font-display text-h1 ${scoreColor(dashboard.kpis.avgEnergy)}`}>
                {dashboard.kpis.avgEnergy !== null ? dashboard.kpis.avgEnergy.toFixed(1) : '--'}
              </div>
              <span className="text-small text-kore-mid">von 5.0</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <AlertTriangle size={16} className={dashboard.kpis.criticalAlerts > 0 ? 'text-red-500' : 'text-kore-mid'} />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Kritische Alerts</span>
              </div>
              <div className={`font-display text-h1 ${dashboard.kpis.criticalAlerts > 0 ? 'text-red-600' : 'text-kore-ink'}`}>
                {dashboard.kpis.criticalAlerts}
              </div>
              <span className="text-small text-kore-mid">Stimmung unter 2</span>
            </div>
          </div>

          {/* Additional KPIs row */}
          <div className="grid grid-cols-2 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Stress</span>
              </div>
              <div className={`font-display text-h1 ${scoreColor(dashboard.kpis.avgStress, true)}`}>
                {dashboard.kpis.avgStress !== null ? dashboard.kpis.avgStress.toFixed(1) : '--'}
              </div>
              <span className="text-small text-kore-mid">von 5.0 (niedrig = besser)</span>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Briefcase size={16} className="text-amber-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Workload</span>
              </div>
              <div className={`font-display text-h1 ${scoreColor(dashboard.kpis.avgWorkload)}`}>
                {dashboard.kpis.avgWorkload !== null ? dashboard.kpis.avgWorkload.toFixed(1) : '--'}
              </div>
              <span className="text-small text-kore-mid">von 5.0</span>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Stimmungs-Trend</h2>
            <TrendLineChart data={dashboard.trends ?? []} />
          </div>

          {/* Store Comparison */}
          {dashboard.storeComparison?.length > 1 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <Store size={18} /> Store-Vergleich
              </h2>
              <div className="space-y-sm">
                {dashboard.storeComparison.map((s: any, idx: number) => (
                  <div key={s.storeId} className="flex items-center gap-md">
                    <span className="w-6 text-small text-kore-mid text-right">{idx + 1}.</span>
                    <span className="flex-1 text-small text-kore-ink truncate">{s.storeName}</span>
                    <div className="flex items-center gap-md">
                      <div className="flex items-center gap-xs">
                        <span className="text-small text-kore-mid">Stimmung:</span>
                        <div className="w-20 bg-kore-bg h-3 relative">
                          <div
                            className={`h-full ${scoreBg(s.avgMood)}`}
                            style={{ width: `${(s.avgMood / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`w-8 text-small text-right font-medium ${scoreColor(s.avgMood)}`}>
                          {s.avgMood.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-xs">
                        <span className="text-small text-kore-mid">Stress:</span>
                        <div className="w-20 bg-kore-bg h-3 relative">
                          <div
                            className={`h-full ${scoreBg(s.avgStress, true)}`}
                            style={{ width: `${(s.avgStress / 5) * 100}%` }}
                          />
                        </div>
                        <span className={`w-8 text-small text-right font-medium ${scoreColor(s.avgStress, true)}`}>
                          {s.avgStress.toFixed(1)}
                        </span>
                      </div>
                      <span className="w-16 text-small text-right text-kore-mid">{s.checkIns} CI</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
