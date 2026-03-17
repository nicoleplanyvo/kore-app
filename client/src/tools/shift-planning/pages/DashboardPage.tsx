import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Clock, ArrowRightLeft, Users, Calendar } from 'lucide-react';
import { useShiftDashboard, useShiftStores } from '../../../hooks/useShiftPlanning';

const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function DashboardPage() {
  const [selectedStore, setSelectedStore] = useState('');
  const { data: stores } = useShiftStores();
  const { data: dashboard, isLoading } = useShiftDashboard(selectedStore || undefined);

  const maxPlanned = Math.max(1, ...(dashboard?.employeeHours?.map((e: any) => e.plannedHours) ?? [1]));
  const maxWorked = Math.max(1, ...(dashboard?.employeeHours?.map((e: any) => e.workedHours) ?? [1]));
  const maxHours = Math.max(maxPlanned, maxWorked);

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/shift-planning" className="flex items-center gap-xs text-kore-mid hover:text-kore-ink text-small mb-lg"><ArrowLeft size={16} /> Zurueck zum Wochenplan</Link>

      <div className="flex items-center justify-between mb-xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Wochenueberblick, Stunden-Saldo und Besetzung</p>
        </div>
        <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Stores</option>
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid py-xl text-center">Lade Dashboard...</div>
      ) : !dashboard ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <Calendar size={20} className="text-[#9E8460] mb-sm" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Schichten diese Woche</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.totalShiftsThisWeek}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <Users size={20} className="text-blue-500 mb-sm" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Mitarbeiter</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.employeeHours?.length ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <ArrowRightLeft size={20} className="text-amber-500 mb-sm" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Offene Tauschanfragen</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.pendingSwaps}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <Clock size={20} className="text-emerald-500 mb-sm" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtstunden geplant</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">
                {(dashboard.employeeHours?.reduce((s: number, e: any) => s + e.plannedHours, 0) ?? 0).toFixed(0)}h
              </div>
            </div>
          </div>

          {/* Employee Hours Chart */}
          {dashboard.employeeHours && dashboard.employeeHours.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><BarChart3 size={18} /> Stunden pro Mitarbeiter (Woche)</h2>
              <div className="space-y-md">
                {dashboard.employeeHours.map((e: any) => (
                  <div key={e.userId}>
                    <div className="flex items-center justify-between mb-xs">
                      <span className="text-body text-kore-ink font-medium">{e.name}</span>
                      <div className="flex items-center gap-md">
                        <span className="text-small text-kore-mid">Geplant: {e.plannedHours}h</span>
                        <span className="text-small text-kore-mid">Gearbeitet: {e.workedHours}h</span>
                        {e.overtimeMin > 0 && (
                          <span className="text-small text-amber-600 font-medium">+{(e.overtimeMin / 60).toFixed(1)}h Ueberstunden</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-xs h-5">
                      <div className="bg-blue-200 h-full transition-all" style={{ width: `${(e.plannedHours / maxHours) * 100}%` }} title="Geplant" />
                    </div>
                    <div className="flex gap-xs h-5 mt-xs">
                      <div className={`h-full transition-all ${e.overtimeMin > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${(e.workedHours / maxHours) * 100}%` }} title="Gearbeitet" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-lg mt-md pt-md border-t border-kore-border">
                <div className="flex items-center gap-xs"><div className="w-4 h-3 bg-blue-200" /><span className="text-small text-kore-mid">Geplant</span></div>
                <div className="flex items-center gap-xs"><div className="w-4 h-3 bg-emerald-400" /><span className="text-small text-kore-mid">Gearbeitet</span></div>
                <div className="flex items-center gap-xs"><div className="w-4 h-3 bg-amber-400" /><span className="text-small text-kore-mid">Ueberstunden</span></div>
              </div>
            </div>
          )}

          {/* Shifts by Day */}
          {dashboard.shiftsByDay && Object.keys(dashboard.shiftsByDay).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Calendar size={18} /> Besetzung nach Tag</h2>
              <div className="grid grid-cols-7 gap-sm">
                {Object.entries(dashboard.shiftsByDay as Record<string, number>).sort().map(([dateStr, count], i) => {
                  const date = new Date(dateStr);
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <div key={dateStr} className={`text-center p-md border ${isToday ? 'border-kore-ink bg-kore-ink/5' : 'border-kore-border'}`}>
                      <div className="text-small text-kore-mid">{DAYS_SHORT[i] ?? date.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                      <div className="text-caption text-kore-mid">{date.getDate()}.{date.getMonth() + 1}</div>
                      <div className="font-display text-h2 text-kore-ink mt-xs">{count}</div>
                      <div className="text-small text-kore-mid">Schichten</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
