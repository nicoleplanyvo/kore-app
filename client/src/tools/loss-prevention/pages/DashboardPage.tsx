import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { useLossStores, useLossDashboard } from '../../../hooks/useLossPrevention';

/* ── Helpers ────────────────────────────────────────────────── */

function formatEUR(val: number) {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function getDefaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = now;
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

const PERIOD_PRESETS = [
  { label: 'Dieser Monat', key: 'this_month' },
  { label: 'Letzter Monat', key: 'last_month' },
  { label: 'Dieses Quartal', key: 'this_quarter' },
  { label: 'Dieses Jahr', key: 'this_year' },
  { label: 'Benutzerdefiniert', key: 'custom' },
];

function getPeriodDates(key: string): { from: string; to: string } {
  const now = new Date();
  switch (key) {
    case 'this_month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }
    case 'this_quarter': {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    case 'this_year': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from: from.toISOString().split('T')[0], to: now.toISOString().split('T')[0] };
    }
    default:
      return getDefaultPeriod();
  }
}

/* ── Bar Component ──────────────────────────────────────────── */

function HorizontalBar({
  label,
  value,
  max,
  color = 'bg-kore-ink',
  suffix = '',
}: {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-md">
      <span className="text-small text-kore-ink w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-kore-bg h-5 relative">
        <div
          className={`${color} h-full transition-all duration-500`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>
      <span className="text-small text-kore-mid w-12 text-right shrink-0">
        {value}{suffix}
      </span>
    </div>
  );
}

function VerticalBarChart({
  data,
  labelKey,
  valueKey,
  color = 'bg-kore-ink',
}: {
  data: any[];
  labelKey: string;
  valueKey: string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d[valueKey] || 0));
  return (
    <div className="flex items-end gap-xs h-40">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-xs">
            <span className="text-small text-kore-mid">{val || ''}</span>
            <div className="w-full bg-kore-bg relative" style={{ height: '100px' }}>
              <div
                className={`${color} absolute bottom-0 w-full transition-all duration-500`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className="text-small text-kore-mid">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Change Indicator ───────────────────────────────────────── */

function ChangeIndicator({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="flex items-center gap-xs text-small text-kore-mid">
        <Minus size={14} />
        0%
      </span>
    );
  }
  // For loss prevention, increase is bad (red), decrease is good (green)
  const isUp = value > 0;
  return (
    <span className={`flex items-center gap-xs text-small ${isUp ? 'text-red-600' : 'text-emerald-600'}`}>
      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {isUp ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

/* ── Component ──────────────────────────────────────────────── */

export function DashboardPage() {
  const { data: stores } = useLossStores();

  const [storeId, setStoreId] = useState('');
  const [periodKey, setPeriodKey] = useState('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const period = useMemo(() => {
    if (periodKey === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return getPeriodDates(periodKey);
  }, [periodKey, customFrom, customTo]);

  const { data: dashboard, isLoading } = useLossDashboard({
    storeId: storeId || undefined,
    from: period.from,
    to: period.to,
  });

  const selectClass = 'border border-kore-border px-md py-sm text-small bg-kore-white focus:outline-none focus:border-kore-brass';

  const catMax = Math.max(1, ...(dashboard?.byCategory ?? []).map((c: any) => c.count));

  const CATEGORY_COLORS: Record<string, string> = {
    THEFT: 'bg-red-500',
    ADMIN_ERROR: 'bg-violet-500',
    DAMAGE: 'bg-orange-500',
    SUPPLIER: 'bg-sky-500',
    OTHER: 'bg-kore-mid',
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/loss-prevention"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Analyse-Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">
            Schwund-Analyse, Hotspots und Trends
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-md mb-xl">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className={selectClass}
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={periodKey}
          onChange={(e) => setPeriodKey(e.target.value)}
          className={selectClass}
        >
          {PERIOD_PRESETS.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>

        {periodKey === 'custom' && (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className={selectClass}
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className={selectClass}
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid py-xl">Lade Dashboard...</div>
      ) : !dashboard ? (
        <div className="text-body text-kore-mid py-xl">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-2xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Vorfaelle gesamt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.totalIncidents}</div>
              <div className="mt-xs">
                <ChangeIndicator value={dashboard.prevPeriod?.incidentChange ?? 0} />
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtschaden</span>
              <div className="font-display text-h2 text-red-600 mt-sm">{formatEUR(dashboard.totalAmount)}</div>
              <div className="mt-xs">
                <ChangeIndicator value={dashboard.prevPeriod?.amountChange ?? 0} />
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Schwundquote</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">
                {dashboard.shrinkageRate != null ? `${dashboard.shrinkageRate.toFixed(2)}%` : '--'}
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">vs. Vorperiode</span>
              <div className="mt-sm">
                <div className="flex items-center gap-sm">
                  {(dashboard.prevPeriod?.incidentChange ?? 0) > 0 ? (
                    <TrendingUp size={20} className="text-red-600" />
                  ) : (dashboard.prevPeriod?.incidentChange ?? 0) < 0 ? (
                    <TrendingDown size={20} className="text-emerald-600" />
                  ) : (
                    <Minus size={20} className="text-kore-mid" />
                  )}
                  <span className="text-body text-kore-ink">
                    {dashboard.prevPeriod?.totalIncidents ?? 0} Vorfaelle
                  </span>
                </div>
                <span className="text-small text-kore-mid mt-xs block">
                  {formatEUR(dashboard.prevPeriod?.totalAmount ?? 0)} Schaden
                </span>
              </div>
            </div>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-2xl">
            {/* Category Breakdown */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-lg">
                <BarChart3 size={16} className="text-kore-mid" />
                <h2 className="font-display text-h3 text-kore-ink">Nach Kategorie</h2>
              </div>
              {(dashboard.byCategory ?? []).length > 0 ? (
                <div className="space-y-md">
                  {(dashboard.byCategory as any[]).map((c: any) => (
                    <div key={c.category}>
                      <HorizontalBar
                        label={c.label || c.category}
                        value={c.count}
                        max={catMax}
                        color={CATEGORY_COLORS[c.category] || 'bg-kore-ink'}
                      />
                      <span className="text-small text-kore-mid ml-32 pl-md">
                        {formatEUR(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten</p>
              )}
            </div>

            {/* Hotspot Ranking */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-lg">
                <MapPin size={16} className="text-kore-mid" />
                <h2 className="font-display text-h3 text-kore-ink">Hotspot-Bereiche</h2>
              </div>
              {(dashboard.topAreas ?? []).length > 0 ? (
                <div className="space-y-md">
                  {(dashboard.topAreas as any[]).map((a: any, idx: number) => {
                    const areaMax = Math.max(1, ...(dashboard.topAreas as any[]).map((x: any) => x.count));
                    return (
                      <HorizontalBar
                        key={a.area}
                        label={`${idx + 1}. ${a.area}`}
                        value={a.count}
                        max={areaMax}
                        color={idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-500' : 'bg-kore-ink'}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Bereichsdaten</p>
              )}
            </div>
          </div>

          {/* Weekday + Hour Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-2xl">
            {/* Weekday Distribution */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-lg">
                <Calendar size={16} className="text-kore-mid" />
                <h2 className="font-display text-h3 text-kore-ink">Wochentag-Verteilung</h2>
              </div>
              {(dashboard.byWeekday ?? []).length > 0 ? (
                <VerticalBarChart
                  data={dashboard.byWeekday}
                  labelKey="day"
                  valueKey="count"
                  color="bg-kore-brass"
                />
              ) : (
                <p className="text-small text-kore-mid">Keine Daten</p>
              )}
            </div>

            {/* Hour Distribution */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-lg">
                <Clock size={16} className="text-kore-mid" />
                <h2 className="font-display text-h3 text-kore-ink">Tageszeit-Verteilung</h2>
              </div>
              {(dashboard.byHour ?? []).length > 0 ? (
                <VerticalBarChart
                  data={(dashboard.byHour as any[]).map((h: any) => ({
                    label: `${h.hour}`,
                    count: h.count,
                  }))}
                  labelKey="label"
                  valueKey="count"
                  color="bg-kore-ink"
                />
              ) : (
                <p className="text-small text-kore-mid">Keine Daten</p>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          {(dashboard.monthlyTrend ?? []).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
              <div className="flex items-center gap-sm mb-lg">
                <TrendingUp size={16} className="text-kore-mid" />
                <h2 className="font-display text-h3 text-kore-ink">Monatlicher Trend (Schaden)</h2>
              </div>
              <div className="space-y-md">
                {(dashboard.monthlyTrend as any[]).map((m: any) => {
                  const trendMax = Math.max(1, ...(dashboard.monthlyTrend as any[]).map((x: any) => x.amount));
                  return (
                    <HorizontalBar
                      key={m.month}
                      label={m.month}
                      value={m.amount}
                      max={trendMax}
                      color="bg-red-400"
                      suffix={` ${formatEUR(m.amount)}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Severity Breakdown */}
          {(dashboard.bySeverity ?? []).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Nach Schweregrad</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => {
                  const entry = (dashboard.bySeverity as any[]).find((s: any) => s.severity === sev);
                  const count = entry?.count ?? 0;
                  const styles: Record<string, string> = {
                    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
                    HIGH: 'bg-red-50 text-red-700 border-red-200',
                    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
                  };
                  const labels: Record<string, string> = {
                    LOW: 'Niedrig',
                    MEDIUM: 'Mittel',
                    HIGH: 'Hoch',
                    CRITICAL: 'Kritisch',
                  };
                  return (
                    <div key={sev} className={`border px-lg py-md text-center ${styles[sev]}`}>
                      <div className="text-caption uppercase tracking-widest">{labels[sev]}</div>
                      <div className="font-display text-h2 mt-xs">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
