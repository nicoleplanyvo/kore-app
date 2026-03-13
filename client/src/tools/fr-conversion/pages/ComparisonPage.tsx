import { Link } from 'react-router-dom';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import { useConversionComparison } from '../../../hooks/useFrConversion';

export function ComparisonPage() {
  const { data: comparison, isLoading } = useConversionComparison();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/fr-conversion" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><GitCompareArrows size={24} /> Store-Vergleich</h1>
          <p className="text-body text-kore-mid mt-xs">Conversion-Performance im Store-Vergleich.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Vergleichsdaten...</div>
      ) : !comparison?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Vergleichsdaten vorhanden.</div>
      ) : (
        <div className="bg-kore-white border border-kore-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-kore-border bg-kore-bg">
                <th className="text-left px-md py-sm text-small text-kore-mid font-medium">Store</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Ø Conversion</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Ø Warenkorb</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Footfall</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Revenue</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Transaktionen</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row: any, i: number) => (
                <tr key={i} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50">
                  <td className="px-md py-sm text-body font-medium text-kore-ink">{row.storeName ?? row.storeId}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.avgConversion?.toFixed(1) ?? '—'}%</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.avgBasket?.toFixed(2) ?? '—'} €</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalFootfall?.toLocaleString('de-DE') ?? '—'}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalRevenue?.toLocaleString('de-DE') ?? '—'} €</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{row.totalTransactions?.toLocaleString('de-DE') ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
