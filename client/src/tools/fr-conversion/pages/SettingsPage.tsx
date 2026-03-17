import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Settings, Plus, Trash2, Save } from 'lucide-react';
import {
  useFRStores, useFRSettings, useUpdateFRSettings,
  useFRRooms, useCreateFRRoom, useDeleteFRRoom,
} from '../../../hooks/useFrConversion';

export function SettingsPage() {
  const { data: stores } = useFRStores();
  const [storeId, setStoreId] = useState('');
  const { data: settings } = useFRSettings(storeId);
  const { data: rooms } = useFRRooms(storeId);
  const updateSettings = useUpdateFRSettings();
  const createRoom = useCreateFRRoom();
  const deleteRoom = useDeleteFRRoom();

  useEffect(() => { if (stores?.length && !storeId) setStoreId(stores[0].id); }, [stores, storeId]);

  // Settings form
  const [maxItems, setMaxItems] = useState(8);
  const [warningMin, setWarningMin] = useState(15);
  const [alertMin, setAlertMin] = useState(20);

  useEffect(() => {
    if (settings) {
      setMaxItems(settings.maxItems);
      setWarningMin(settings.warningMinutes);
      setAlertMin(settings.alertMinutes);
    }
  }, [settings]);

  // New room form
  const [newRoomNumber, setNewRoomNumber] = useState(1);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    if (rooms?.length) setNewRoomNumber(Math.max(...rooms.map((r: any) => r.number)) + 1);
  }, [rooms]);

  const handleSaveSettings = () => {
    updateSettings.mutate({ storeId, maxItems, warningMinutes: warningMin, alertMinutes: alertMin });
  };

  const handleAddRoom = () => {
    createRoom.mutate(
      { storeId, number: newRoomNumber, name: newRoomName || undefined },
      { onSuccess: () => { setNewRoomName(''); } },
    );
  };

  const handleDeleteRoom = (id: string, num: number) => {
    if (!confirm(`Kabine ${num} wirklich löschen?`)) return;
    deleteRoom.mutate(id);
  };

  return (
    <div className="p-lg max-w-3xl">
      <div className="flex items-center gap-md mb-xl">
        <Link to="/tools/fr-conversion" className="text-kore-mid hover:text-kore-ink"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Settings size={24} /> Einstellungen</h1>
        </div>
        {stores && stores.length > 1 && (
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small">
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {/* Store Settings */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <h2 className="font-display text-h3 text-kore-ink mb-md">Store-Einstellungen</h2>
        <div className="grid grid-cols-3 gap-md mb-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Max. Teile pro Kabine</label>
            <input type="number" value={maxItems} onChange={e => setMaxItems(parseInt(e.target.value) || 8)} min={1} max={30} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Warning (Min)</label>
            <input type="number" value={warningMin} onChange={e => setWarningMin(parseInt(e.target.value) || 15)} min={1} max={120} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Alert (Min)</label>
            <input type="number" value={alertMin} onChange={e => setAlertMin(parseInt(e.target.value) || 20)} min={1} max={120} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
        </div>
        <button onClick={handleSaveSettings} disabled={updateSettings.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
          <Save size={14} /> {updateSettings.isPending ? 'Speichern...' : 'Speichern'}
        </button>
      </div>

      {/* Rooms */}
      <div className="bg-kore-white border border-kore-border p-lg">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink">Kabinen ({rooms?.length || 0})</h2>
        </div>

        {/* Add Room */}
        <div className="flex items-end gap-sm mb-lg p-md bg-kore-bg border border-kore-border">
          <div className="flex-1">
            <label className="block text-small text-kore-mid mb-xs">Nummer</label>
            <input type="number" value={newRoomNumber} onChange={e => setNewRoomNumber(parseInt(e.target.value) || 1)} min={1} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div className="flex-1">
            <label className="block text-small text-kore-mid mb-xs">Name (optional)</label>
            <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="z.B. VIP, Barrierefrei..." className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <button onClick={handleAddRoom} disabled={createRoom.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Plus size={14} /> Hinzufügen
          </button>
        </div>

        {/* Room List */}
        <div className="space-y-sm">
          {rooms?.map((room: any) => (
            <div key={room.id} className="flex items-center gap-md p-md border border-kore-border">
              <div className="w-12 h-12 bg-kore-bg flex items-center justify-center text-lg font-bold text-kore-ink">
                {room.number}
              </div>
              <div className="flex-1">
                <div className="font-medium text-kore-ink">Kabine {room.number}</div>
                <div className="text-small text-kore-mid">{room.name || 'Standard'}</div>
              </div>
              <button onClick={() => handleDeleteRoom(room.id, room.number)} className="p-sm text-kore-mid hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {!rooms?.length && (
            <div className="text-center text-kore-mid p-lg">Noch keine Kabinen angelegt.</div>
          )}
        </div>
      </div>
    </div>
  );
}
