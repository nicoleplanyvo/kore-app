import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFloorStores, useFloorPositions, useUpdateFloorPosition } from '../../../hooks/useFloor';

const STATUS_LABELS: Record<string, string> = {
  ON_FLOOR: 'Auf der Fläche',
  ON_BREAK: 'Pause',
  OFF_FLOOR: 'Nicht auf Fläche',
  CASHIER: 'Kasse',
};

const STATUS_STYLES: Record<string, string> = {
  ON_FLOOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_BREAK: 'bg-amber-50 text-amber-700 border-amber-200',
  OFF_FLOOR: 'bg-kore-bg text-kore-mid border-kore-border',
  CASHIER: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function PositionBoardPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useFloorStores();
  const { data: positions, isLoading } = useFloorPositions(storeId || undefined);
  const updatePosition = useUpdateFloorPosition();

  const handleStatusChange = (id: string, status: string) => {
    if (status === 'END') {
      updatePosition.mutate({ id, endedAt: new Date().toISOString() });
    } else {
      updatePosition.mutate({ id, status });
    }
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/live-floor" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Position Board</h1>
          <p className="text-body text-kore-mid mt-xs">Aktuelle Positionen der Mitarbeiter</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !positions?.length ? (
        <div className="text-body text-kore-mid">Keine aktiven Positionen.</div>
      ) : (
        <div className="space-y-sm">
          {positions.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between bg-kore-white border border-kore-border p-md">
              <div>
                <span className="text-body font-medium text-kore-ink">{p.userName}</span>
                {p.zone && <span className="text-small text-kore-mid ml-md">{p.zone.name}</span>}
                {p.store && <span className="text-small text-kore-faint ml-md">{p.store.name}</span>}
                <div className="text-small text-kore-faint mt-xs">
                  Seit {new Date(p.startedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  {p.notes && <span className="ml-md">{p.notes}</span>}
                </div>
              </div>
              <div className="flex items-center gap-sm">
                <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[p.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
                <select
                  value=""
                  onChange={(e) => handleStatusChange(p.id, e.target.value)}
                  className="border border-kore-border px-sm py-xs text-small bg-kore-white"
                >
                  <option value="">Ändern...</option>
                  {Object.entries(STATUS_LABELS).filter(([k]) => k !== p.status).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                  <option value="END">Schicht beenden</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
