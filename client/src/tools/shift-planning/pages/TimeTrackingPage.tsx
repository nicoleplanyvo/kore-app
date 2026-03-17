import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogIn, LogOut, Coffee, Play, Clock } from 'lucide-react';
import { useClock, useTimeEntries, useShiftStores } from '../../../hooks/useShiftPlanning';

function formatDate(d: Date): string { return d.toISOString().split('T')[0]; }
function formatTime(dt: string | null): string {
  if (!dt) return '---';
  return new Date(dt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { from: formatDate(start), to: formatDate(end) };
}

const STATUS_LABELS: Record<string, string> = { OPEN: 'Offen', CLOCKED_IN: 'Eingestempelt', PAUSED: 'Pause', DONE: 'Abgeschlossen' };
const STATUS_COLORS: Record<string, string> = { OPEN: 'bg-kore-bg text-kore-mid', CLOCKED_IN: 'bg-emerald-100 text-emerald-700', PAUSED: 'bg-amber-100 text-amber-700', DONE: 'bg-blue-100 text-blue-700' };

export function TimeTrackingPage() {
  const [selectedStore, setSelectedStore] = useState('');
  const { data: stores } = useShiftStores();
  const clock = useClock();

  const { from, to } = getWeekRange();
  const { data: timeData, isLoading } = useTimeEntries({ storeId: selectedStore || undefined, from, to });
  const entries = timeData?.entries ?? [];
  const saldo = timeData?.saldo ?? [];

  // Find current user's today entry
  const todayStr = formatDate(new Date());
  const todayEntry = entries.find((e: any) => e.date?.split('T')[0] === todayStr);
  const currentStatus = todayEntry?.status ?? 'OPEN';

  const handleClock = (action: string) => {
    if (!selectedStore) return;
    clock.mutate({ storeId: selectedStore, action });
  };

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/shift-planning" className="flex items-center gap-xs text-kore-mid hover:text-kore-ink text-small mb-lg"><ArrowLeft size={16} /> Zurueck zum Wochenplan</Link>

      <h1 className="font-display text-h1 text-kore-ink mb-xs">Zeiterfassung</h1>
      <p className="text-body text-kore-mid mb-xl">Ein-/Ausstempeln, Pausen erfassen und Wochenstunden einsehen.</p>

      {/* Store Select */}
      <div className="mb-xl">
        <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Store waehlen</option>
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Clock Actions */}
      {selectedStore && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Clock size={20} /> Aktueller Status</h2>
          <div className="flex items-center gap-lg mb-lg">
            <span className={`px-md py-sm text-small font-medium ${STATUS_COLORS[currentStatus]}`}>{STATUS_LABELS[currentStatus]}</span>
            {todayEntry?.clockIn && (
              <span className="text-small text-kore-mid">Eingestempelt: {formatTime(todayEntry.clockIn)}</span>
            )}
            {todayEntry?.clockOut && (
              <span className="text-small text-kore-mid">Ausgestempelt: {formatTime(todayEntry.clockOut)}</span>
            )}
            {todayEntry?.pauseMin > 0 && (
              <span className="text-small text-kore-mid">Pause: {todayEntry.pauseMin} Min.</span>
            )}
          </div>
          <div className="flex gap-sm flex-wrap">
            <button
              onClick={() => handleClock('CLOCK_IN')}
              disabled={clock.isPending || currentStatus === 'CLOCKED_IN' || currentStatus === 'PAUSED'}
              className="flex items-center gap-xs px-lg py-md bg-emerald-600 text-white text-small hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              <LogIn size={16} /> Einstempeln
            </button>
            <button
              onClick={() => handleClock('PAUSE_START')}
              disabled={clock.isPending || currentStatus !== 'CLOCKED_IN'}
              className="flex items-center gap-xs px-lg py-md bg-amber-500 text-white text-small hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              <Coffee size={16} /> Pause starten
            </button>
            <button
              onClick={() => handleClock('PAUSE_END')}
              disabled={clock.isPending || currentStatus !== 'PAUSED'}
              className="flex items-center gap-xs px-lg py-md bg-blue-500 text-white text-small hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              <Play size={16} /> Pause beenden
            </button>
            <button
              onClick={() => handleClock('CLOCK_OUT')}
              disabled={clock.isPending || (currentStatus !== 'CLOCKED_IN' && currentStatus !== 'PAUSED')}
              className="flex items-center gap-xs px-lg py-md bg-red-600 text-white text-small hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              <LogOut size={16} /> Ausstempeln
            </button>
          </div>
        </div>
      )}

      {/* Weekly Hours Summary */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Wochenuebersicht ({from} bis {to})</h2>
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Zeiteintraege...</div>
      ) : !entries.length ? (
        <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Keine Zeiteintraege in dieser Woche.</div>
      ) : (
        <>
          <div className="bg-kore-white border border-kore-border mb-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="p-md text-left text-small text-kore-mid uppercase tracking-widest">Datum</th>
                  <th className="p-md text-left text-small text-kore-mid uppercase tracking-widest">Mitarbeiter</th>
                  <th className="p-md text-left text-small text-kore-mid uppercase tracking-widest">Einstempeln</th>
                  <th className="p-md text-left text-small text-kore-mid uppercase tracking-widest">Ausstempeln</th>
                  <th className="p-md text-right text-small text-kore-mid uppercase tracking-widest">Pause</th>
                  <th className="p-md text-right text-small text-kore-mid uppercase tracking-widest">Stunden</th>
                  <th className="p-md text-center text-small text-kore-mid uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e: any) => (
                  <tr key={e.id} className="border-b border-kore-border hover:bg-kore-bg/30">
                    <td className="p-md text-body text-kore-ink">{new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                    <td className="p-md text-body text-kore-ink">{e.user?.name ?? '---'}</td>
                    <td className="p-md text-body text-kore-ink">{formatTime(e.clockIn)}</td>
                    <td className="p-md text-body text-kore-ink">{formatTime(e.clockOut)}</td>
                    <td className="p-md text-body text-kore-ink text-right">{e.pauseMin} Min.</td>
                    <td className="p-md text-body text-kore-ink text-right font-medium">{e.workedHours?.toFixed(1)}h</td>
                    <td className="p-md text-center"><span className={`px-sm py-xs text-small ${STATUS_COLORS[e.status]}`}>{STATUS_LABELS[e.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Saldo per Employee */}
          {saldo.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h3 className="font-display text-h3 text-kore-ink mb-md">Stunden-Saldo (diese Woche)</h3>
              <div className="space-y-sm">
                {saldo.map((s: any) => (
                  <div key={s.userId} className="flex items-center justify-between border-b border-kore-border pb-sm last:border-0">
                    <span className="text-body text-kore-ink font-medium">{s.userName}</span>
                    <div className="flex items-center gap-lg">
                      <span className="text-small text-kore-mid">{s.entries} Eintraege</span>
                      <span className="font-display text-h3 text-kore-ink">{(s.totalMin / 60).toFixed(1)}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
