import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Store, BarChart3 } from 'lucide-react';
import { useFrTrackingDashboard } from '../../../hooks/useFrTracking';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useFrTrackingDashboard();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;
  if (!dashboard) return <div className="p-xl text-body text-kore-mid">Keine Daten verfuegbar.</div>;

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/fr-tracking" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurueck
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">FR Tracking Dashboard</h1>
      <p className="text-body text-kore-mid mb-2xl">Vollstaendige Analyse der Fitting-Room-Performance (30 Tage)</p>

      {/* Period KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Footfall</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{Number(dashboard.period?.totalFootfall ?? 0).toLocaleString('de-DE')}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Transaktionen</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{Number(dashboard.period?.totalTransactions ?? 0).toLocaleString('de-DE')}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Conversion</span>
          <div className={`font-display text-h2 mt-sm ${(dashboard.period?.avgConversion ?? 0) >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {(dashboard.period?.avgConversion ?? 0).toFixed(1)}%
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Umsatz</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{Number(dashboard.period?.totalRevenue ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Tage</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{dashboard.period?.days ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-2xl">
        {/* Store Comparison */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Store size={18} /> Store-Vergleich</h2>
          {(dashboard.storeComparison ?? []).length === 0 ? (
            <p className="text-small text-kore-mid">Keine Store-Daten.</p>
          ) : (
            <div className="space-y-md">
              {(dashboard.storeComparison as any[]).map((s: any, i: number) => (
                <div key={s.storeId} className="flex items-center gap-md">
                  <span className="text-caption text-kore-faint w-6">{i + 1}.</span>
                  <span className="text-small text-kore-ink flex-1 truncate">{s.storeName}</span>
                  <div className="w-20 bg-kore-bg h-3 relative">
                    <div className={`h-full ${s.conversionRate >= 20 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, s.conversionRate * 2)}%` }} />
                  </div>
                  <span className="text-small text-kore-mid w-16 text-right">{s.conversionRate.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><BarChart3 size={18} /> Heute</h2>
          <div className="grid grid-cols-3 gap-lg">
            <div>
              <span className="text-caption text-kore-mid">Footfall</span>
              <div className="font-display text-h2 text-kore-ink">{dashboard.today?.footfall ?? 0}</div>
            </div>
            <div>
              <span className="text-caption text-kore-mid">Transaktionen</span>
              <div className="font-display text-h2 text-kore-ink">{dashboard.today?.transactions ?? 0}</div>
            </div>
            <div>
              <span className="text-caption text-kore-mid">Conversion</span>
              <div className={`font-display text-h2 ${(dashboard.today?.conversion ?? 0) >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {(dashboard.today?.conversion ?? 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trend */}
      {(dashboard.dailyTrend ?? []).length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><TrendingUp size={18} /> Tagesverlauf (30 Tage)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="text-left py-sm text-kore-mid font-medium">Datum</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Footfall</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Transaktionen</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Conversion</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Umsatz</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.dailyTrend as any[]).slice(-14).map((d: any) => (
                  <tr key={d.date} className="border-b border-kore-border last:border-0">
                    <td className="py-sm text-kore-ink">{new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                    <td className="py-sm text-right text-kore-ink">{d.footfall}</td>
                    <td className="py-sm text-right text-kore-ink">{d.transactions}</td>
                    <td className={`py-sm text-right font-medium ${d.conversionRate >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>{d.conversionRate.toFixed(1)}%</td>
                    <td className="py-sm text-right text-kore-ink">{Number(d.revenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
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
