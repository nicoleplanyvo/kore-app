import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ArrowRightLeft, Save, Trash2 } from 'lucide-react';
import { useShifts, useUpdateShift, useDeleteShift, useCreateSwapRequest, useUpdateSwapRequest, useShiftUsers } from '../../../hooks/useShiftPlanning';

const STATUS_LABELS: Record<string, string> = { PLANNED: 'Geplant', CONFIRMED: 'Bestaetigt', SWAPPED: 'Getauscht', CANCELLED: 'Storniert' };
const STATUS_COLORS: Record<string, string> = { PLANNED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-emerald-100 text-emerald-700', SWAPPED: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-red-100 text-red-700' };
const SWAP_LABELS: Record<string, string> = { PENDING: 'Ausstehend', APPROVED: 'Genehmigt', REJECTED: 'Abgelehnt' };
const SWAP_COLORS: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-emerald-100 text-emerald-700', REJECTED: 'bg-red-100 text-red-700' };

export function ShiftDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: allShifts, isLoading } = useShifts({});
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const createSwap = useCreateSwapRequest();
  const updateSwap = useUpdateSwapRequest();

  const shift = allShifts?.find((s: any) => s.id === id);
  const { data: users } = useShiftUsers(shift?.storeId);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ startTime: '', endTime: '', role: '', note: '' });
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [swapUserId, setSwapUserId] = useState('');

  const startEditing = () => {
    if (!shift) return;
    setForm({ startTime: shift.startTime, endTime: shift.endTime, role: shift.role ?? '', note: '' });
    setEditing(true);
  };

  const handleSave = () => {
    updateShift.mutate({ id, ...form }, { onSuccess: () => setEditing(false) });
  };

  const handleDelete = () => {
    if (!confirm('Schicht wirklich loeschen?')) return;
    deleteShift.mutate(id!, { onSuccess: () => navigate('/tools/shift-planning') });
  };

  const handleSwapRequest = () => {
    createSwap.mutate({ shiftEntryId: id, swapWithUserId: swapUserId || undefined }, { onSuccess: () => { setShowSwapForm(false); setSwapUserId(''); } });
  };

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!shift) return (
    <div className="p-xl max-w-3xl">
      <Link to="/tools/shift-planning" className="flex items-center gap-xs text-kore-mid hover:text-kore-ink text-small mb-lg"><ArrowLeft size={16} /> Zurueck</Link>
      <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Schicht nicht gefunden.</div>
    </div>
  );

  const dateStr = shift.date ? new Date(shift.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '';

  return (
    <div className="p-xl max-w-3xl">
      <Link to="/tools/shift-planning" className="flex items-center gap-xs text-kore-mid hover:text-kore-ink text-small mb-lg"><ArrowLeft size={16} /> Zurueck zum Wochenplan</Link>

      <div className="bg-kore-white border border-kore-border p-xl mb-lg">
        <div className="flex items-start justify-between mb-lg">
          <div>
            <h1 className="font-display text-h2 text-kore-ink">Schicht: {shift.user?.name ?? '---'}</h1>
            <p className="text-body text-kore-mid mt-xs">{dateStr}</p>
          </div>
          <span className={`px-md py-xs text-small ${STATUS_COLORS[shift.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[shift.status] ?? shift.status}</span>
        </div>

        {editing ? (
          <div className="space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Beginn</label>
                <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Ende</label>
                <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Rolle</label>
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Notiz</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div className="flex gap-sm">
              <button onClick={handleSave} disabled={updateShift.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"><Save size={14} /> Speichern</button>
              <button onClick={() => setEditing(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid">Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="space-y-md">
            <div className="grid grid-cols-3 gap-lg">
              <div>
                <span className="text-caption text-kore-mid uppercase tracking-widest">Beginn</span>
                <div className="font-display text-h3 text-kore-ink mt-xs flex items-center gap-xs"><Clock size={16} /> {shift.startTime}</div>
              </div>
              <div>
                <span className="text-caption text-kore-mid uppercase tracking-widest">Ende</span>
                <div className="font-display text-h3 text-kore-ink mt-xs flex items-center gap-xs"><Clock size={16} /> {shift.endTime}</div>
              </div>
              <div>
                <span className="text-caption text-kore-mid uppercase tracking-widest">Rolle</span>
                <div className="text-body text-kore-ink mt-xs">{shift.role || '---'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-lg">
              <div>
                <span className="text-caption text-kore-mid uppercase tracking-widest">Store</span>
                <div className="text-body text-kore-ink mt-xs">{shift.store?.name ?? '---'}</div>
              </div>
              <div>
                <span className="text-caption text-kore-mid uppercase tracking-widest">Mitarbeiter</span>
                <div className="text-body text-kore-ink mt-xs">{shift.user?.name ?? '---'}</div>
              </div>
            </div>
            <div className="flex gap-sm pt-md border-t border-kore-border">
              <button onClick={startEditing} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"><Save size={14} /> Bearbeiten</button>
              <button onClick={() => setShowSwapForm(!showSwapForm)} className="flex items-center gap-xs px-md py-sm border border-[#9E8460] text-[#9E8460] text-small hover:bg-[#9E8460] hover:text-white transition-colors"><ArrowRightLeft size={14} /> Tausch anfragen</button>
              <button onClick={handleDelete} className="flex items-center gap-xs px-md py-sm border border-red-300 text-red-600 text-small hover:bg-red-50"><Trash2 size={14} /> Loeschen</button>
            </div>
          </div>
        )}
      </div>

      {/* Swap Request Form */}
      {showSwapForm && (
        <div className="bg-kore-white border border-[#9E8460] p-lg mb-lg">
          <h3 className="font-display text-h3 text-kore-ink mb-md">Schichttausch anfragen</h3>
          <div className="mb-md">
            <label className="block text-small text-kore-mid mb-xs">Tauschen mit (optional)</label>
            <select value={swapUserId} onChange={e => setSwapUserId(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
              <option value="">-- Offen fuer alle --</option>
              {users?.filter((u: any) => u.id !== shift.userId).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="flex gap-sm">
            <button onClick={handleSwapRequest} disabled={createSwap.isPending} className="px-md py-sm bg-[#9E8460] text-white text-small hover:opacity-90 disabled:opacity-50">Anfrage senden</button>
            <button onClick={() => setShowSwapForm(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Existing Swap Requests */}
      {shift.swaps && shift.swaps.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl">
          <h3 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><ArrowRightLeft size={18} /> Tausch-Anfragen</h3>
          <div className="space-y-sm">
            {shift.swaps.map((sw: any) => (
              <div key={sw.id} className="border border-kore-border p-md flex items-center justify-between">
                <div>
                  <span className="text-body text-kore-ink">Anfrage von {sw.requester?.name ?? sw.requestedBy}</span>
                  {sw.swapWithUserId && <span className="text-small text-kore-mid ml-sm">Tausch mit: {sw.swapWithUserId}</span>}
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`px-sm py-xs text-small ${SWAP_COLORS[sw.status] ?? 'bg-kore-bg text-kore-mid'}`}>{SWAP_LABELS[sw.status] ?? sw.status}</span>
                  {sw.status === 'PENDING' && (
                    <div className="flex gap-xs">
                      <button onClick={() => updateSwap.mutate({ id: sw.id, status: 'APPROVED' })} className="px-sm py-xs text-small bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Genehmigen</button>
                      <button onClick={() => updateSwap.mutate({ id: sw.id, status: 'REJECTED' })} className="px-sm py-xs text-small bg-red-100 text-red-600 hover:bg-red-200">Ablehnen</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
