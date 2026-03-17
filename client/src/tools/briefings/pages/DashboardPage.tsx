import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, FileText, Store } from 'lucide-react';
import { useBriefingDashboard, useBriefingStores } from '../../../hooks/useBriefings';

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useBriefingStores();
  const { data: dash, isLoading } = useBriefingDashboard(storeId || undefined);

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/briefings" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Briefing Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Lesequoten, Trends und Store-Vergleich.</p>
        </div>
      </div>

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <div className="mb-xl">
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-body">
            <option value="">Alle Stores</option>
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard...</div>
      ) : !dash ? (
        <div className="text-body text-kore-mid">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Lesequote</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dash.avgReadRate}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Briefings gesamt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dash.totalBriefings}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Pro Woche</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dash.briefingsPerWeek}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Stores</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dash.storeComparison?.length ?? 0}</div>
            </div>
          </div>

          {/* Trend chart (bar) */}
          {dash.trend && (dash.trend as Array<any>).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><TrendingUp size={18} /> Lesequote im Zeitverlauf</h2>
              <div className="flex items-end gap-sm h-48">
                {(dash.trend as Array<any>).map((t: any) => (
                  <div key={t.date} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-caption text-kore-ink mb-xs">{t.avgReadRate}%</span>
                    <div className="w-full bg-kore-brass rounded-t" style={{ height: `${Math.max(4, t.avgReadRate)}%` }} />
                    <span className="text-caption text-kore-faint mt-xs whitespace-nowrap" style={{ fontSize: '0.6rem' }}>
                      {new Date(t.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store comparison */}
          {dash.storeComparison && (dash.storeComparison as Array<any>).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Store size={18} /> Store-Vergleich</h2>
              <div className="space-y-md">
                {(dash.storeComparison as Array<any>).map((s: any) => (
                  <div key={s.storeId} className="flex items-center gap-lg">
                    <span className="text-small text-kore-ink w-40 truncate">{s.storeName}</span>
                    <div className="flex-1 bg-kore-bg h-4 relative">
                      <div className="bg-kore-brass h-full transition-all" style={{ width: `${Math.min(100, s.avgReadRate)}%` }} />
                    </div>
                    <span className="text-small text-kore-ink w-14 text-right">{s.avgReadRate}%</span>
                    <span className="text-caption text-kore-faint w-16 text-right">{s.briefingCount} Briefings</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent briefings with read rates */}
          {dash.recentBriefings && (dash.recentBriefings as Array<any>).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><BarChart3 size={18} /> Letzte Briefings</h2>
              <div className="divide-y divide-kore-border">
                {(dash.recentBriefings as Array<any>).map((b: any) => (
                  <Link key={b.id} to={`/tools/briefings/${b.id}`} className="flex items-center gap-lg py-md hover:bg-kore-bg transition-colors px-sm -mx-sm">
                    <FileText size={16} className="text-kore-mid flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-body text-kore-ink truncate block">{b.title}</span>
                      <span className="text-caption text-kore-faint">{b.storeName} &middot; {new Date(b.date + 'T00:00:00').toLocaleDateString('de-DE')}</span>
                    </div>
                    <div className="flex items-center gap-md flex-shrink-0">
                      <div className="w-20 bg-kore-bg h-2">
                        <div className={`h-full ${b.readRate >= 80 ? 'bg-emerald-500' : b.readRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, b.readRate)}%` }} />
                      </div>
                      <span className="text-small text-kore-ink w-12 text-right">{b.readRate}%</span>
                      <span className="text-caption text-kore-faint w-16 text-right">{b.acks}/{b.userCount}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
