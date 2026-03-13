import { Link } from 'react-router-dom';
import { ShieldAlert, List, AlertTriangle } from 'lucide-react';
import { useLossSummary } from '../../../hooks/useLossPrevention';

const SEVERITY_COLORS: any = {
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

export function OverviewPage() {
  const { data: stats, isLoading } = useLossSummary();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Loss Prevention</h1>
          <p className="text-body text-kore-mid mt-xs">Vorfaelle erfassen, untersuchen und Verluste reduzieren</p>
        </div>
        <Link to="/tools/loss-prevention/incidents" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> Alle Vorfaelle</Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : stats && stats.totalIncidents > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Vorfaelle gesamt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalIncidents}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Offen</span>
              <div className="font-display text-h1 text-amber-600 mt-sm">{stats.openIncidents ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Geschaetzter Verlust</span>
              <div className="font-display text-h2 text-red-600 mt-sm">{Number(stats.totalEstimatedLoss ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Diesen Monat</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.thisMonth ?? 0}</div>
            </div>
          </div>

          {/* By Severity */}
          {stats.bySeverity && (stats.bySeverity as Array<any>).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Nach Schweregrad</h2>
              <div className="flex gap-lg">
                {(stats.bySeverity as Array<any>).map((s) => (
                  <div key={s.severity} className={`flex-1 border px-lg py-md text-center ${SEVERITY_COLORS[s.severity] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
                    <div className="text-caption uppercase tracking-widest">{s.severity}</div>
                    <div className="font-display text-h2 mt-xs">{s._count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By Category */}
          {stats.byCategory && (stats.byCategory as Array<any>).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Nach Kategorie</h2>
              <div className="space-y-sm">
                {(stats.byCategory as Array<any>).map((c) => {
                  const max = Math.max(1, ...(stats.byCategory as Array<any>).map((x) => x._count));
                  return (
                    <div key={c.category} className="flex items-center gap-md">
                      <span className="text-small text-kore-ink w-32 capitalize">{(c.category).replace(/_/g, ' ')}</span>
                      <div className="flex-1 bg-kore-bg h-4">
                        <div className="bg-kore-ink h-full" style={{ width: `${((c._count) / max) * 100}%` }} />
                      </div>
                      <span className="text-small text-kore-mid w-10 text-right">{c._count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ShieldAlert size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Vorfaelle erfasst</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erfassen Sie Diebstaehle, Schaeden und andere Verluste, um Muster zu erkennen und Praevention zu verbessern.</p>
          <Link to="/tools/loss-prevention/incidents" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><AlertTriangle size={16} /> Vorfall melden</Link>
        </div>
      )}
    </div>
  );
}
