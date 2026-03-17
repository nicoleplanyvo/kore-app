import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Plus, Calendar, User, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCoachingSessions, useCoachingStores, useCoachingDashboard } from '../../../hooks/useCoaching';

const STATUS_LABELS: Record<string, string> = { SCHEDULED: 'Geplant', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };
const STATUS_COLORS: Record<string, string> = { SCHEDULED: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-red-100 text-red-700' };
const TYPE_LABELS: Record<string, string> = { REGULAR: 'Regulaer', AD_HOC: 'Ad-hoc', FOLLOW_UP: 'Follow-up' };
const FRAMEWORK_LABELS: Record<string, string> = { GROW: 'GROW', SMART: 'SMART', FREE: 'Frei' };

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);
  const { data: stores } = useCoachingStores();
  const { data: sessions, isLoading } = useCoachingSessions({ page, storeId: storeId || undefined });
  const { data: dashboard } = useCoachingDashboard();

  const totalPages = sessions ? Math.ceil(sessions.total / sessions.pageSize) : 1;

  // Split into upcoming and recent
  const now = new Date();
  const upcoming = (sessions?.data ?? []).filter((s: any) => new Date(s.scheduledAt) >= now && s.status === 'SCHEDULED');
  const recent = (sessions?.data ?? []).filter((s: any) => new Date(s.scheduledAt) < now || s.status !== 'SCHEDULED');

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <MessageSquare size={24} /> Coaching
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Coaching-Sessions planen, strukturiert durchfuehren und dokumentieren
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            to="/tools/coaching/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-ink hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link
            to="/tools/coaching/create"
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} /> Neue Session
          </Link>
        </div>
      </div>

      {/* KPI Cards + Store Selector */}
      <div className="flex items-end gap-lg mb-xl">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-lg">
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Coaching-Quote</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard?.coachingQuote ?? 0}%</div>
            <span className="text-small text-kore-faint">{dashboard?.uniqueCoachees ?? 0} von {dashboard?.totalUsers ?? 0} MA</span>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Geplant</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard?.scheduledSessions ?? 0}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeschlossen</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard?.completedSessions ?? 0}</div>
          </div>
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Store</label>
          <select
            value={storeId}
            onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-body min-w-[180px]"
          >
            <option value="">Alle Stores</option>
            {(stores ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Sessions...</div>
      ) : !sessions?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <MessageSquare size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Coaching-Sessions</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie Ihre erste Session, um strukturiert mit dem GROW- oder SMART-Framework zu coachen.
          </p>
          <Link
            to="/tools/coaching/create"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} /> Session erstellen
          </Link>
        </div>
      ) : (
        <>
          {/* Upcoming Sessions */}
          {upcoming.length > 0 && (
            <div className="mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Anstehende Sessions</h2>
              <div className="space-y-sm">
                {upcoming.map((s: any) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-md">Vergangene Sessions</h2>
            <div className="space-y-sm">
              {recent.length > 0 ? recent.map((s: any) => (
                <SessionCard key={s.id} session={s} />
              )) : (
                <div className="text-body text-kore-mid bg-kore-white border border-kore-border p-lg text-center">Keine vergangenen Sessions.</div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SessionCard({ session: s }: { session: any }) {
  return (
    <Link
      to={`/tools/coaching/sessions/${s.id}`}
      className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <User size={18} className="text-kore-mid" />
          <div>
            <span className="font-medium text-kore-ink">{s.coachee?.name ?? 'Unbekannt'}</span>
            <span className="text-small text-kore-mid ml-sm">mit {s.coach?.name ?? '--'}</span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {s.framework && (
            <span className="px-sm py-xs text-small bg-kore-bg text-kore-ink">{FRAMEWORK_LABELS[s.framework] ?? s.framework}</span>
          )}
          <span className={`px-sm py-xs text-small ${STATUS_COLORS[s.status] ?? 'bg-kore-bg text-kore-mid'}`}>
            {STATUS_LABELS[s.status] ?? s.status}
          </span>
        </div>
      </div>
      <div className="flex gap-md text-small text-kore-mid mt-xs">
        <span className="flex items-center gap-xs"><Calendar size={12} /> {new Date(s.scheduledAt).toLocaleDateString('de-DE')}</span>
        <span>{TYPE_LABELS[s.type] ?? s.type}</span>
        {s.topic && <span>{s.topic}</span>}
        {s.duration && <span>{s.duration} Min.</span>}
      </div>
    </Link>
  );
}
