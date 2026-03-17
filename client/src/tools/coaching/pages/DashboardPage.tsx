import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Users, TrendingUp, Award } from 'lucide-react';
import { useCoachingDashboard } from '../../../hooks/useCoaching';

export function DashboardPage() {
  const { data: db, isLoading } = useCoachingDashboard();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;
  if (!db) return <div className="p-xl text-body text-kore-mid">Keine Daten verfuegbar.</div>;

  const maxTrend = Math.max(...(db.trend ?? []).map((t: any) => t.total), 1);
  const maxCoach = Math.max(...(db.coachRanking ?? []).map((c: any) => c.count), 1);

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/coaching" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Coaching Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">Coaching-Quote, Trends und Aktivitaeten im Ueberblick</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Coaching-Quote</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{db.coachingQuote}%</div>
          <span className="text-small text-kore-faint">{db.uniqueCoachees} von {db.totalUsers} MA</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Sessions gesamt</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{db.totalSessions}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeschlossen</span>
          <div className="font-display text-h1 text-emerald-600 mt-sm">{db.completedSessions}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Geplant</span>
          <div className="font-display text-h1 text-blue-600 mt-sm">{db.scheduledSessions}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-2xl">
        {/* Sessions per Month Trend */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
            <TrendingUp size={18} /> Sessions pro Monat
          </h2>
          {(db.trend ?? []).length > 0 ? (
            <div className="space-y-md">
              {(db.trend as any[]).map((t) => (
                <div key={t.month} className="flex items-center gap-md">
                  <span className="text-small text-kore-mid w-20">{t.month}</span>
                  <div className="flex-1 bg-kore-bg h-6 relative">
                    <div
                      className="bg-kore-ink h-full absolute left-0 top-0"
                      style={{ width: `${(t.total / maxTrend) * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full absolute left-0 top-0 opacity-60"
                      style={{ width: `${(t.completed / maxTrend) * 100}%` }}
                    />
                  </div>
                  <span className="text-small text-kore-mid w-16 text-right">{t.completed}/{t.total}</span>
                </div>
              ))}
              <div className="flex gap-lg mt-sm text-small text-kore-faint">
                <span className="flex items-center gap-xs"><span className="w-3 h-3 bg-kore-ink inline-block" /> Gesamt</span>
                <span className="flex items-center gap-xs"><span className="w-3 h-3 bg-emerald-500 opacity-60 inline-block" /> Abgeschlossen</span>
              </div>
            </div>
          ) : (
            <p className="text-body text-kore-mid">Noch keine Daten.</p>
          )}
        </div>

        {/* Top Topics */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
            <Award size={18} /> Top Themen
          </h2>
          {(db.topics ?? []).length > 0 ? (
            <div className="space-y-md">
              {(db.topics as any[]).map((t, i) => {
                const maxTopic = (db.topics as any[])[0]?.count ?? 1;
                return (
                  <div key={t.topic} className="flex items-center gap-md">
                    <span className="text-small text-kore-faint w-6">{i + 1}.</span>
                    <span className="text-small text-kore-ink w-28 truncate">{t.topic}</span>
                    <div className="flex-1 bg-kore-bg h-4 relative">
                      <div className="bg-kore-ink h-full" style={{ width: `${(t.count / maxTopic) * 100}%` }} />
                    </div>
                    <span className="text-small text-kore-mid w-10 text-right">{t.count}x</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-body text-kore-mid">Noch keine Themen vergeben.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Coach Activity Ranking */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
            <Users size={18} /> Coach-Aktivitaet
          </h2>
          {(db.coachRanking ?? []).length > 0 ? (
            <div className="space-y-md">
              {(db.coachRanking as any[]).map((c, i) => (
                <div key={c.id} className="flex items-center gap-md">
                  <span className="text-small text-kore-faint w-6">{i + 1}.</span>
                  <span className="text-small text-kore-ink w-32 truncate">{c.name}</span>
                  <div className="flex-1 bg-kore-bg h-4 relative">
                    <div className="bg-kore-ink h-full" style={{ width: `${(c.count / maxCoach) * 100}%` }} />
                  </div>
                  <span className="text-small text-kore-mid w-16 text-right">{c.count} Sess.</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-kore-mid">Noch keine abgeschlossenen Sessions.</p>
          )}
        </div>

        {/* Store Comparison */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Store-Vergleich</h2>
          {(db.storeComparison ?? []).length > 0 ? (
            <div className="space-y-sm">
              {(db.storeComparison as any[]).map((s) => {
                const maxStore = (db.storeComparison as any[])[0]?.total ?? 1;
                const completionRate = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
                return (
                  <div key={s.id} className="flex items-center gap-md">
                    <span className="text-small text-kore-ink w-32 truncate">{s.name}</span>
                    <div className="flex-1 bg-kore-bg h-4 relative">
                      <div className="bg-kore-ink h-full" style={{ width: `${(s.total / maxStore) * 100}%` }} />
                    </div>
                    <span className="text-small text-kore-mid w-20 text-right">{s.completed}/{s.total}</span>
                    <span className={`text-small w-12 text-right ${completionRate >= 80 ? 'text-emerald-600' : completionRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      {completionRate}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-body text-kore-mid">Noch keine Sessions in Stores.</p>
          )}
        </div>
      </div>
    </div>
  );
}
