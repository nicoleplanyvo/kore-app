import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, Settings } from 'lucide-react';
import { useShiftEntries, useShiftTemplates } from '../../../hooks/useShiftPlanning';

const STATUS_LABELS: Record<string, string> = { PLANNED: 'Geplant', CONFIRMED: 'Bestätigt', SWAPPED: 'Getauscht', CANCELLED: 'Storniert' };
const STATUS_COLORS: Record<string, string> = { PLANNED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-emerald-100 text-emerald-700', SWAPPED: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-red-100 text-red-700' };

export function OverviewPage() {
  const today = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const { data: entries, isLoading } = useShiftEntries({ from: today, to: weekEnd });
  const { data: templates } = useShiftTemplates();

  const todayEntries = entries?.filter((e: any) => e.date === today) ?? [];
  const upcomingEntries = entries?.filter((e: any) => e.date > today) ?? [];

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Calendar size={24} /> Schichtplanung</h1>
          <p className="text-body text-kore-mid mt-xs">Schichten planen, verwalten und tauschen.</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/shift-planning/templates" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <Settings size={16} /> Vorlagen
          </Link>
          <Link to="/tools/shift-planning/week" className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Calendar size={16} /> Wochenansicht
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <Users size={20} className="mx-auto text-blue-500 mb-sm" />
          <div className="font-display text-h2 text-kore-ink">{todayEntries.length}</div>
          <div className="text-small text-kore-mid">Schichten heute</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <Clock size={20} className="mx-auto text-emerald-500 mb-sm" />
          <div className="font-display text-h2 text-kore-ink">{upcomingEntries.length}</div>
          <div className="text-small text-kore-mid">Kommende 7 Tage</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <Settings size={20} className="mx-auto text-indigo-500 mb-sm" />
          <div className="font-display text-h2 text-kore-ink">{templates?.length ?? 0}</div>
          <div className="text-small text-kore-mid">Vorlagen</div>
        </div>
      </div>

      {/* Today */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Heute</h2>
      {isLoading ? (
        <div className="text-body text-kore-mid mb-xl">Lade...</div>
      ) : !todayEntries.length ? (
        <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid mb-xl">Keine Schichten heute.</div>
      ) : (
        <div className="space-y-sm mb-xl">
          {todayEntries.map((e: any) => (
            <div key={e.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div>
                <span className="font-medium text-kore-ink">{e.user?.name ?? '—'}</span>
                {e.role && <span className="text-small text-kore-mid ml-sm">{e.role}</span>}
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-body text-kore-ink">{e.startTime} – {e.endTime}</span>
                <span className={`px-sm py-xs text-small ${STATUS_COLORS[e.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[e.status] ?? e.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Kommende Schichten</h2>
      {!upcomingEntries.length ? (
        <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Keine weiteren Schichten geplant.</div>
      ) : (
        <div className="space-y-sm">
          {upcomingEntries.map((e: any) => (
            <div key={e.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div>
                <span className="font-medium text-kore-ink">{e.user?.name ?? '—'}</span>
                <span className="text-small text-kore-mid ml-sm">{new Date(e.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                {e.role && <span className="text-small text-kore-mid ml-sm">{e.role}</span>}
              </div>
              <div className="flex items-center gap-sm">
                <span className="text-body text-kore-ink">{e.startTime} – {e.endTime}</span>
                <span className={`px-sm py-xs text-small ${STATUS_COLORS[e.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[e.status] ?? e.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
