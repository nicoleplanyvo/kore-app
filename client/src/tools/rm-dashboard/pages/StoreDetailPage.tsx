import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  TrendingUp,
  ShoppingCart,
  Users,
  Wrench,
  Package,
  ShieldAlert,
  GraduationCap,
  Target,
  MapPin,
} from 'lucide-react';
import { useRmStoreDetail } from '../../../hooks/useRmDashboard';

type PeriodPreset = 'week' | 'month' | 'quarter' | 'year';
const PERIOD_LABELS: Record<PeriodPreset, string> = {
  week: '7 Tage',
  month: '30 Tage',
  quarter: '90 Tage',
  year: '1 Jahr',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-kore-bg text-kore-mid',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

/* ── Mini revenue line chart ───────────────── */
function DailyChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length < 2) return <div className="text-small text-kore-mid py-lg text-center">Nicht genug Datenpunkte</div>;

  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const chartWidth = Math.max(400, data.length * 24 + 80);
  const chartHeight = 160;

  const points = data.map((d, i) => ({
    x: 60 + (i / (data.length - 1)) * (chartWidth - 100),
    y: chartHeight - (d.revenue / maxVal) * (chartHeight - 20) + 10,
    ...d,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');

  // Area fill
  const areaD = pathD + ` L${points[points.length - 1]!.x},${chartHeight + 10} L${points[0]!.x},${chartHeight + 10} Z`;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 40} className="block">
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <g key={pct}>
            <line
              x1={50}
              y1={chartHeight - pct * (chartHeight - 20) + 10}
              x2={chartWidth - 20}
              y2={chartHeight - pct * (chartHeight - 20) + 10}
              stroke="#e5e5e5"
              strokeDasharray="2,2"
            />
            <text
              x={46}
              y={chartHeight - pct * (chartHeight - 20) + 14}
              textAnchor="end"
              className="fill-kore-mid"
              fontSize={9}
            >
              {Math.round(maxVal * pct).toLocaleString('de-DE')}
            </text>
          </g>
        ))}
        {/* Area */}
        <path d={areaD} fill="#9E8460" opacity={0.1} />
        {/* Line */}
        <path d={pathD} fill="none" stroke="#9E8460" strokeWidth={2} />
        {/* Dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#9E8460" />
        ))}
        {/* X labels — show every nth */}
        {points
          .filter((_, i) => i % Math.ceil(points.length / 8) === 0 || i === points.length - 1)
          .map((p, i) => (
            <text key={i} x={p.x} y={chartHeight + 26} textAnchor="middle" className="fill-kore-mid" fontSize={8}>
              {p.date.slice(5)}
            </text>
          ))}
      </svg>
    </div>
  );
}

export function StoreDetailPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [preset, setPreset] = useState<PeriodPreset>('month');

  const params = useMemo(() => ({ period: preset }), [preset]);
  const { data: detail, isLoading } = useRmStoreDetail(storeId, params);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/rm-dashboard" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Store size={24} /> {detail?.store?.name ?? 'Store'}
          </h1>
          <p className="text-body text-kore-mid mt-xs flex items-center gap-sm">
            {detail?.store?.city && (
              <span className="flex items-center gap-xs"><MapPin size={12} /> {detail.store.city}</span>
            )}
            {detail?.store?.region && (
              <span>/ Region: {detail.store.region.name}</span>
            )}
            {detail?.store?.address && (
              <span>/ {detail.store.address}</span>
            )}
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-xs mb-xl">
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

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Store-Daten...</div>
      ) : !detail ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Store-Daten nicht verfuegbar.
        </div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <TrendingUp size={16} className="text-kore-brass" />
                <span className="text-small text-kore-mid uppercase tracking-widest">Umsatz</span>
              </div>
              <div className="font-display text-h2 text-kore-ink">
                {detail.kpi.totalRevenue.toLocaleString('de-DE')} EUR
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <ShoppingCart size={16} className="text-blue-500" />
                <span className="text-small text-kore-mid uppercase tracking-widest">Transaktionen</span>
              </div>
              <div className="font-display text-h2 text-kore-ink">{detail.kpi.totalTransactions.toLocaleString('de-DE')}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <Users size={16} className="text-purple-500" />
                <span className="text-small text-kore-mid uppercase tracking-widest">Frequenz</span>
              </div>
              <div className="font-display text-h2 text-kore-ink">{detail.kpi.totalFootfall.toLocaleString('de-DE')}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Konversionsrate</span>
              <div className="font-display text-h2 text-kore-ink">{detail.kpi.conversionRate}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Durchschn. Bon</span>
              <div className="font-display text-h2 text-kore-ink">{detail.kpi.avgTicket.toLocaleString('de-DE')} EUR</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Stueck verkauft</span>
              <div className="font-display text-h2 text-kore-ink">{detail.kpi.totalUnitsSold.toLocaleString('de-DE')}</div>
            </div>
          </div>

          {/* Revenue Trend Chart */}
          {detail.dailyTrend.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Umsatz-Verlauf</h2>
              <DailyChart data={detail.dailyTrend} />
            </div>
          )}

          {/* Operational Status & Tool Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-xl">
            {/* Left: Status Overview */}
            <div>
              <h2 className="font-display text-h3 text-kore-ink mb-md">Betrieblicher Status</h2>
              <div className="space-y-sm">
                <div className="bg-kore-white border border-kore-border p-md flex items-center gap-md">
                  <GraduationCap size={18} className="text-emerald-500" />
                  <span className="flex-1 text-body text-kore-ink">Training-Quote</span>
                  <span className="font-display text-h3 text-kore-ink">{detail.operational.trainingRate}%</span>
                </div>
                {detail.operational.forecastAccuracy !== null && (
                  <div className="bg-kore-white border border-kore-border p-md flex items-center gap-md">
                    <Target size={18} className="text-kore-brass" />
                    <span className="flex-1 text-body text-kore-ink">Forecast-Genauigkeit</span>
                    <span className="font-display text-h3 text-kore-ink">{detail.operational.forecastAccuracy}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Links to Tools */}
            <div>
              <h2 className="font-display text-h3 text-kore-ink mb-md">Direkt-Links</h2>
              <div className="grid grid-cols-2 gap-sm">
                <Link
                  to="/tools/kpi"
                  className="bg-kore-white border border-kore-border p-md text-small text-kore-ink hover:bg-kore-bg transition-colors flex items-center gap-sm"
                >
                  <TrendingUp size={14} /> KPI Dashboard
                </Link>
                <Link
                  to="/tools/forecast"
                  className="bg-kore-white border border-kore-border p-md text-small text-kore-ink hover:bg-kore-bg transition-colors flex items-center gap-sm"
                >
                  <Target size={14} /> Forecast
                </Link>
                <Link
                  to="/tools/loss-prevention"
                  className="bg-kore-white border border-kore-border p-md text-small text-kore-ink hover:bg-kore-bg transition-colors flex items-center gap-sm"
                >
                  <ShieldAlert size={14} /> Loss Prevention
                </Link>
                <Link
                  to="/tools/maintenance"
                  className="bg-kore-white border border-kore-border p-md text-small text-kore-ink hover:bg-kore-bg transition-colors flex items-center gap-sm"
                >
                  <Wrench size={14} /> Wartung
                </Link>
              </div>
            </div>
          </div>

          {/* Open Issues */}
          {(detail.operational.openMaintenance.length > 0 ||
            detail.operational.openStock.length > 0 ||
            detail.operational.lossIncidents.length > 0) && (
            <div className="mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Offene Themen</h2>

              {/* Maintenance */}
              {detail.operational.openMaintenance.length > 0 && (
                <div className="mb-md">
                  <h3 className="text-body font-medium text-kore-ink mb-sm flex items-center gap-xs">
                    <Wrench size={14} className="text-amber-500" /> Wartung ({detail.operational.openMaintenance.length})
                  </h3>
                  <div className="space-y-xs">
                    {detail.operational.openMaintenance.map((m: any) => (
                      <div key={m.id} className="bg-kore-white border border-kore-border p-sm px-md flex items-center gap-md text-small">
                        <span className={`px-sm py-xs ${PRIORITY_COLORS[m.priority] ?? 'bg-kore-bg text-kore-mid'}`}>{m.priority}</span>
                        <span className="flex-1 text-kore-ink">{m.title}</span>
                        <span className="text-kore-mid">{m.status}</span>
                        <span className="text-kore-faint">{new Date(m.createdAt).toLocaleDateString('de-DE')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              {detail.operational.openStock.length > 0 && (
                <div className="mb-md">
                  <h3 className="text-body font-medium text-kore-ink mb-sm flex items-center gap-xs">
                    <Package size={14} className="text-blue-500" /> Stock Callouts ({detail.operational.openStock.length})
                  </h3>
                  <div className="space-y-xs">
                    {detail.operational.openStock.map((s: any) => (
                      <div key={s.id} className="bg-kore-white border border-kore-border p-sm px-md flex items-center gap-md text-small">
                        <span className={`px-sm py-xs ${PRIORITY_COLORS[s.urgency] ?? 'bg-kore-bg text-kore-mid'}`}>{s.urgency}</span>
                        <span className="flex-1 text-kore-ink">{s.productName} (SKU: {s.sku})</span>
                        <span className="text-kore-faint">{new Date(s.createdAt).toLocaleDateString('de-DE')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loss */}
              {detail.operational.lossIncidents.length > 0 && (
                <div className="mb-md">
                  <h3 className="text-body font-medium text-kore-ink mb-sm flex items-center gap-xs">
                    <ShieldAlert size={14} className="text-red-500" /> Verlust-Vorfaelle ({detail.operational.lossIncidents.length})
                  </h3>
                  <div className="space-y-xs">
                    {detail.operational.lossIncidents.map((l: any) => (
                      <div key={l.id} className="bg-kore-white border border-kore-border p-sm px-md flex items-center gap-md text-small">
                        <span className={`px-sm py-xs ${PRIORITY_COLORS[l.severity] ?? 'bg-kore-bg text-kore-mid'}`}>{l.severity}</span>
                        <span className="flex-1 text-kore-ink">{l.category}: {l.amount.toFixed(2)} EUR</span>
                        <span className="text-kore-mid">{l.status}</span>
                        <span className="text-kore-faint">{l.incidentDate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
