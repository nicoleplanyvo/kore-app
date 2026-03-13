import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, LayoutGrid } from 'lucide-react';
import { useFloorStores, useFloorSnapshot } from '../../../hooks/useFloor';

const STATUS_COLORS: Record<string, string> = {
  ON_FLOOR: 'bg-emerald-500',
  ON_BREAK: 'bg-amber-500',
  OFF_FLOOR: 'bg-kore-mid',
  CASHIER: 'bg-blue-500',
};

const STATUS_LABELS: Record<string, string> = {
  ON_FLOOR: 'Auf der Fläche',
  ON_BREAK: 'Pause',
  OFF_FLOOR: 'Nicht auf Fläche',
  CASHIER: 'Kasse',
};

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useFloorStores();
  const { data: snapshots, isLoading } = useFloorSnapshot(storeId || undefined);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/live-floor" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Live Floor</h1>
          <p className="text-body text-kore-mid mt-xs">Echtzeit-Überblick der Verkaufsfläche</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Link to="/tools/live-floor/zones" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <LayoutGrid size={14} /> Zonen verwalten
        </Link>
        <Link to="/tools/live-floor/board" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <Users size={14} /> Position Board
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !snapshots?.length ? (
        <div className="text-body text-kore-mid">Keine Daten verfügbar.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          {snapshots.map((snap: any) => (
            <div key={snap.store.id} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-medium text-kore-ink">{snap.store.name}</h3>
                <span className="text-small text-kore-mid">{snap.store.city}</span>
              </div>
              <div className="flex items-center gap-lg mb-md">
                <div className="flex items-center gap-xs text-small text-kore-mid">
                  <MapPin size={14} /> {snap.zones} Zonen
                </div>
                <div className="flex items-center gap-xs text-small text-kore-mid">
                  <Users size={14} /> {snap.activePositions} aktiv
                </div>
              </div>
              <div className="flex gap-sm flex-wrap">
                {Object.entries(snap.statusCounts as Record<string, number>).map(([status, count]) => (
                  <div key={status} className="flex items-center gap-xs text-small">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-kore-mid'}`} />
                    <span className="text-kore-mid">{STATUS_LABELS[status] ?? status}: {count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
