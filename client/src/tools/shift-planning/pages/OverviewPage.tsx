import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Plus, Send, Trash2, Edit3 } from 'lucide-react';
import { useShifts, useShiftStores, useShiftUsers, useCreateShift, useDeleteShift, usePublishWeek, useUpdateShift } from '../../../hooks/useShiftPlanning';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-blue-50 border-blue-200 text-blue-800',
  CONFIRMED: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  SWAPPED: 'bg-amber-50 border-amber-200 text-amber-800',
  CANCELLED: 'bg-red-50 border-red-200 text-red-800',
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string { return d.toISOString().split('T')[0]; }

export function OverviewPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedStore, setSelectedStore] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ userId: '', date: '', startTime: '09:00', endTime: '17:00', role: '' });

  const weekStart = getWeekStart(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const from = formatDate(weekDates[0]);
  const to = formatDate(weekDates[6]);

  const { data: stores } = useShiftStores();
  const { data: users } = useShiftUsers(selectedStore || undefined);
  const { data: shifts, isLoading } = useShifts({ storeId: selectedStore || undefined, weekStart: from, weekEnd: to });
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();
  const publishWeek = usePublishWeek();

  // Group shifts by employee
  const employeeIds = useMemo(() => {
    if (!shifts) return [];
    const ids = new Set(shifts.map((s: any) => s.userId));
    return Array.from(ids);
  }, [shifts]);

  const employeeMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (shifts) for (const s of shifts as any[]) { map[s.userId] = s.user?.name ?? s.userId; }
    if (users) for (const u of users as any[]) { map[u.id] = u.name; }
    return map;
  }, [shifts, users]);

  const getShiftsForCell = (userId: string, dateStr: string) =>
    shifts?.filter((s: any) => s.userId === userId && s.date?.split('T')[0] === dateStr) ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      updateShift.mutate({ id: editId, ...form }, { onSuccess: () => { setEditId(null); setShowForm(false); resetForm(); } });
    } else {
      createShift.mutate({ ...form, storeId: selectedStore }, { onSuccess: () => { setShowForm(false); resetForm(); } });
    }
  };

  const resetForm = () => setForm({ userId: '', date: '', startTime: '09:00', endTime: '17:00', role: '' });

  const handleEdit = (shift: any) => {
    setEditId(shift.id);
    setForm({ userId: shift.userId, date: shift.date?.split('T')[0] ?? '', startTime: shift.startTime, endTime: shift.endTime, role: shift.role ?? '' });
    setShowForm(true);
  };

  const handlePublish = () => {
    if (!selectedStore) return;
    publishWeek.mutate({ storeId: selectedStore, weekStart: from });
  };

  const weekLabel = `${weekDates[0].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - ${weekDates[6].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;

  return (
    <div className="p-xl max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Schichtplanung</h1>
          <p className="text-body text-kore-mid mt-xs">Wochenplan: Schichten zuweisen, veroeffentlichen und verwalten</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/shift-planning/availability" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">Verfuegbarkeiten</Link>
          <Link to="/tools/shift-planning/time-tracking" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">Zeiterfassung</Link>
          <Link to="/tools/shift-planning/dashboard" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">Dashboard</Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-lg gap-md flex-wrap">
        <div className="flex items-center gap-sm">
          <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="border border-kore-border px-md py-sm text-body">
            <option value="">Alle Stores</option>
            {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-sm">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-sm border border-kore-border hover:bg-kore-bg transition-colors"><ChevronLeft size={16} /></button>
          <button onClick={() => setWeekOffset(0)} className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors">Heute</button>
          <span className="text-body text-kore-ink font-medium min-w-[180px] text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-sm border border-kore-border hover:bg-kore-bg transition-colors"><ChevronRight size={16} /></button>
        </div>
        <div className="flex items-center gap-sm">
          <button onClick={() => { setEditId(null); resetForm(); setShowForm(!showForm); }} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity">
            <Plus size={16} /> Schicht
          </button>
          {selectedStore && (
            <button onClick={handlePublish} disabled={publishWeek.isPending} className="flex items-center gap-xs px-md py-sm bg-[#9E8460] text-white text-small hover:opacity-90 transition-opacity disabled:opacity-50">
              <Send size={16} /> Veroeffentlichen
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-display text-h3 text-kore-ink mb-md">{editId ? 'Schicht bearbeiten' : 'Neue Schicht'}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Mitarbeiter</label>
              <select value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required>
                <option value="">-- Waehlen --</option>
                {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Datum</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Beginn</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Ende</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Rolle</label>
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="z.B. Floor, Kasse" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div className="flex gap-sm mt-md">
            <button type="submit" disabled={createShift.isPending || updateShift.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
              {editId ? 'Speichern' : 'Schicht anlegen'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); resetForm(); }} className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Abbrechen</button>
          </div>
        </form>
      )}

      {/* Week Grid */}
      {isLoading ? (
        <div className="text-body text-kore-mid py-xl text-center">Lade Schichtplan...</div>
      ) : (
        <div className="bg-kore-white border border-kore-border overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="border-b border-r border-kore-border bg-kore-bg p-md text-left text-small text-kore-mid uppercase tracking-widest w-40">Mitarbeiter</th>
                {weekDates.map((date, i) => {
                  const dateStr = formatDate(date);
                  const isToday = dateStr === formatDate(new Date());
                  return (
                    <th key={dateStr} className={`border-b border-r border-kore-border p-md text-center text-small uppercase tracking-widest ${isToday ? 'bg-kore-ink text-kore-white' : 'bg-kore-bg text-kore-mid'}`}>
                      <div>{DAYS[i]}</div>
                      <div className="text-body font-normal">{date.getDate()}.{date.getMonth() + 1}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employeeIds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-2xl text-center text-body text-kore-mid">
                    <Calendar size={32} className="mx-auto mb-md text-kore-faint" />
                    Keine Schichten fuer diese Woche geplant.
                  </td>
                </tr>
              ) : (
                employeeIds.map((uid) => (
                  <tr key={uid} className="border-b border-kore-border hover:bg-kore-bg/30">
                    <td className="border-r border-kore-border p-md">
                      <span className="font-medium text-kore-ink text-body">{employeeMap[uid] ?? uid}</span>
                    </td>
                    {weekDates.map((date) => {
                      const dateStr = formatDate(date);
                      const cellShifts = getShiftsForCell(uid, dateStr);
                      return (
                        <td key={dateStr} className="border-r border-kore-border p-xs align-top min-w-[110px]">
                          {cellShifts.map((s: any) => (
                            <div key={s.id} className={`p-xs mb-xs border text-small group relative ${STATUS_COLORS[s.status] ?? 'bg-kore-bg border-kore-border text-kore-ink'}`}>
                              <div className="font-medium">{s.startTime} - {s.endTime}</div>
                              {s.role && <div className="text-xs opacity-70">{s.role}</div>}
                              <div className="absolute top-0 right-0 hidden group-hover:flex gap-px">
                                <button onClick={() => handleEdit(s)} className="p-xs bg-white/80 hover:bg-white"><Edit3 size={12} /></button>
                                <button onClick={() => deleteShift.mutate(s.id)} className="p-xs bg-white/80 hover:bg-white text-red-600"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
