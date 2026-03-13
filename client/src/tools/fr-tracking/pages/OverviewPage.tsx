import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, List, TrendingUp } from 'lucide-react';
import { useFrStores, useFrSummary } from '../../../hooks/useFrTracking';

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useFrStores();
  const { data: summary, isLoading } = useFrSummary(storeId || undefined);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/fr-tracking" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">FR Tracking</h1>
          <p className="text-body text-kore-mid mt-xs">Footfall & Revenue Tracking</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Link to="/tools/fr-tracking/entries" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <List size={14} /> Einträge
        </Link>
        <Link to="/tools/fr-tracking/trends" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <TrendingUp size={14} /> Trends
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !summary ? (
        <div className="text-body text-kore-mid">Keine Daten verfügbar.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="text-small text-kore-mid mb-xs">Footfall Gesamt</div>
            <div className="text-h2 font-display text-kore-ink">{Number(summary.totalFootfall).toLocaleString('de-DE')}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="text-small text-kore-mid mb-xs">Umsatz Gesamt</div>
            <div className="text-h2 font-display text-kore-ink">{Number(summary.totalRevenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="text-small text-kore-mid mb-xs">Transaktionen</div>
            <div className="text-h2 font-display text-kore-ink">{Number(summary.totalTransactions).toLocaleString('de-DE')}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-xs text-small text-kore-mid mb-xs"><BarChart3 size={14} /> Conversion</div>
            <div className="text-h2 font-display text-kore-ink">{Number(summary.avgConversion).toFixed(1)}%</div>
          </div>
        </div>
      )}
    </div>
  );
}
