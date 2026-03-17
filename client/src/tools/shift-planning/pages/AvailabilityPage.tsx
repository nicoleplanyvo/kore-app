import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Sun, Umbrella, Heart } from 'lucide-react';
import { useAvailability, useSetAvailability, useShiftStores, useShiftUsers } from '../../../hooks/useShiftPlanning';

const TYPE_LABELS: Record<string, string> = { AVAILABLE: 'Verfuegbar', UNAVAILABLE: 'Nicht verfuegbar', WISH: 'Wunsch', VACATION: 'Urlaub', SICK: 'Krank' };
const TYPE_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  UNAVAILABLE: 'bg-red-100 text-red-700 border-red-200',
  WISH: 'bg-blue-100 text-blue-700 border-blue-200',
  VACATION: 'bg-amber-100 text-amber-700 border-amber-200',
  SICK: 'bg-purple-100 text-purple-700 border-purple-200',
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  AVAILABLE: <Check size={12} />,
  UNAVAILABLE: <X size={12} />,
  WISH: <Sun size={12} />,
  VACATION: <Umbrella size={12} />,
  SICK: <Heart size={12} />,
};

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(d: Date): string { return d.toISOString().split('T')[0]; }

export function AvailabilityPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedType, setSelectedType] = useState<string>('AVAILABLE');
  const [wishStart, setWishStart] = useState('');
  const [wishEnd, setWishEnd] = useState('');

  const { data: stores } = useShiftStores();
  const { data: users } = useShiftUsers(selectedStore || undefined);
  const setAvail = useSetAvailability();

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const monthStart = getMonthStart(baseDate);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const from = formatDate(monthStart);
  const to = formatDate(monthEnd);

  const { data: availability, isLoading } = useAvailability({
    storeId: selectedStore || undefined,
    userId: selectedUser || undefined,
    from,
    to,
  });

  const availMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (availability) {
      for (const a of availability as any[]) {
        const key = `${a.userId}_${a.date?.split('T')[0]}`;
        map[key] = a;
      }
    }
    return map;
  }, [availability]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = monthStart.getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= monthEnd.getDate(); d++) {
      days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), d));
    }
    return days;
  }, [monthStart, monthEnd]);

  const handleDayClick = (date: Date) => {
    if (!selectedStore || !selectedUser) return;
    const data: any = {
      storeId: selectedStore,
      userId: selectedUser,
      date: formatDate(date),
      type: selectedType,
    };
    if (selectedType === 'WISH' && wishStart) data.wishStart = wishStart;
    if (selectedType === 'WISH' && wishEnd) data.wishEnd = wishEnd;
    setAvail.mutate(data);
  };

  const monthLabel = baseDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/shift-planning" className="flex items-center gap-xs text-kore-mid hover:text-kore-ink text-small mb-lg"><ArrowLeft size={16} /> Zurueck zum Wochenplan</Link>

      <h1 className="font-display text-h1 text-kore-ink mb-xs">Verfuegbarkeiten</h1>
      <p className="text-body text-kore-mid mb-xl">Tage markieren: verfuegbar, nicht verfuegbar, Wunsch-Schichten, Urlaub oder krank.</p>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg flex-wrap">
        <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Store waehlen</option>
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Mitarbeiter waehlen</option>
          {users?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Type Selector */}
      <div className="flex items-center gap-sm mb-md flex-wrap">
        <span className="text-small text-kore-mid">Markierung:</span>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setSelectedType(key)} className={`flex items-center gap-xs px-sm py-xs text-small border transition-colors ${selectedType === key ? TYPE_COLORS[key] + ' border-current font-medium' : 'border-kore-border text-kore-mid hover:text-kore-ink'}`}>
            {TYPE_ICONS[key]} {label}
          </button>
        ))}
      </div>

      {/* Wish time inputs */}
      {selectedType === 'WISH' && (
        <div className="flex items-center gap-md mb-md">
          <div>
            <label className="text-small text-kore-mid mr-xs">Wunsch von:</label>
            <input type="time" value={wishStart} onChange={e => setWishStart(e.target.value)} className="border border-kore-border px-sm py-xs text-small" />
          </div>
          <div>
            <label className="text-small text-kore-mid mr-xs">Wunsch bis:</label>
            <input type="time" value={wishEnd} onChange={e => setWishEnd(e.target.value)} className="border border-kore-border px-sm py-xs text-small" />
          </div>
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-md">
        <button onClick={() => setMonthOffset(m => m - 1)} className="p-sm border border-kore-border hover:bg-kore-bg"><ChevronLeft size={16} /></button>
        <span className="font-display text-h3 text-kore-ink">{monthLabel}</span>
        <button onClick={() => setMonthOffset(m => m + 1)} className="p-sm border border-kore-border hover:bg-kore-bg"><ChevronRight size={16} /></button>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="text-body text-kore-mid py-xl text-center">Lade Verfuegbarkeiten...</div>
      ) : (
        <div className="bg-kore-white border border-kore-border">
          <div className="grid grid-cols-7">
            {DAYS.map(d => (
              <div key={d} className="p-sm text-center text-small text-kore-mid uppercase tracking-widest border-b border-kore-border bg-kore-bg">{d}</div>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="p-md border-b border-r border-kore-border bg-kore-bg/30 min-h-[80px]" />;
              const dateStr = formatDate(date);
              const isToday = dateStr === formatDate(new Date());
              const key = selectedUser ? `${selectedUser}_${dateStr}` : '';
              const avail = key ? availMap[key] : null;
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <div
                  key={dateStr}
                  onClick={() => !isPast && selectedStore && selectedUser && handleDayClick(date)}
                  className={`p-sm border-b border-r border-kore-border min-h-[80px] transition-colors ${isPast ? 'bg-kore-bg/50 text-kore-faint' : 'cursor-pointer hover:bg-kore-bg/50'} ${isToday ? 'ring-2 ring-inset ring-kore-ink' : ''}`}
                >
                  <div className={`text-small mb-xs ${isToday ? 'font-bold text-kore-ink' : 'text-kore-mid'}`}>{date.getDate()}</div>
                  {avail && (
                    <div className={`px-xs py-xs text-xs border flex items-center gap-xs ${TYPE_COLORS[avail.type] ?? 'bg-kore-bg text-kore-mid border-kore-border'}`}>
                      {TYPE_ICONS[avail.type]} {TYPE_LABELS[avail.type]}
                      {avail.wishStart && <span className="text-xs">{avail.wishStart}-{avail.wishEnd}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!selectedStore || !selectedUser ? (
        <div className="mt-lg p-lg bg-kore-bg border border-kore-border text-center text-body text-kore-mid">
          Bitte Store und Mitarbeiter waehlen, um Verfuegbarkeiten zu bearbeiten.
        </div>
      ) : null}
    </div>
  );
}
