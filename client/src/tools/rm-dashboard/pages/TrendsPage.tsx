import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useRmTrends } from '../../../hooks/useRmDashboard';

export function TrendsPage() {
  const [weeks, setWeeks] = useState(4);
  const { data: trends, isLoading } = useRmTrends({ weeks });

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/rm-dashboard" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><TrendingUp size={24} /> Revenue-Trends</h1>
          <p className="text-body text-kore-mid mt-xs">Wöchentliche Entwicklung über alle Stores.</p>
        </div>
        <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="border border-kore-border px-md py-sm text-body">
          <option value={4}>4 Wochen</option>
          <option value={8}>8 Wochen</option>
          <option value={12}>12 Wochen</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Trends...</div>
      ) : !trends?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Trend-Daten vorhanden.</div>
      ) : (
        <div className="bg-kore-white border border-kore-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-kore-border bg-kore-bg">
                <th className="text-left px-md py-sm text-small text-kore-mid font-medium">Woche</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Revenue</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Transaktionen</th>
                <th className="text-right px-md py-sm text-small text-kore-mid font-medium">Footfall</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((t: any) => (
                <tr key={t.week} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50">
                  <td className="px-md py-sm text-body font-medium text-kore-ink">KW {t.week}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{t.revenue?.toLocaleString('de-DE')} €</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{t.transactions?.toLocaleString('de-DE')}</td>
                  <td className="px-md py-sm text-body text-kore-ink text-right">{t.footfall?.toLocaleString('de-DE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
