import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useRmTrends } from '../../../hooks/useRmDashboard';

/* ── Simple SVG Line Chart ──────────────────────── */
function TrendChart({ data, metric }: { data: { week: string; value: number }[]; metric: string }) {
  if (data.length < 2) return <div className="text-small text-kore-mid py-lg text-center">Nicht genug Datenpunkte</div>;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartWidth = Math.max(500, data.length * 60 + 80);
  const chartHeight = 180;

  const points = data.map((d, i) => ({
    x: 60 + (i / (data.length - 1)) * (chartWidth - 100),
    y: chartHeight - (d.value / maxVal) * (chartHeight - 20) + 10,
    ...d,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight + 50} className="block">
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
              {metric === 'revenue' || metric === 'avgTicket'
                ? `${Math.round(maxVal * pct).toLocaleString('de-DE')} EUR`
                : metric === 'conversionRate'
                ? `${(maxVal * pct).toFixed(1)}%`
                : Math.round(maxVal * pct).toLocaleString('de-DE')}
            </text>
          </g>
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke="#9E8460" strokeWidth={2} />
        {/* Dots + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#9E8460" />
            <text x={p.x} y={chartHeight + 28} textAnchor="middle" className="fill-kore-mid" fontSize={9}>
              KW {p.week}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

type MetricKey = 'revenue' | 'transactions' | 'footfall' | 'conversionRate' | 'avgTicket';
const METRIC_LABELS: Record<MetricKey, string> = {
  revenue: 'Umsatz',
  transactions: 'Transaktionen',
  footfall: 'Frequenz',
  conversionRate: 'Konversionsrate',
  avgTicket: 'Durchschn. Bon',
};

export function TrendsPage() {
  const [weeks, setWeeks] = useState(4);
  const [metric, setMetric] = useState<MetricKey>('revenue');
  const { data: trends, isLoading } = useRmTrends({ weeks });

  const chartData = (trends ?? []).map((t) => ({
    week: t.week,
    value: t[metric] as number,
  }));

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/rm-dashboard" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <TrendingUp size={24} /> Trends
          </h1>
          <p className="text-body text-kore-mid mt-xs">Woechentliche Entwicklung ueber alle Stores.</p>
        </div>
        <div className="flex gap-sm">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="border border-kore-border px-md py-sm text-body"
          >
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => (
              <option key={k} value={k}>{METRIC_LABELS[k]}</option>
            ))}
          </select>
          <select
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            className="border border-kore-border px-md py-sm text-body"
          >
            <option value={4}>4 Wochen</option>
            <option value={8}>8 Wochen</option>
            <option value={12}>12 Wochen</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Trends...</div>
      ) : !trends?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Trend-Daten vorhanden.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">{METRIC_LABELS[metric]} -- Woechentlich</h2>
            <TrendChart data={chartData} metric={metric} />
          </div>

          {/* Table */}
          <div className="bg-kore-white border border-kore-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="text-left px-md py-sm text-small text-kore-mid font-medium">Woche</th>
                  <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Umsatz</th>
                  <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Transaktionen</th>
                  <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Frequenz</th>
                  <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Konversion</th>
                  <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Bon</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((t) => (
                  <tr key={t.week} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50">
                    <td className="px-md py-sm text-body font-medium text-kore-ink">KW {t.week}</td>
                    <td className="px-md py-sm text-body text-kore-ink text-right">{t.revenue.toLocaleString('de-DE')} EUR</td>
                    <td className="px-md py-sm text-body text-kore-ink text-right">{t.transactions.toLocaleString('de-DE')}</td>
                    <td className="px-md py-sm text-body text-kore-ink text-right">{t.footfall.toLocaleString('de-DE')}</td>
                    <td className="px-md py-sm text-body text-kore-ink text-right">{t.conversionRate}%</td>
                    <td className="px-md py-sm text-body text-kore-ink text-right">{t.avgTicket.toLocaleString('de-DE')} EUR</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
