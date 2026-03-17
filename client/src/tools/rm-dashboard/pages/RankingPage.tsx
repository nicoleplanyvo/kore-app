import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useRmRanking } from '../../../hooks/useRmDashboard';

type PeriodPreset = 'week' | 'month' | 'quarter' | 'year';
const PERIOD_LABELS: Record<PeriodPreset, string> = {
  week: '7 Tage',
  month: '30 Tage',
  quarter: '90 Tage',
  year: '1 Jahr',
};

type KpiKey = 'revenue' | 'transactions' | 'footfall' | 'conversionRate' | 'avgTicket' | 'unitsSold';
const KPI_LABELS: Record<KpiKey, string> = {
  revenue: 'Umsatz',
  transactions: 'Transaktionen',
  footfall: 'Frequenz',
  conversionRate: 'Konversionsrate',
  avgTicket: 'Durchschn. Bon',
  unitsSold: 'Stueck verkauft',
};

function statusDot(status: 'green' | 'yellow' | 'red') {
  const colors = { green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-red-500' };
  return <span className={`inline-block w-3 h-3 rounded-full ${colors[status]}`} />;
}

function statusBg(status: 'green' | 'yellow' | 'red') {
  return status === 'green' ? 'bg-emerald-50' : status === 'yellow' ? 'bg-amber-50' : 'bg-red-50';
}

function formatKpiValue(value: number, kpi: KpiKey): string {
  if (kpi === 'revenue' || kpi === 'avgTicket') return `${value.toLocaleString('de-DE')} EUR`;
  if (kpi === 'conversionRate') return `${value}%`;
  return value.toLocaleString('de-DE');
}

/* ── Horizontal bar chart (SVG) ──────────────── */
function HorizontalBarChart({ data, kpi }: { data: { name: string; value: number; status: 'green' | 'yellow' | 'red' }[]; kpi: KpiKey }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 28;
  const gap = 4;
  const chartHeight = data.length * (barHeight + gap) + 20;
  const chartWidth = 600;
  const labelWidth = 140;
  const barMaxWidth = chartWidth - labelWidth - 100;

  return (
    <div className="overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="block">
        {data.map((d, i) => {
          const y = i * (barHeight + gap) + 10;
          const barW = maxVal > 0 ? (d.value / maxVal) * barMaxWidth : 0;
          const fill = d.status === 'green' ? '#10b981' : d.status === 'yellow' ? '#f59e0b' : '#ef4444';
          return (
            <g key={i}>
              <text x={labelWidth - 8} y={y + barHeight / 2 + 4} textAnchor="end" className="fill-kore-ink" fontSize={11}>
                {d.name.length > 18 ? d.name.slice(0, 18) + '..' : d.name}
              </text>
              <rect x={labelWidth} y={y} width={barW} height={barHeight} fill={fill} rx={2} />
              <text x={labelWidth + barW + 6} y={y + barHeight / 2 + 4} className="fill-kore-ink" fontSize={11}>
                {formatKpiValue(d.value, kpi)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RankingPage() {
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [kpi, setKpi] = useState<KpiKey>('revenue');

  const params = useMemo(() => ({ period: preset, kpi }), [preset, kpi]);
  const { data: ranking, isLoading } = useRmRanking(params);

  const chartData = (ranking ?? []).map((r) => ({
    name: r.storeName,
    value: r.sortValue,
    status: r.status,
  }));

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/rm-dashboard" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Trophy size={24} /> Store-Ranking
          </h1>
          <p className="text-body text-kore-mid mt-xs">Vergleich aller Stores nach waehlbarem KPI mit Ampel-System.</p>
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
        <div>
          <label className="block text-small text-kore-mid mb-xs">KPI</label>
          <select
            value={kpi}
            onChange={(e) => setKpi(e.target.value as KpiKey)}
            className="border border-kore-border px-md py-sm text-small"
          >
            {(Object.keys(KPI_LABELS) as KpiKey[]).map((k) => (
              <option key={k} value={k}>{KPI_LABELS[k]}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Ranking...</div>
      ) : !ranking?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Ranking-Daten vorhanden.
        </div>
      ) : (
        <>
          {/* Bar Chart */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">{KPI_LABELS[kpi]} -- Ranking</h2>
            <HorizontalBarChart data={chartData} kpi={kpi} />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-lg mb-md text-small text-kore-mid">
            <span className="flex items-center gap-xs">{statusDot('green')} Top-Drittel</span>
            <span className="flex items-center gap-xs">{statusDot('yellow')} Mitte</span>
            <span className="flex items-center gap-xs">{statusDot('red')} Unteres Drittel</span>
          </div>

          {/* Table */}
          <div className="bg-kore-white border border-kore-border overflow-hidden">
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
                  <th className="text-right px-md py-sm text-kore-mid font-medium">Stueck</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr
                    key={r.storeId}
                    className={`border-b border-kore-border last:border-0 hover:bg-kore-bg/50 transition-colors ${statusBg(r.status)}`}
                  >
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
                    <td className="text-right px-md py-sm text-kore-ink">{r.unitsSold.toLocaleString('de-DE')}</td>
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
