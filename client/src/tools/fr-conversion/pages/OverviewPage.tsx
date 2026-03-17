import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  DoorOpen, BarChart3, Settings, AlertTriangle, Clock, ShoppingBag, Plus, Minus,
  LogIn, LogOut, X, UserPlus, Package, RefreshCw,
} from 'lucide-react';
import {
  useFRStores, useFRSettings, useFRRooms, useFRActiveSessions,
  useCheckIn, useCheckOut, useAddItems, useChangeStaff, useCancelSession,
  useFRUsers,
} from '../../../hooks/useFrConversion';

export function OverviewPage() {
  const { data: stores } = useFRStores();
  const [storeId, setStoreId] = useState('');
  const { data: settings } = useFRSettings(storeId);
  const { data: rooms } = useFRRooms(storeId);
  const { data: activeSessions, refetch: refetchSessions } = useFRActiveSessions(storeId);
  const { data: users } = useFRUsers();

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const addItems = useAddItems();
  const changeStaff = useChangeStaff();
  const cancelSession = useCancelSession();

  // Auto-select first store
  useEffect(() => { if (stores?.length && !storeId) setStoreId(stores[0].id); }, [stores, storeId]);

  // Modal states
  const [checkInModal, setCheckInModal] = useState<{ roomId: string; roomNumber: number } | null>(null);
  const [roomOptionsModal, setRoomOptionsModal] = useState<{ session: any; room: any } | null>(null);
  const [checkOutModal, setCheckOutModal] = useState<{ session: any; room: any } | null>(null);
  const [addItemsModal, setAddItemsModal] = useState<{ session: any } | null>(null);
  const [changeStaffModal, setChangeStaffModal] = useState<{ session: any } | null>(null);

  // Check-in form
  const [ciItems, setCiItems] = useState(1);
  const [ciStaff, setCiStaff] = useState('');
  const [ciNotes, setCiNotes] = useState('');

  // Check-out form
  const [coReturned, setCoReturned] = useState(0);
  const [coPurchased, setCoPurchased] = useState(0);
  const [coShrinkageConfirmed, setCoShrinkageConfirmed] = useState(false);

  // Add items form
  const [aiCount, setAiCount] = useState(1);

  // Change staff form
  const [csStaffId, setCsStaffId] = useState('');

  // Timer for room durations
  const [, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(c => c + 1), 30000); return () => clearInterval(t); }, []);

  const maxItems = settings?.maxItems || 8;
  const warningMin = settings?.warningMinutes || 15;
  const alertMin = settings?.alertMinutes || 20;

  // Compute room statuses
  const roomData = useMemo(() => {
    if (!rooms) return [];
    return rooms.map((room: any) => {
      const session = activeSessions?.find((s: any) => s.roomId === room.id);
      let status = 'available';
      let duration = 0;
      if (session) {
        duration = Math.max(0, Math.floor((Date.now() - new Date(session.checkInAt).getTime()) / 60000));
        status = duration >= alertMin ? 'alert' : duration >= warningMin ? 'warning' : 'occupied';
      }
      return { ...room, session, status, duration };
    });
  }, [rooms, activeSessions, warningMin, alertMin]);

  // Stats
  const available = roomData.filter(r => r.status === 'available').length;
  const occupied = roomData.filter(r => r.status !== 'available').length;
  const alerts = roomData.filter(r => r.status === 'alert' || r.status === 'warning').length;

  const handleRoomClick = (room: any) => {
    if (room.session) {
      setRoomOptionsModal({ session: room.session, room });
    } else {
      setCiItems(1); setCiStaff(''); setCiNotes('');
      setCheckInModal({ roomId: room.id, roomNumber: room.number });
    }
  };

  const handleCheckIn = () => {
    if (!checkInModal) return;
    checkIn.mutate(
      { storeId, roomId: checkInModal.roomId, staffId: ciStaff || undefined, itemsIn: ciItems, notes: ciNotes || undefined },
      { onSuccess: () => { setCheckInModal(null); refetchSessions(); } },
    );
  };

  const openCheckOut = () => {
    if (!roomOptionsModal) return;
    const s = roomOptionsModal.session;
    setCoReturned(s.itemsIn);
    setCoPurchased(0);
    setCoShrinkageConfirmed(false);
    setCheckOutModal({ session: s, room: roomOptionsModal.room });
    setRoomOptionsModal(null);
  };

  const coShrinkage = checkOutModal ? checkOutModal.session.itemsIn - coReturned - coPurchased : 0;

  const handleCheckOut = () => {
    if (!checkOutModal) return;
    if (coShrinkage > 0 && !coShrinkageConfirmed) return;
    checkOut.mutate(
      { id: checkOutModal.session.id, itemsReturned: coReturned, itemsPurchased: coPurchased },
      { onSuccess: () => { setCheckOutModal(null); refetchSessions(); } },
    );
  };

  const handleAddItems = () => {
    if (!addItemsModal) return;
    addItems.mutate(
      { id: addItemsModal.session.id, additionalItems: aiCount },
      { onSuccess: () => { setAddItemsModal(null); refetchSessions(); } },
    );
  };

  const handleChangeStaff = () => {
    if (!changeStaffModal) return;
    changeStaff.mutate(
      { id: changeStaffModal.session.id, staffId: csStaffId || null },
      { onSuccess: () => { setChangeStaffModal(null); refetchSessions(); } },
    );
  };

  const handleCancel = () => {
    if (!roomOptionsModal) return;
    if (!confirm('Session wirklich abbrechen?')) return;
    cancelSession.mutate(roomOptionsModal.session.id, {
      onSuccess: () => { setRoomOptionsModal(null); refetchSessions(); },
    });
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'available': return 'border-green-200 bg-green-50';
      case 'occupied': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'alert': return 'border-red-200 bg-red-50 animate-pulse';
      default: return '';
    }
  };

  const dotColor = (s: string) => {
    switch (s) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'warning': return 'bg-amber-500';
      case 'alert': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <DoorOpen size={24} /> Fitting Room Management
          </h1>
          <p className="text-body text-kore-mid mt-xs">Umkleidekabinen live verwalten</p>
        </div>
        <div className="flex items-center gap-sm">
          {stores && stores.length > 1 && (
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small">
              {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={() => refetchSessions()} className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink">
            <RefreshCw size={16} />
          </button>
          <Link to="/tools/fr-conversion/dashboard" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <BarChart3 size={14} /> Reports
          </Link>
          <Link to="/tools/fr-conversion/settings" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <Settings size={14} /> Einstellungen
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-md mb-lg">
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-green-600">{available}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Frei</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-blue-600">{occupied}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Belegt</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-amber-600">{alerts}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Alerts</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-kore-brass">-</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Conversion</div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-md">
        {roomData.map((room: any) => (
          <button
            key={room.id}
            onClick={() => handleRoomClick(room)}
            className={`relative border-2 p-lg text-left transition-all hover:shadow-md ${statusColor(room.status)}`}
          >
            <div className="flex items-center justify-between mb-sm">
              <span className="text-2xl font-bold text-kore-ink">{room.number}</span>
              <span className={`w-3 h-3 rounded-full ${dotColor(room.status)}`} />
            </div>
            {room.status === 'available' ? (
              <span className="text-small text-green-600 font-medium">Frei</span>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-kore-mid">
                  <ShoppingBag size={12} /> {room.session.itemsIn} Teile
                </div>
                <div className="flex items-center gap-1 text-xs text-kore-mid">
                  <Clock size={12} /> {room.duration} Min
                </div>
                {room.session.staff && (
                  <div className="text-xs text-kore-brass font-medium mt-1 truncate">
                    {room.session.staff.name}
                  </div>
                )}
                {room.session.notes && (
                  <div className="text-xs text-amber-600 truncate">{room.session.notes}</div>
                )}
              </div>
            )}
            {room.status === 'alert' && (
              <div className="absolute top-1 right-1">
                <span className="text-red-500"><AlertTriangle size={14} /></span>
              </div>
            )}
          </button>
        ))}
      </div>

      {!rooms?.length && (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-kore-mid mt-lg">
          Noch keine Kabinen angelegt.{' '}
          <Link to="/tools/fr-conversion/settings" className="text-kore-brass underline">Einstellungen</Link>
        </div>
      )}

      {/* ── CHECK-IN MODAL ── */}
      {checkInModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setCheckInModal(null)}>
          <div className="bg-kore-white w-full max-w-md p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Check-In Kabine {checkInModal.roomNumber}</h2>
              <button onClick={() => setCheckInModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>

            <label className="block text-small text-kore-mid mb-xs">Anzahl Teile</label>
            <div className="flex items-center justify-center gap-lg mb-md">
              <button onClick={() => setCiItems(Math.max(1, ciItems - 1))} className="w-14 h-14 border border-kore-border text-xl font-bold flex items-center justify-center hover:bg-kore-bg"><Minus size={20} /></button>
              <span className="text-4xl font-bold text-kore-ink w-16 text-center">{ciItems}</span>
              <button onClick={() => setCiItems(Math.min(maxItems, ciItems + 1))} className="w-14 h-14 border border-kore-border text-xl font-bold flex items-center justify-center hover:bg-kore-bg"><Plus size={20} /></button>
            </div>
            <div className="text-center text-xs text-kore-mid mb-md">Maximum: {maxItems}</div>

            <div className="flex justify-center gap-sm mb-lg">
              {[1, 2, 3, 4, 5, 6].filter(n => n <= maxItems).map(n => (
                <button key={n} onClick={() => setCiItems(n)} className={`w-12 h-12 border text-sm font-bold ${ciItems === n ? 'border-kore-brass bg-kore-brass/10 text-kore-brass' : 'border-kore-border text-kore-mid hover:text-kore-ink'}`}>{n}</button>
              ))}
            </div>

            <label className="block text-small text-kore-mid mb-xs">Mitarbeiter</label>
            <select value={ciStaff} onChange={e => setCiStaff(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body mb-md">
              <option value="">-- Kein Mitarbeiter --</option>
              {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <label className="block text-small text-kore-mid mb-xs">Notiz (optional)</label>
            <input value={ciNotes} onChange={e => setCiNotes(e.target.value)} placeholder="z.B. VIP, sucht Gr. M..." className="w-full border border-kore-border px-md py-sm text-body mb-lg" />

            <button onClick={handleCheckIn} disabled={checkIn.isPending} className="w-full flex items-center justify-center gap-sm px-md py-md bg-kore-ink text-kore-white font-medium hover:opacity-90 disabled:opacity-50">
              <LogIn size={18} /> Check-In
            </button>
          </div>
        </div>
      )}

      {/* ── ROOM OPTIONS MODAL ── */}
      {roomOptionsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setRoomOptionsModal(null)}>
          <div className="bg-kore-white w-full max-w-md p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Kabine {roomOptionsModal.room.number}</h2>
              <button onClick={() => setRoomOptionsModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>

            <div className="bg-kore-bg border border-kore-border p-md mb-lg space-y-2 text-small">
              <div className="flex justify-between"><span className="text-kore-mid">Dauer</span><span className="font-medium">{roomOptionsModal.room.duration} Min</span></div>
              <div className="flex justify-between"><span className="text-kore-mid">Teile</span><span className="font-medium">{roomOptionsModal.session.itemsIn}</span></div>
              {roomOptionsModal.session.staff && (
                <div className="flex justify-between"><span className="text-kore-mid">Mitarbeiter</span><span className="font-medium">{roomOptionsModal.session.staff.name}</span></div>
              )}
              {roomOptionsModal.session.notes && (
                <div className="flex justify-between"><span className="text-kore-mid">Notiz</span><span className="font-medium">{roomOptionsModal.session.notes}</span></div>
              )}
            </div>

            <div className="space-y-sm">
              <button onClick={() => { setAiCount(1); setAddItemsModal({ session: roomOptionsModal.session }); setRoomOptionsModal(null); }} className="w-full flex items-center justify-center gap-sm px-md py-md border border-amber-300 bg-amber-50 text-amber-700 font-medium hover:bg-amber-100">
                <Package size={18} /> Teile nachreichen
              </button>
              <button onClick={() => { setCsStaffId(roomOptionsModal.session.staffId || ''); setChangeStaffModal({ session: roomOptionsModal.session }); setRoomOptionsModal(null); }} className="w-full flex items-center justify-center gap-sm px-md py-md border border-kore-border text-kore-ink font-medium hover:bg-kore-bg">
                <UserPlus size={18} /> Mitarbeiter wechseln
              </button>
              <button onClick={openCheckOut} className="w-full flex items-center justify-center gap-sm px-md py-md bg-green-600 text-white font-medium hover:bg-green-700">
                <LogOut size={18} /> Check-Out
              </button>
              <button onClick={handleCancel} className="w-full flex items-center justify-center gap-sm px-md py-md bg-red-50 border border-red-200 text-red-600 font-medium hover:bg-red-100 mt-sm">
                <X size={18} /> Session abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHECK-OUT MODAL ── */}
      {checkOutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setCheckOutModal(null)}>
          <div className="bg-kore-white w-full max-w-md p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Check-Out Kabine {checkOutModal.room.number}</h2>
              <button onClick={() => setCheckOutModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>

            <div className="bg-kore-bg border border-kore-border p-md mb-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-kore-mid">Teile rein</span>
                <span className="text-xl font-bold">{checkOutModal.session.itemsIn}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kore-mid">Zurückgegeben</span>
                <input type="number" value={coReturned} onChange={e => setCoReturned(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={checkOutModal.session.itemsIn} className="w-20 border border-kore-border px-sm py-xs text-center text-lg font-bold" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kore-mid">Gekauft</span>
                <input type="number" value={coPurchased} onChange={e => setCoPurchased(Math.max(0, parseInt(e.target.value) || 0))} min={0} max={checkOutModal.session.itemsIn} className="w-20 border border-kore-border px-sm py-xs text-center text-lg font-bold" />
              </div>
              <div className={`flex justify-between items-center pt-2 border-t ${coShrinkage > 0 ? 'text-red-600 font-bold' : ''}`}>
                <span>Differenz (Schwund)</span>
                <span className="text-xl font-bold">{coShrinkage}</span>
              </div>
            </div>

            {coShrinkage > 0 && (
              <div className="bg-red-50 border border-red-200 p-md mb-lg">
                <div className="flex items-center gap-sm text-red-600 font-bold mb-sm">
                  <span className="text-red-500"><AlertTriangle size={18} /></span> Schwund erkannt!
                </div>
                <div className="text-center text-2xl font-bold text-red-600 my-sm">{coShrinkage} Teile fehlen</div>
                <label className="flex items-center gap-sm text-small text-kore-mid cursor-pointer mt-sm">
                  <input type="checkbox" checked={coShrinkageConfirmed} onChange={e => setCoShrinkageConfirmed(e.target.checked)} className="w-5 h-5 accent-red-500" />
                  Ich bestätige den Schwund
                </label>
              </div>
            )}

            <button
              onClick={handleCheckOut}
              disabled={checkOut.isPending || (coShrinkage > 0 && !coShrinkageConfirmed)}
              className="w-full flex items-center justify-center gap-sm px-md py-md bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <LogOut size={18} /> Check-Out bestätigen
            </button>
          </div>
        </div>
      )}

      {/* ── ADD ITEMS MODAL ── */}
      {addItemsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setAddItemsModal(null)}>
          <div className="bg-kore-white w-full max-w-md p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Teile nachreichen</h2>
              <button onClick={() => setAddItemsModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>
            <p className="text-small text-kore-mid mb-md">Aktuell: {addItemsModal.session.itemsIn} Teile</p>
            <div className="flex items-center justify-center gap-lg mb-lg">
              <button onClick={() => setAiCount(Math.max(1, aiCount - 1))} className="w-14 h-14 border border-kore-border text-xl font-bold flex items-center justify-center hover:bg-kore-bg"><Minus size={20} /></button>
              <span className="text-4xl font-bold text-kore-ink w-16 text-center">{aiCount}</span>
              <button onClick={() => setAiCount(aiCount + 1)} className="w-14 h-14 border border-kore-border text-xl font-bold flex items-center justify-center hover:bg-kore-bg"><Plus size={20} /></button>
            </div>
            <button onClick={handleAddItems} disabled={addItems.isPending} className="w-full flex items-center justify-center gap-sm px-md py-md bg-kore-ink text-kore-white font-medium hover:opacity-90 disabled:opacity-50">
              <Plus size={18} /> Hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* ── CHANGE STAFF MODAL ── */}
      {changeStaffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setChangeStaffModal(null)}>
          <div className="bg-kore-white w-full max-w-md p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Mitarbeiter wechseln</h2>
              <button onClick={() => setChangeStaffModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>
            <select value={csStaffId} onChange={e => setCsStaffId(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body mb-lg">
              <option value="">-- Kein Mitarbeiter --</option>
              {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button onClick={handleChangeStaff} disabled={changeStaff.isPending} className="w-full flex items-center justify-center gap-sm px-md py-md bg-kore-ink text-kore-white font-medium hover:opacity-90 disabled:opacity-50">
              Speichern
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
