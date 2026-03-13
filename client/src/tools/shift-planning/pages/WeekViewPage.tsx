import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useShiftEntries, useCreateShiftEntry } from '../../../hooks/useShiftPlanning';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const STATUS_COLORS: Record<string, string> = { PLANNED: 'bg-blue-100 text-blue-700 border-blue-200', CONFIRMED: 'bg-emerald-100 text-emerald-700 border-emerald-200', SWAPPED: 'bg-amber-100 text-amber-700 border-amber-200', CANCELLED: 'bg-red-100 text-red-700 border-red-200' };

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string { return d.toISOString().split('T')[0]; }

export function WeekViewPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = getWeekStart(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
  const from = formatDate(weekDates[0]);
  const to = formatDate(weekDates[6]);
  const { data: entries } = useShiftEntries({ from, to });
  const create = useCreateShiftEntry();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', date: '', startTime: '09:00', endTime: '17:00', role: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ userId: '', date: '', startTime: '09:00', endTime: '17:00', role: '' }); } });
  };

  const entriesByDate = (date: string) => entries?.filter((e: any) => e.date === date) ?? [];

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/shift-planning" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="font-display text-h1 text-kore-ink flex-1">Wochenansicht</h1>
        <div className="flex items-center gap-sm">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-sm border border-kore-border hover:bg-kore-bg"><ChevronLeft size={16} /></button>
          <button onClick={() => setWeekOffset(0)} className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg">Heute</button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-sm border border-kore-border hover:bg-kore-bg"><ChevronRight size={16} /></button>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Schicht
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Mitarbeiter (User-ID)</label>
              <input value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Datum</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Rolle</label>
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="z.B. Kasse, Floor" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Beginn</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Ende</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Schicht anlegen</button>
        </form>
      )}

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-sm">
        {weekDates.map((date, i) => {
          const dateStr = formatDate(date);
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          const dayEntries = entriesByDate(dateStr);
          return (
            <div key={dateStr} className={`bg-kore-white border ${isToday ? 'border-kore-ink' : 'border-kore-border'} min-h-[200px]`}>
              <div className={`p-sm text-center border-b ${isToday ? 'bg-kore-ink text-kore-white' : 'bg-kore-bg text-kore-mid'}`}>
                <div className="text-small font-medium">{DAYS[i]}</div>
                <div className="text-body">{date.getDate()}.{date.getMonth() + 1}</div>
              </div>
              <div className="p-xs space-y-xs">
                {dayEntries.map((e: any) => (
                  <div key={e.id} className={`p-xs text-small border ${STATUS_COLORS[e.status] ?? 'bg-kore-bg text-kore-mid border-kore-border'}`}>
                    <div className="font-medium truncate">{e.user?.name ?? '—'}</div>
                    <div>{e.startTime}–{e.endTime}</div>
                    {e.role && <div className="text-xs opacity-70">{e.role}</div>}
                  </div>
                ))}
                {!dayEntries.length && <div className="text-small text-kore-mid text-center py-md">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
