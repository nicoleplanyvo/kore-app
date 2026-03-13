import { Link } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Minus, ClipboardCheck } from 'lucide-react';
import { useAuditSummary } from '../../../hooks/useAudit';
import { ScoreRing } from '../components/ScoreRing';

export function OverviewPage() {
  const { data: stats, isLoading } = useAuditSummary();

  const trendIcon =
    stats?.recentTrend === 'up' ? (
      <TrendingUp size={16} className="text-kore-success" />
    ) : stats?.recentTrend === 'down' ? (
      <TrendingDown size={16} className="text-kore-error" />
    ) : (
      <Minus size={16} className="text-kore-mid" />
    );

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Store Excellence Audit</h1>
          <p className="text-body text-kore-mid mt-xs">
            Übersicht und Schnellstart
          </p>
        </div>
        <Link
          to="/tools/sea/sessions/new"
          className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
        >
          <Plus size={16} />
          Neues Audit
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : stats && stats.totalAudits > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
          <div className="bg-kore-white border border-kore-border p-xl flex flex-col items-center">
            <ScoreRing score={stats.averageScore} label="Durchschnitt" />
            <div className="flex items-center gap-xs mt-md text-small text-kore-mid">
              {trendIcon}
              <span>
                {stats.recentTrend === 'up'
                  ? 'Aufwärtstrend'
                  : stats.recentTrend === 'down'
                    ? 'Abwärtstrend'
                    : 'Stabil'}
              </span>
            </div>
          </div>

          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">
              Pass-Rate
            </span>
            <div className="font-display text-h1 text-kore-ink mt-sm">
              {stats.passRate}%
            </div>
            <p className="text-small text-kore-mid mt-xs">
              der Kriterien bestanden
            </p>
          </div>

          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">
              Durchgeführte Audits
            </span>
            <div className="font-display text-h1 text-kore-ink mt-sm">
              {stats.totalAudits}
            </div>
            <div className="mt-md">
              <Link
                to="/tools/sea/sessions"
                className="text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
              >
                Alle ansehen &rarr;
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ClipboardCheck size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">
            Noch keine Audits durchgeführt
          </h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Starten Sie Ihr erstes Store Excellence Audit, um die Performance
            Ihres Stores systematisch zu bewerten.
          </p>
          <Link
            to="/tools/sea/sessions/new"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} />
            Erstes Audit starten
          </Link>
        </div>
      )}
    </div>
  );
}
