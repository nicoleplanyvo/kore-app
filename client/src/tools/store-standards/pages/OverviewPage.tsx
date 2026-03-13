import { Link } from 'react-router-dom';
import { Plus, Award, BarChart3, Settings } from 'lucide-react';
import { useStdSummary, useStdEvaluations } from '../../../hooks/useStoreStandards';
import { ScoreBar } from '../components/ScoreBar';

export function OverviewPage() {
  const { data: stats, isLoading } = useStdSummary();
  const { data: recentData } = useStdEvaluations(1);
  const recent = (recentData?.data ?? []).slice(0, 5);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Store Standards</h1>
          <p className="text-body text-kore-mid mt-xs">Standards definieren, messen und benchmarken</p>
        </div>
        <div className="flex gap-md">
          <Link to="/tools/store-standards/definitions" className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors"><Settings size={16} /> Standards</Link>
          <Link to="/tools/store-standards/evaluations/new" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><Plus size={16} /> Neue Bewertung</Link>
        </div>
      </div>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : stats && stats.totalEvaluations > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Score</span>
              <div className="mt-md"><ScoreBar score={stats.averageScore} /></div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Compliance</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{Math.round(stats.complianceRate)}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Bewertungen</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalEvaluations}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Diesen Monat</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.thisMonth}</div>
            </div>
          </div>

          {recent.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-lg">
                <h2 className="font-display text-h2 text-kore-ink">Letzte Bewertungen</h2>
                <Link to="/tools/store-standards/evaluations" className="text-small text-kore-brass hover:text-kore-brass-dk">Alle anzeigen &rarr;</Link>
              </div>
              <div className="space-y-md">
                {recent.map(ev => (
                  <Link key={ev.id} to={`/tools/store-standards/evaluations/${ev.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-body font-medium text-kore-ink">{ev.store?.name}</span>
                        <div className="flex items-center gap-md mt-xs">
                          <span className="text-small text-kore-mid">{ev.period}</span>
                          <span className="text-small text-kore-faint">von {ev.evaluator?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-lg">
                        {ev.overallScore !== null && <div className="w-32"><ScoreBar score={ev.overallScore} /></div>}
                        <span className={`text-small font-medium px-md py-xs border ${ev.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{ev.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Arbeit'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Award size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Bewertungen</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Definieren Sie Store Standards und starten Sie die erste Bewertung.</p>
          <Link to="/tools/store-standards/evaluations/new" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><Plus size={16} /> Erste Bewertung</Link>
        </div>
      )}
    </div>
  );
}
