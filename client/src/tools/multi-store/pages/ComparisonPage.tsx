import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useMultiStoreComparison } from '../../../hooks/useMultiStore';

export function ComparisonPage() {
  const [period, setPeriod] = useState('7d');
  const { data: comparison, isLoading } = useMultiStoreComparison({ period });

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/multi-store" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><BarChart3 size={24} /> Store-Vergleich</h1>
          <p className="text-body text-kore-mid mt-xs">KPI-Vergleich über alle Stores.</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="7d">Letzte 7 Tage</option>
          <option value="14d">Letzte 14 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Vergleich...</div>
      ) : !comparison?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Vergleichsdaten vorhanden.</div>
      ) : (
        <div className="bg-kore-white border border-kore-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-kore-border bg-kore-bg">
                <th className="text-left px-md py-sm text-small text-kore-mid font-medium">Store</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Revenue</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Transaktionen</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Footfall</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Units Sold</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Ø Rev/Tag</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row: any) => (
                <tr key={row.storeId} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50">
                  <td className="px-md py-sm text-body font-medium text-kore-ink">{row.storeName}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalRevenue?.toLocaleString('de-DE')} €</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalTransactions?.toLocaleString('de-DE')}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalFootfall?.toLocaleString('de-DE')}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalUnitsSold?.toLocaleString('de-DE')}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.avgRevenuePerDay?.toLocaleString('de-DE')} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
