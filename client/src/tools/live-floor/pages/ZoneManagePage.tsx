import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useFloorStores, useFloorZones, useCreateFloorZone, useUpdateFloorZone } from '../../../hooks/useFloor';

export function ZoneManagePage() {
  const [storeId, setStoreId] = useState('');
  const [newName, setNewName] = useState('');
  const { data: stores } = useFloorStores();
  const { data: zones, isLoading } = useFloorZones(storeId || undefined);
  const createZone = useCreateFloorZone();
  const updateZone = useUpdateFloorZone();

  const handleCreate = () => {
    if (!storeId || !newName.trim()) return;
    createZone.mutate({ storeId, name: newName.trim() }, { onSuccess: () => setNewName('') });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/live-floor" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Zonen verwalten</h1>
          <p className="text-body text-kore-mid mt-xs">Verkaufsflächen-Zonen erstellen und bearbeiten</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Store wählen...</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {storeId && (
        <div className="flex gap-sm mb-xl">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Neue Zone..." className="border border-kore-border px-md py-sm text-small flex-1" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <button onClick={handleCreate} disabled={!newName.trim()} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-dark disabled:opacity-30 flex items-center gap-xs">
            <Plus size={14} /> Erstellen
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !zones?.length ? (
        <div className="text-body text-kore-mid">{storeId ? 'Keine Zonen vorhanden.' : 'Bitte Store wählen.'}</div>
      ) : (
        <div className="space-y-sm">
          {zones.map((z: any) => (
            <div key={z.id} className="flex items-center justify-between bg-kore-white border border-kore-border p-md">
              <div>
                <span className="text-body font-medium text-kore-ink">{z.name}</span>
                <span className="text-small text-kore-faint ml-md">{z._count?.positions ?? 0} Positionen</span>
                {z.store && <span className="text-small text-kore-mid ml-md">{z.store.name}</span>}
              </div>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => updateZone.mutate({ id: z.id, isActive: !z.isActive })}
                  className={`text-small px-sm py-xs border ${z.isActive ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-kore-border text-kore-mid bg-kore-bg'}`}
                >
                  {z.isActive ? 'Aktiv' : 'Inaktiv'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
