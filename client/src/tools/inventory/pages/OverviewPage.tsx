import { Link } from 'react-router-dom';
import { Package, List, Plus } from 'lucide-react';
import { useInventorySummary } from '../../../hooks/useInventory';

export function OverviewPage() {
  const { data: stats, isLoading } = useInventorySummary();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Inventur</h1>
          <p className="text-body text-kore-mid mt-xs">Bestandsaufnahmen durchfuehren und Abweichungen erkennen</p>
        </div>
        <Link to="/tools/inventory/counts" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> Alle Zahlungen</Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : stats && stats.totalCounts > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Inventuren gesamt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalCounts}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeschlossen</span>
              <div className="font-display text-h1 text-emerald-600 mt-sm">{stats.completedCounts ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">In Arbeit</span>
              <div className="font-display text-h1 text-amber-600 mt-sm">{stats.inProgressCounts ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Abweichung</span>
              <div className={`font-display text-h2 mt-sm ${Number(stats.avgVariance ?? 0) > 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {Number(stats.avgVariance ?? 0).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Positionen gezaehlt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalItems ?? 0}</div>
              <p className="text-small text-kore-mid mt-xs">ueber alle Inventuren</p>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Diesen Monat</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.thisMonth ?? 0}</div>
              <p className="text-small text-kore-mid mt-xs">Inventuren durchgefuehrt</p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Package size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Inventuren vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Starten Sie Ihre erste Bestandsaufnahme, um Soll- und Ist-Werte systematisch zu erfassen.</p>
          <Link to="/tools/inventory/counts" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><Plus size={16} /> Inventur starten</Link>
        </div>
      )}
    </div>
  );
}
