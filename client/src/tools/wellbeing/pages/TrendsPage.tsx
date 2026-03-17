import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useWellbeingStores, useWellbeingTrends } from '../../../hooks/useWellbeing';

const METRIC_LABELS: Record<string, string> = {
  avgMood: 'Stimmung',
  avgEnergy: 'Energie',
  avgStress: 'Stress',
  avgWorkload: 'Workload',
};
const METRIC_COLORS: Record<string, string> = {
  avgMood: 'bg-kore-brass',
  avgEnergy: 'bg-emerald-500',
  avgStress: 'bg-red-500',
  avgWorkload: 'bg-amber-500',
};

export function TrendsPage() {
  const { data: stores } = useWellbeingStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [weeks, setWeeks] = useState(8);

  const { data: trends, isLoading } = useWellbeingTrends({
    storeId: selectedStore || undefined,
    weeks,
  });

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/wellbeing" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <TrendingUp size={24} /> Wellbeing-Trends
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Entwicklung der Teamstimmung ueber die letzten Wochen.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-md mb-xl">
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
        <div>
          <label className="block text-small text-kore-mid mb-xs">Zeitraum</label>
          <div className="flex gap-xs">
            {[4, 8, 12, 26].map((w) => (
              <button
                key={w}
                onClick={() => setWeeks(w)}
                className={`px-md py-xs text-small border transition-colors ${
                  weeks === w
                    ? 'bg-kore-ink text-kore-white border-kore-ink'
                    : 'border-kore-border text-kore-mid hover:text-kore-ink'
                }`}
              >
                {w} Wochen
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Trends...</div>
      ) : !trends?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Noch nicht genuegend Daten fuer Trends.
        </div>
      ) : (
        <div className="space-y-xl">
          {/* Bar charts for each metric */}
          {(['avgMood', 'avgEnergy', 'avgStress', 'avgWorkload'] as const).map((metric) => (
            <div key={metric} className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md">{METRIC_LABELS[metric]}</h2>
              <div className="flex items-end gap-sm h-32">
                {trends.map((w: any, i: number) => {
                  const val = w[metric] ? Number(w[metric]) : 0;
                  const pct = val > 0 ? (val / 5) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-xs">
                      <span className="text-small font-medium text-kore-ink">{val > 0 ? val.toFixed(1) : '--'}</span>
                      <div className="w-full bg-kore-bg rounded-t" style={{ height: `${pct}%`, minHeight: val > 0 ? '4px' : '0' }}>
                        <div className={`w-full h-full rounded-t ${METRIC_COLORS[metric]}`} />
                      </div>
                      <span className="text-small text-kore-mid">{w.weekLabel ?? `W${i + 1}`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Data table */}
          <div className="bg-kore-white border border-kore-border p-lg overflow-x-auto">
            <h2 className="font-display text-h3 text-kore-ink mb-md">Daten</h2>
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="text-left py-sm text-kore-mid font-medium uppercase tracking-widest">Woche</th>
                  <th className="text-right py-sm text-kore-mid font-medium uppercase tracking-widest">Stimmung</th>
                  <th className="text-right py-sm text-kore-mid font-medium uppercase tracking-widest">Energie</th>
                  <th className="text-right py-sm text-kore-mid font-medium uppercase tracking-widest">Stress</th>
                  <th className="text-right py-sm text-kore-mid font-medium uppercase tracking-widest">Workload</th>
                  <th className="text-right py-sm text-kore-mid font-medium uppercase tracking-widest">Check-Ins</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((w: any, i: number) => (
                  <tr key={i} className="border-b border-kore-border last:border-b-0">
                    <td className="py-sm text-kore-ink">{w.weekLabel ?? `Woche ${i + 1}`}</td>
                    <td className="py-sm text-right text-kore-ink">{w.avgMood ? Number(w.avgMood).toFixed(1) : '--'}</td>
                    <td className="py-sm text-right text-kore-ink">{w.avgEnergy ? Number(w.avgEnergy).toFixed(1) : '--'}</td>
                    <td className="py-sm text-right text-kore-ink">{w.avgStress ? Number(w.avgStress).toFixed(1) : '--'}</td>
                    <td className="py-sm text-right text-kore-ink">{w.avgWorkload ? Number(w.avgWorkload).toFixed(1) : '--'}</td>
                    <td className="py-sm text-right text-kore-mid">{w.checkInCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
