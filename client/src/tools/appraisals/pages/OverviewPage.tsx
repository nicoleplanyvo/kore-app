import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Plus, BarChart3, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppraisals, useAppraisalStores, useAppraisalDashboard } from '../../../hooks/useAppraisals';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Entwurf',
  SELF_REVIEW: 'Selbsteinschaetzung',
  MANAGER_REVIEW: 'Durchgefuehrt',
  COMPLETED: 'Abgeschlossen',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-kore-bg text-kore-mid',
  SELF_REVIEW: 'bg-amber-100 text-amber-700',
  MANAGER_REVIEW: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const RATING_LABELS: Record<number, string> = {
  5: 'Uebertrifft',
  4: 'Erreicht voll',
  3: 'Erreicht',
  2: 'Teilweise',
  1: 'Nicht erreicht',
};

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');

  const { data: stores } = useAppraisalStores();
  const { data: result, isLoading } = useAppraisals({ page, storeId: storeId || undefined, status: status || undefined });
  const { data: dashboard } = useAppraisalDashboard(storeId || undefined);

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Mitarbeiterbeurteilungen</h1>
          <p className="text-body text-kore-mid mt-xs">Beurteilungen verwalten, Selbsteinschaetzungen einholen und Gespraeche dokumentieren</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/appraisals/dashboard" className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors text-kore-ink">
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link to="/tools/appraisals/create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Neue Beurteilung
          </Link>
        </div>
      </div>

      {/* KPI Tiles */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Faellige</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.dueSoon?.length ?? 0}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Ueberfaellige</span>
            <div className={`font-display text-h1 mt-sm ${dashboard.overdue > 0 ? 'text-red-600' : 'text-kore-ink'}`}>{dashboard.overdue ?? 0}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeschlossen</span>
            <div className="font-display text-h1 text-emerald-600 mt-sm">{dashboard.completed ?? 0}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Bewertung</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.avgScore ? `${dashboard.avgScore}/5` : '--'}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-md mb-xl flex-wrap">
        <Filter size={16} className="text-kore-mid" />
        <select value={storeId} onChange={e => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="PENDING">Entwurf</option>
          <option value="SELF_REVIEW">Selbsteinschaetzung</option>
          <option value="MANAGER_REVIEW">Durchgefuehrt</option>
          <option value="COMPLETED">Abgeschlossen</option>
        </select>
      </div>

      {/* Appraisals List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Beurteilungen...</div>
      ) : !result?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ClipboardCheck size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Beurteilungen</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erstellen Sie eine neue Mitarbeiterbeurteilung, um den Bewertungsprozess zu starten.</p>
          <Link to="/tools/appraisals/create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Neue Beurteilung
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {result.data.map((a: any) => (
              <Link key={a.id} to={`/tools/appraisals/appraisals/${a.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <ClipboardCheck size={18} className="text-kore-mid" />
                    <span className="font-medium text-kore-ink">{a.employee?.name ?? 'Unbekannt'}</span>
                  </div>
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[a.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                </div>
                <div className="flex gap-md text-small text-kore-mid mt-xs">
                  <span>Manager: {a.manager?.name ?? '--'}</span>
                  {a.store && <span>Store: {a.store.name}</span>}
                  {a.overallRating && <span>Bewertung: {a.overallRating}/5 ({RATING_LABELS[a.overallRating] ?? ''})</span>}
                  {a.cycle && <span>{a.cycle.name}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
