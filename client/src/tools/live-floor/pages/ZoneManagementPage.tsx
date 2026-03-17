import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users, UserPlus } from 'lucide-react';
import {
  useFloorStores,
  useFloorZones,
  useFloorUsers,
  useFloorAssignments,
  useCreateFloorZone,
  useUpdateFloorZone,
  useDeleteFloorZone,
  useUpdateZoneFrequency,
  useBulkAssignFloor,
} from '../../../hooks/useFloor';

export function ZoneManagementPage() {
  const [storeId, setStoreId] = useState('');
  const [newName, setNewName] = useState('');
  const [newMinStaff, setNewMinStaff] = useState(1);
  const [newMaxStaff, setNewMaxStaff] = useState(5);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editCustomerCount, setEditCustomerCount] = useState(0);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignZoneId, setAssignZoneId] = useState('');

  const { data: stores } = useFloorStores();
  const { data: zones, isLoading } = useFloorZones(storeId || undefined, true);
  const { data: users } = useFloorUsers(storeId || undefined);
  const { data: assignments } = useFloorAssignments(storeId || undefined);

  const createZone = useCreateFloorZone();
  const updateZone = useUpdateFloorZone();
  const deleteZone = useDeleteFloorZone();
  const updateFrequency = useUpdateZoneFrequency();
  const bulkAssign = useBulkAssignFloor();

  const handleCreate = () => {
    if (!storeId || !newName.trim()) return;
    createZone.mutate(
      { storeId, name: newName.trim(), minStaff: newMinStaff, maxStaff: newMaxStaff },
      { onSuccess: () => { setNewName(''); setNewMinStaff(1); setNewMaxStaff(5); } },
    );
  };

  const handleFrequencyUpdate = (zoneId: string) => {
    updateFrequency.mutate({ zoneId, customerCount: editCustomerCount });
    setEditingZone(null);
  };

  const handleAssign = () => {
    if (!storeId || !assignUserId) return;
    const user = (users ?? []).find((u: any) => u.id === assignUserId);
    if (!user) return;
    bulkAssign.mutate({
      storeId,
      assignments: [{ userId: user.id, userName: user.name, zoneId: assignZoneId || null, status: 'ON_FLOOR' }],
    }, { onSuccess: () => { setAssignUserId(''); setAssignZoneId(''); } });
  };

  // Zuweisungen pro Zone gruppieren
  const getZoneAssignments = (zoneId: string) =>
    (assignments ?? []).filter((a: any) => a.zoneId === zoneId);

  const unassigned = (assignments ?? []).filter((a: any) => !a.zoneId);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/live-floor" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Zonen verwalten</h1>
          <p className="text-body text-kore-mid mt-xs">Zonen erstellen, Personal zuweisen, Kundenfrequenz pflegen</p>
        </div>
      </div>

      {/* Store-Selektor */}
      <div className="flex gap-md mb-xl">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white min-w-[200px]"
        >
          <option value="">Store waehlen...</option>
          {(stores ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {storeId && (
        <>
          {/* Neue Zone erstellen */}
          <div className="bg-kore-white border border-kore-border p-lg mb-xl">
            <h2 className="text-body font-medium text-kore-ink mb-md">Neue Zone erstellen</h2>
            <div className="flex gap-sm items-end flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Erdgeschoss, Kasse, Umkleiden..."
                  className="border border-kore-border px-md py-sm text-small w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="w-24">
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Min MA</label>
                <input
                  type="number"
                  value={newMinStaff}
                  onChange={(e) => setNewMinStaff(Number(e.target.value))}
                  min={0}
                  className="border border-kore-border px-md py-sm text-small w-full"
                />
              </div>
              <div className="w-24">
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Max MA</label>
                <input
                  type="number"
                  value={newMaxStaff}
                  onChange={(e) => setNewMaxStaff(Number(e.target.value))}
                  min={1}
                  className="border border-kore-border px-md py-sm text-small w-full"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createZone.isPending}
                className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass disabled:opacity-30 flex items-center gap-xs transition-colors"
              >
                <Plus size={14} /> Erstellen
              </button>
            </div>
          </div>

          {/* MA zuweisen */}
          <div className="bg-kore-white border border-kore-border p-lg mb-xl">
            <h2 className="text-body font-medium text-kore-ink mb-md">Mitarbeiter zuweisen</h2>
            <div className="flex gap-sm items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Mitarbeiter</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="border border-kore-border px-md py-sm text-small w-full bg-kore-white"
                >
                  <option value="">MA waehlen...</option>
                  {(users ?? []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Zone</label>
                <select
                  value={assignZoneId}
                  onChange={(e) => setAssignZoneId(e.target.value)}
                  className="border border-kore-border px-md py-sm text-small w-full bg-kore-white"
                >
                  <option value="">Keine Zone (frei)</option>
                  {(zones ?? []).filter((z: any) => z.isActive).map((z: any) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAssign}
                disabled={!assignUserId || bulkAssign.isPending}
                className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass disabled:opacity-30 flex items-center gap-xs transition-colors"
              >
                <UserPlus size={14} /> Zuweisen
              </button>
            </div>
          </div>

          {/* Nicht zugewiesene MA */}
          {unassigned.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-lg mb-xl">
              <h3 className="text-small font-medium text-amber-800 mb-sm">Ohne Zone ({unassigned.length})</h3>
              <div className="flex flex-wrap gap-sm">
                {unassigned.map((a: any) => (
                  <span key={a.id} className="text-small bg-kore-white border border-amber-200 px-md py-xs text-amber-800">
                    {a.userName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Zonen-Liste */}
          {isLoading ? (
            <div className="text-body text-kore-mid">Lade Zonen...</div>
          ) : !(zones ?? []).length ? (
            <div className="text-body text-kore-mid">Keine Zonen vorhanden. Erstellen Sie eine neue Zone.</div>
          ) : (
            <div className="space-y-md">
              {(zones ?? []).map((z: any) => {
                const zAssignments = getZoneAssignments(z.id);
                return (
                  <div key={z.id} className={`bg-kore-white border border-kore-border p-lg ${!z.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between mb-md">
                      <div className="flex items-center gap-md">
                        <h3 className="text-body font-medium text-kore-ink">{z.name}</h3>
                        <span className={`text-small px-sm py-xs border ${z.isActive ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-kore-border text-kore-mid bg-kore-bg'}`}>
                          {z.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <span className="text-small text-kore-faint">Min: {z.minStaff} | Max: {z.maxStaff}</span>
                      </div>
                      <div className="flex items-center gap-sm">
                        <button
                          onClick={() => updateZone.mutate({ id: z.id, isActive: !z.isActive })}
                          className="text-small px-sm py-xs border border-kore-border text-kore-mid hover:bg-kore-bg transition-colors"
                        >
                          {z.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                        <button
                          onClick={() => deleteZone.mutate(z.id)}
                          className="text-small px-sm py-xs border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Kundenfrequenz */}
                    <div className="flex items-center gap-md mb-md">
                      <span className="text-small text-kore-mid">Kunden:</span>
                      {editingZone === z.id ? (
                        <div className="flex items-center gap-sm">
                          <input
                            type="number"
                            value={editCustomerCount}
                            onChange={(e) => setEditCustomerCount(Number(e.target.value))}
                            min={0}
                            className="border border-kore-border px-sm py-xs text-small w-20"
                            autoFocus
                          />
                          <button
                            onClick={() => handleFrequencyUpdate(z.id)}
                            className="text-small px-sm py-xs bg-kore-ink text-kore-white hover:bg-kore-brass transition-colors"
                          >
                            Speichern
                          </button>
                          <button onClick={() => setEditingZone(null)} className="text-small px-sm py-xs text-kore-mid">
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingZone(z.id); setEditCustomerCount(z.customerCount ?? 0); }}
                          className="text-small font-medium text-kore-ink hover:text-kore-brass transition-colors underline"
                        >
                          {z.customerCount ?? 0}
                        </button>
                      )}
                    </div>

                    {/* Zugewiesene MA */}
                    <div className="flex items-center gap-xs text-small text-kore-mid mb-sm">
                      <Users size={14} /> {zAssignments.length} Mitarbeiter zugewiesen
                    </div>
                    {zAssignments.length > 0 && (
                      <div className="flex flex-wrap gap-sm">
                        {zAssignments.map((a: any) => (
                          <span key={a.id} className="text-small bg-kore-bg border border-kore-border px-md py-xs text-kore-ink">
                            {a.userName}
                            <span className="text-kore-faint ml-sm">
                              {a.status === 'ON_FLOOR' ? 'Flaeche' : a.status === 'ON_BREAK' ? 'Pause' : a.status === 'CASHIER' ? 'Kasse' : 'Abwesend'}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {!storeId && (
        <div className="text-body text-kore-mid">Bitte waehlen Sie einen Store aus, um Zonen zu verwalten.</div>
      )}
    </div>
  );
}
