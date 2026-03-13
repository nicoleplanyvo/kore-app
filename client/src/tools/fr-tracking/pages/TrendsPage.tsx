import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFrStores, useFrTrends } from '../../../hooks/useFrTracking';

export function TrendsPage() {
  const [storeId, setStoreId] = useState('');
  const [days, setDays] = useState(30);
  const { data: stores } = useFrStores();
  const { data: trends, isLoading } = useFrTrends(storeId || undefined, days);

  const maxFootfall = Math.max(1, ...(trends ?? []).map((t: any) => t.footfall));

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/fr-tracking" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Trends</h1>
          <p className="text-body text-kore-mid mt-xs">Footfall-Entwicklung im Zeitverlauf</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value={7}>7 Tage</option>
          <option value={14}>14 Tage</option>
          <option value={30}>30 Tage</option>
          <option value={60}>60 Tage</option>
          <option value={90}>90 Tage</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !trends?.length ? (
        <div className="text-body text-kore-mid">Keine Trend-Daten verfügbar.</div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="space-y-xs">
            {trends.map((t: any) => (
              <div key={t.date} className="flex items-center gap-md">
                <span className="text-small text-kore-faint w-20 shrink-0">{t.date.slice(5)}</span>
                <div className="flex-1 h-6 bg-kore-bg relative">
                  <div
                    className="h-full bg-kore-brass/60"
                    style={{ width: `${(t.footfall / maxFootfall) * 100}%` }}
                  />
                </div>
                <span className="text-small text-kore-ink w-16 text-right">{Number(t.footfall).toLocaleString('de-DE')}</span>
                <span className="text-small text-kore-mid w-16 text-right">{Number(t.conversionRate).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-lg mt-md text-small text-kore-faint">
            <span>█ Footfall</span>
            <span>% Conversion</span>
          </div>
        </div>
      )}
    </div>
  );
}
