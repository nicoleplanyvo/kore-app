import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro,
  Download,
} from 'lucide-react';
import {
  useMaintenanceStores,
  useMaintenanceDashboard,
  useMaintenanceExport,
} from '../../../hooks/useMaintenance';

/* ── Period presets ─────────────────────────────── */

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

/* ── Category / Priority labels ──────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICAL: 'Elektrik',
  PLUMBING: 'Sanitaer',
  HVAC: 'Heizung/Klima',
  FIXTURE: 'Einrichtung',
  IT: 'IT',
  OTHER: 'Sonstiges',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Arbeit',
  RESOLVED: 'Geloest',
  CLOSED: 'Geschlossen',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#a3a3a3',
  MEDIUM: '#d97706',
  HIGH: '#ea580c',
  URGENT: '#dc2626',
};

const CATEGORY_COLORS: Record<string, string> = {
  ELECTRICAL: '#3b82f6',
  PLUMBING: '#06b6d4',
  HVAC: '#f59e0b',
  FIXTURE: '#8b5cf6',
  IT: '#10b981',
  OTHER: '#9E8460',
};

/* ── Simple bar chart ────────────────────────── */

function TrendChart({ data }: { data: { date: string; created: number; resolved: number }[] }) {
  if (!data.length) return <div className="text-small text-kore-mid py-lg text-center">Keine Daten vorhanden</div>;

  const maxVal = Math.max(...data.flatMap((d) => [d.created, d.resolved]), 1);
  const barWidth = Math.max(8, Math.min(28, Math.floor(600 / data.length / 2.5)));
  const chartWidth = data.length * (barWidth * 2 + 12) + 60;
  const chartHeight = 180;

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
              <rect x={x} y={chartHeight - cH + 10} width={barWidth} height={cH} fill="#dc2626" rx={1} />
              <rect x={x + barWidth + 2} y={chartHeight - rH + 10} width={barWidth} height={rH} fill="#10b981" rx={1} />
              <text
                x={x + barWidth}
                y={chartHeight + 28}
                textAnchor="middle"
                className="fill-kore-mid"
                fontSize={8}
                transform={`rotate(-30, ${x + barWidth}, ${chartHeight + 28})`}
              >
                {d.date.slice(5)}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <rect x={50} y={chartHeight + 44} width={10} height={10} fill="#dc2626" rx={1} />
        <text x={64} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Erstellt</text>
        <rect x={120} y={chartHeight + 44} width={10} height={10} fill="#10b981" rx={1} />
        <text x={134} y={chartHeight + 53} fontSize={10} className="fill-kore-ink">Geloest</text>
      </svg>
    </div>
  );
}

/* ── Horizontal bar helper ───────────────────── */

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-md">
      <span className="w-28 text-small text-kore-ink truncate">{label}</span>
      <div className="flex-1 bg-kore-bg h-4 relative">
        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 text-small text-right font-medium text-kore-ink">{value}</span>
    </div>
  );
}

/* ── Dashboard Page ──────────────────────────── */

export function DashboardPage() {
  const { data: stores } = useMaintenanceStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const { exportCsv } = useMaintenanceExport();

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

  const { data: dashboard, isLoading } = useMaintenanceDashboard(filters);

  // CSV Export
  const handleExport = useCallback(async () => {
    try {
      const data = await exportCsv(filters);
      if (!data?.length) return;

      const headers = ['Titel', 'Beschreibung', 'Store', 'Kategorie', 'Prioritaet', 'Status', 'Gemeldet von', 'Zugewiesen an', 'Geschaetzte Kosten', 'Tatsaechliche Kosten', 'Erstellt am', 'Geloest am'];
      const rows = data.map((r: any) => [
        (r.title ?? '').replace(/"/g, '""'),
        (r.description ?? '').replace(/"/g, '""'),
        r.store?.name ?? '',
        CATEGORY_LABELS[r.category] ?? r.category,
        PRIORITY_LABELS[r.priority] ?? r.priority,
        STATUS_LABELS[r.status] ?? r.status,
        r.reporter?.name ?? '',
        r.assignee?.name ?? '',
        r.estimatedCost ?? '',
        r.actualCost ?? '',
        r.createdAt ? new Date(r.createdAt).toLocaleDateString('de-DE') : '',
        r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString('de-DE') : '',
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map((r: any[]) => r.map((c: any) => `"${c}"`).join(';')),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `maintenance-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  }, [filters, exportCsv]);

  const kpis = dashboard?.kpis;
  const maxCategory = Math.max(...Object.values(dashboard?.byCategory ?? { x: 1 }), 1);
  const maxPriority = Math.max(...Object.values(dashboard?.byPriority ?? { x: 1 }), 1);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/maintenance" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Maintenance Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            KPIs, Kategorien, Kosten und Trends im Ueberblick.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
        >
          <Download size={16} /> CSV Export
        </button>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Wrench size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{kpis?.total ?? 0}</div>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <AlertTriangle size={16} className="text-amber-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Offen</span>
              </div>
              <div className="font-display text-h1 text-amber-600">{kpis?.open ?? 0}</div>
              {(kpis?.overdueCount ?? 0) > 0 && (
                <span className="text-small text-red-600">{kpis?.overdueCount} ueberfaellig</span>
              )}
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <CheckCircle size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Erledigt</span>
              </div>
              <div className="font-display text-h1 text-emerald-600">{kpis?.resolved ?? 0}</div>
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Clock size={16} className="text-blue-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Durchschn. Loesung</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">
                {(kpis?.avgResolutionHours ?? 0) < 24
                  ? `${kpis?.avgResolutionHours ?? 0}h`
                  : `${Math.round((kpis?.avgResolutionHours ?? 0) / 24)}d`
                }
              </div>
            </div>
          </div>

          {/* Cost overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Euro size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Geschaetzte Kosten</span>
              </div>
              <div className="font-display text-h2 text-kore-ink">
                {(kpis?.totalEstimatedCost ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-sm">
                <Euro size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Tatsaechliche Kosten</span>
              </div>
              <div className="font-display text-h2 text-kore-ink">
                {(kpis?.totalActualCost ?? 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR
              </div>
            </div>
          </div>

          {/* Trend chart */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Meldungen Trend</h2>
            <TrendChart data={dashboard?.trends ?? []} />
          </div>

          {/* Two columns: Category + Priority breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Nach Kategorie</h2>
              {dashboard?.byCategory && Object.keys(dashboard.byCategory).length > 0 ? (
                <div className="space-y-sm">
                  {Object.entries(dashboard.byCategory)
                    .sort(([, a], [, b]) => b - a)
                    .map(([cat, count]) => (
                      <HorizontalBar
                        key={cat}
                        label={CATEGORY_LABELS[cat] ?? cat}
                        value={count}
                        max={maxCategory}
                        color={CATEGORY_COLORS[cat] ?? '#9E8460'}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
              )}
            </div>

            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Nach Prioritaet</h2>
              {dashboard?.byPriority && Object.keys(dashboard.byPriority).length > 0 ? (
                <div className="space-y-sm">
                  {['URGENT', 'HIGH', 'MEDIUM', 'LOW']
                    .filter((p) => (dashboard.byPriority[p] ?? 0) > 0)
                    .map((p) => (
                      <HorizontalBar
                        key={p}
                        label={PRIORITY_LABELS[p] ?? p}
                        value={dashboard.byPriority[p] ?? 0}
                        max={maxPriority}
                        color={PRIORITY_COLORS[p] ?? '#9E8460'}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
              )}
            </div>
          </div>

          {/* Store comparison */}
          {dashboard?.byStore && dashboard.byStore.length > 1 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Store-Vergleich</h2>
              <div className="space-y-sm">
                {dashboard.byStore
                  .sort((a, b) => b.count - a.count)
                  .map((s) => {
                    const maxCount = Math.max(...dashboard.byStore.map((x) => x.count), 1);
                    return (
                      <div key={s.storeId} className="flex items-center gap-md">
                        <span className="w-32 text-small text-kore-ink truncate">{s.name}</span>
                        <div className="flex-1 bg-kore-bg h-4 relative">
                          <div
                            className="h-full bg-kore-brass"
                            style={{ width: `${(s.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-small text-right font-medium text-kore-ink">{s.count}</span>
                        <span className="w-20 text-small text-kore-mid text-right">
                          {s.open} offen
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Urgent open requests */}
          {dashboard?.urgentOpen && dashboard.urgentOpen.length > 0 && (
            <div className="bg-kore-white border border-red-200 p-xl">
              <h2 className="font-display text-h3 text-red-700 mb-lg flex items-center gap-sm">
                <AlertTriangle size={18} /> Dringende offene Meldungen
              </h2>
              <div className="space-y-sm">
                {dashboard.urgentOpen.map((r) => (
                  <Link
                    key={r.id}
                    to={`/tools/maintenance/requests/${r.id}`}
                    className="flex items-center justify-between p-md border border-kore-border hover:border-red-300 transition-colors"
                  >
                    <div>
                      <span className="text-body font-medium text-kore-ink">{r.title}</span>
                      <div className="flex items-center gap-md mt-xs">
                        <span className="text-small text-kore-mid">{r.store?.name}</span>
                        <span className={`text-small ${r.priority === 'URGENT' ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                          {PRIORITY_LABELS[r.priority] ?? r.priority}
                        </span>
                        <span className="text-small text-kore-faint">
                          {new Date(r.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    <span className="text-small text-amber-700 bg-amber-50 border border-amber-200 px-md py-xs">
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
