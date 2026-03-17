import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useAuditSummary, useAuditTrends, useAuditCategoryStats } from '../../../hooks/useAudit';

export function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useAuditSummary();
  const { data: trends, isLoading: loadingTrends } = useAuditTrends();
  const { data: categoryData } = useAuditCategoryStats();

  const trendIcon = summary?.recentTrend === 'up'
    ? <TrendingUp size={16} className="text-emerald-600" />
    : summary?.recentTrend === 'down'
      ? <TrendingDown size={16} className="text-red-600" />
      : <Minus size={16} className="text-kore-mid" />;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/app/tools/sea" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Audit Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Score-Trends, Kategorie-Performance und Store-Ranking</p>
        </div>
      </div>

      {/* Summary KPIs */}
      {loadingSummary ? (
        <div className="text-body text-kore-mid mb-xl">Lade Zusammenfassung...</div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Audits gesamt</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{summary.totalAudits}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Score</span>
            <div className={`font-display text-h2 mt-sm ${summary.averageScore >= 80 ? 'text-emerald-600' : summary.averageScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
              {summary.averageScore}%
            </div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Pass-Rate</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{summary.passRate}%</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Trend</span>
            <div className="flex items-center gap-sm mt-sm">
              {trendIcon}
              <span className="text-body text-kore-ink">
                {summary.recentTrend === 'up' ? 'Aufwaerts' : summary.recentTrend === 'down' ? 'Abwaerts' : 'Stabil'}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Score Trends */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
            <BarChart3 size={18} /> Score-Verlauf
          </h2>
          {loadingTrends ? (
            <div className="text-small text-kore-mid">Lade Trends...</div>
          ) : trends && trends.length > 0 ? (
            <div className="space-y-sm">
              {trends.map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-md">
                  <span className="text-caption text-kore-faint w-20 flex-shrink-0">
                    {entry.completedAt ? new Date(entry.completedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '-'}
                  </span>
                  <div className="flex-1 bg-kore-bg h-4 relative">
                    <div
                      className={`h-full transition-all ${(entry.overallScore ?? 0) >= 80 ? 'bg-emerald-500' : (entry.overallScore ?? 0) >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, entry.overallScore ?? 0)}%` }}
                    />
                  </div>
                  <span className="text-caption text-kore-ink w-12 text-right font-medium">
                    {(entry.overallScore ?? 0).toFixed(0)}%
                  </span>
                  <span className="text-caption text-kore-faint w-24 truncate">
                    {entry.store?.name ?? ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-small text-kore-mid">Noch keine abgeschlossenen Audits.</div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Kategorie-Performance</h2>
          {categoryData && categoryData.categoryAverages && categoryData.categoryAverages.length > 0 ? (
            <div className="space-y-md">
              {categoryData.categoryAverages.map((cat: any) => (
                <div key={cat.categoryName} className="space-y-xs">
                  <div className="flex items-center justify-between text-small">
                    <span className="text-kore-ink font-medium">{cat.categoryName}</span>
                    <div className="flex items-center gap-lg text-kore-mid">
                      <span>Ø {cat.averageScore}%</span>
                      <span>Pass {cat.passRate}%</span>
                      <span className="text-kore-faint">{cat.sampleCount}x</span>
                    </div>
                  </div>
                  <div className="w-full bg-kore-bg h-3">
                    <div
                      className={`h-full ${cat.averageScore >= 80 ? 'bg-emerald-500' : cat.averageScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, cat.averageScore)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-md border-t border-kore-border text-small text-kore-faint">
                Basierend auf {categoryData.totalSessions} abgeschlossenen Audits
              </div>
            </div>
          ) : (
            <div className="text-small text-kore-mid">Noch keine Kategorie-Daten vorhanden.</div>
          )}
        </div>
      </div>

      {/* Store Ranking */}
      {trends && trends.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl mt-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Store-Ranking (letzte Audits)</h2>
          <div className="space-y-sm">
            {(() => {
              const storeScores = new Map<string, { name: string; scores: number[] }>();
              for (const entry of trends) {
                const name = entry.store?.name ?? 'Unbekannt';
                const existing = storeScores.get(name);
                if (existing) {
                  existing.scores.push(entry.overallScore ?? 0);
                } else {
                  storeScores.set(name, { name, scores: [entry.overallScore ?? 0] });
                }
              }
              const ranked = Array.from(storeScores.values())
                .map((s) => ({ name: s.name, avg: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length * 10) / 10, count: s.scores.length }))
                .sort((a, b) => b.avg - a.avg);

              return ranked.map((store, idx) => (
                <div key={store.name} className="flex items-center gap-md">
                  <span className="text-caption text-kore-faint w-6 text-right">{idx + 1}.</span>
                  <span className="text-small text-kore-ink font-medium flex-1">{store.name}</span>
                  <div className="w-32 bg-kore-bg h-3">
                    <div
                      className={`h-full ${store.avg >= 80 ? 'bg-emerald-500' : store.avg >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, store.avg)}%` }}
                    />
                  </div>
                  <span className="text-caption text-kore-ink w-12 text-right">{store.avg}%</span>
                  <span className="text-caption text-kore-faint w-8 text-right">{store.count}x</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
