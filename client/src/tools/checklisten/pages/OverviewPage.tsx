import { Link } from 'react-router-dom';
import { Plus, ClipboardCheck } from 'lucide-react';
import { useChecklistSummary } from '../../../hooks/useChecklist';
import { ChecklistProgress } from '../components/ChecklistProgress';

export function OverviewPage() {
  const { data: stats, isLoading } = useChecklistSummary();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Checklisten</h1>
          <p className="text-body text-kore-mid mt-xs">
            Uebersicht und Schnellstart
          </p>
        </div>
        <Link
          to="/tools/checklisten/sessions/new"
          className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
        >
          <Plus size={16} />
          Neue Checkliste
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : stats && stats.totalSessions > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-xl">
          {/* Durchschnittlicher Erfuellungsgrad */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">
              Ø Erfuellungsgrad
            </span>
            <div className="mt-md">
              <ChecklistProgress
                value={stats.averageCompletionRate}
                size="lg"
              />
            </div>
          </div>

          {/* Total abgeschlossen */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">
              Total abgeschlossen
            </span>
            <div className="font-display text-h1 text-kore-ink mt-sm">
              {stats.totalSessions}
            </div>
            <div className="mt-md">
              <Link
                to="/tools/checklisten/sessions"
                className="text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
              >
                Alle anzeigen &rarr;
              </Link>
            </div>
          </div>

          {/* Diesen Monat */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">
              Diesen Monat
            </span>
            <div className="font-display text-h1 text-kore-ink mt-sm">
              {stats.thisMonth}
            </div>
            <p className="text-small text-kore-mid mt-xs">
              Checklisten durchgefuehrt
            </p>
          </div>

          {/* Letzten Monat */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">
              Letzten Monat
            </span>
            <div className="font-display text-h1 text-kore-ink mt-sm">
              {stats.lastMonth}
            </div>
            <p className="text-small text-kore-mid mt-xs">
              Checklisten durchgefuehrt
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ClipboardCheck size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">
            Noch keine Checklisten durchgefuehrt
          </h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Starten Sie Ihre erste Checkliste, um die Einhaltung von Standards
            in Ihrem Store systematisch zu pruefen.
          </p>
          <Link
            to="/tools/checklisten/sessions/new"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} />
            Erste Checkliste starten
          </Link>
        </div>
      )}
    </div>
  );
}
