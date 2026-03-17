import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Store } from 'lucide-react';
import { useBudgetDashboard } from '../../../hooks/useBudget';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtEur(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function AmpelDot({ ampel }: { ampel: string }) {
  const colors: Record<string, string> = {
    gruen: 'bg-emerald-500',
    gelb: 'bg-amber-500',
    rot: 'bg-red-500',
  };
  return <span className={`inline-block w-3 h-3 rounded-full ${colors[ampel] ?? 'bg-gray-300'}`} />;
}

function monthLabel(monthStr: string): string {
  const [y, m] = monthStr.split('-');
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

export function DashboardPage() {
  const [month, setMonth] = useState(currentMonth());
  const { data: dashboard, isLoading } = useBudgetDashboard(month);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/budget" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Store size={24} /> Multi-Store Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">Vergleich, Ranking und Regions-Gesamtziel</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        />
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard...</div>
      ) : !dashboard ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* Region Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Stores</span>
              <span className="font-display text-h2 text-kore-ink">{dashboard.storeCount}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Regions-Soll</span>
              <span className="font-display text-h2 text-kore-ink">{fmtEur(dashboard.region.targetRevenue)}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Regions-Ist</span>
              <span className="font-display text-h2 text-kore-ink">{fmtEur(dashboard.region.totalActual)}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Hochrechnung</span>
              <span className="font-display text-h2 text-kore-ink">{fmtEur(dashboard.region.projection)}</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Zielerreichung</span>
              <span className="font-display text-h2 text-kore-ink">{dashboard.region.achievementPercent}%</span>
              <span className="block text-small text-kore-faint">Prognose: {dashboard.region.projectedAchievement}%</span>
            </div>
          </div>

          {/* Region Progress Bar */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <div className="flex items-center justify-between mb-md">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Regions-Gesamtziel</span>
              <span className="text-small text-kore-mid">
                Tag {dashboard.elapsedDays} / {dashboard.totalDays}
              </span>
            </div>
            <div className="relative w-full bg-kore-bg h-6 mb-sm">
              <div
                className="absolute top-0 h-full border-r-2 border-dashed border-kore-mid z-10"
                style={{ left: `${Math.min(100, (dashboard.elapsedDays / dashboard.totalDays) * 100)}%` }}
              />
              <div
                className={`h-full transition-all ${
                  dashboard.region.achievementPercent >= 95 ? 'bg-emerald-500' :
                  dashboard.region.achievementPercent >= 80 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, dashboard.region.achievementPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-small text-kore-faint">
              <span>0</span>
              <span>{fmtEur(dashboard.region.targetRevenue)}</span>
            </div>
          </div>

          {/* Store Ranking */}
          <div className="bg-kore-white border border-kore-border mb-xl">
            <div className="flex items-center gap-sm p-lg border-b border-kore-border">
              <Trophy size={18} className="text-kore-brass" />
              <h2 className="font-display text-h3 text-kore-ink">Ranking nach Zielerreichung</h2>
            </div>
            {dashboard.ranking.length === 0 ? (
              <div className="p-lg text-body text-kore-mid">Keine Stores mit Umsatzplan fuer diesen Monat.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-kore-border bg-kore-bg">
                      <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest w-10">#</th>
                      <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Store</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Soll</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Ist</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Hochrechnung</th>
                      <th className="text-center px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Erreichung</th>
                      <th className="text-center px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Prognose</th>
                      <th className="text-center px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.ranking.map((store: any, idx: number) => (
                      <tr key={store.storeId} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/40">
                        <td className="px-lg py-md text-kore-mid font-medium">{idx + 1}</td>
                        <td className="px-lg py-md">
                          <span className="text-kore-ink font-medium">{store.storeName}</span>
                          {store.storeCity && <span className="text-kore-faint ml-sm">{store.storeCity}</span>}
                        </td>
                        <td className="px-lg py-md text-right text-kore-mid">{fmtEur(store.targetRevenue)}</td>
                        <td className="px-lg py-md text-right text-kore-ink font-medium">{fmtEur(store.totalActual)}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{fmtEur(store.projection)}</td>
                        <td className="px-lg py-md text-center">
                          <span className={`font-medium ${
                            store.achievementPercent >= 95 ? 'text-emerald-600' :
                            store.achievementPercent >= 80 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {store.achievementPercent}%
                          </span>
                        </td>
                        <td className="px-lg py-md text-center text-kore-mid">{store.projectedAchievement}%</td>
                        <td className="px-lg py-md text-center"><AmpelDot ampel={store.ampel} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Trend */}
          {dashboard.trend && dashboard.trend.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm mb-lg">
                <TrendingUp size={18} className="text-kore-mid" />
                <h2 className="font-display text-h3 text-kore-ink">Monatlicher Trend (6 Monate)</h2>
              </div>
              <div className="space-y-md">
                {dashboard.trend.map((t: any) => {
                  const pct = t.target > 0 ? Math.min(120, (t.actual / t.target) * 100) : 0;
                  const isSelected = t.month === month;
                  return (
                    <div key={t.month} className={`flex items-center gap-lg ${isSelected ? 'bg-kore-bg/50 -mx-md px-md py-sm' : ''}`}>
                      <span className={`text-small w-20 ${isSelected ? 'text-kore-ink font-medium' : 'text-kore-mid'}`}>
                        {monthLabel(t.month)}
                      </span>
                      <div className="flex-1 bg-kore-bg h-5 relative">
                        <div
                          className={`h-full ${
                            t.achievement >= 100 ? 'bg-emerald-500' :
                            t.achievement >= 85 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                        {/* Target marker */}
                        <div className="absolute top-0 right-0 h-full border-r-2 border-dashed border-kore-mid" />
                      </div>
                      <span className="text-small text-kore-mid w-24 text-right">{fmtEur(t.actual)}</span>
                      <span className={`text-small font-medium w-14 text-right ${
                        t.achievement >= 100 ? 'text-emerald-600' :
                        t.achievement >= 85 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {t.achievement}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
