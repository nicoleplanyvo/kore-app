import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useMultiStoreRanking } from '../../../hooks/useMultiStore';

const METRIC_LABELS: Record<string, string> = {
  revenue: 'Revenue',
  transactions: 'Transaktionen',
  footfall: 'Footfall',
  unitsSold: 'Units Sold',
};

export function RankingPage() {
  const [metric, setMetric] = useState('revenue');
  const { data: ranking, isLoading } = useMultiStoreRanking({ metric });

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/multi-store" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Trophy size={24} /> Store-Ranking</h1>
          <p className="text-body text-kore-mid mt-xs">Letzte 30 Tage — sortiert nach {METRIC_LABELS[metric] ?? metric}.</p>
        </div>
        <select value={metric} onChange={e => setMetric(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="revenue">Revenue</option>
          <option value="transactions">Transaktionen</option>
          <option value="footfall">Footfall</option>
          <option value="unitsSold">Units Sold</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Ranking...</div>
      ) : !ranking?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Ranking-Daten vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {ranking.map((r: any) => (
            <div key={r.storeId} className="bg-kore-white border border-kore-border p-md flex items-center gap-lg">
              <div className={`w-10 h-10 flex items-center justify-center font-display text-h3 ${r.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-kore-bg text-kore-mid'}`}>
                {r.rank}
              </div>
              <div className="flex-1">
                <span className="font-medium text-kore-ink">{r.storeName}</span>
                {r.city && <span className="text-small text-kore-mid ml-sm">{r.city}</span>}
              </div>
              <div className="text-right">
                <span className="font-display text-h3 text-kore-ink">
                  {metric === 'revenue' ? `${r.value?.toLocaleString('de-DE')} €` : r.value?.toLocaleString('de-DE')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
