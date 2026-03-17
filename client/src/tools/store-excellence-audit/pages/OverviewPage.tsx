import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ClipboardCheck, TrendingUp, TrendingDown, Minus, List, BarChart3, Settings } from 'lucide-react';
import { useAuditSessions, useAuditStores, useAuditSummary } from '../../../hooks/useAudit';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-kore-faint bg-kore-bg border-kore-border',
  IN_PROGRESS: 'text-blue-600 bg-blue-50 border-blue-200',
  COMPLETED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  CANCELLED: 'text-red-600 bg-red-50 border-red-200',
};

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');

  const { data: stores } = useAuditStores();
  const { data: summary } = useAuditSummary();
  const { data: result, isLoading } = useAuditSessions({
    page,
    storeId: storeId || undefined,
    status: status || undefined,
  });

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 0;

  const trendIcon = summary?.recentTrend === 'up'
    ? <TrendingUp size={14} className="text-emerald-600" />
    : summary?.recentTrend === 'down'
      ? <TrendingDown size={14} className="text-red-600" />
      : <Minus size={14} className="text-kore-mid" />;

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Store Excellence Audit</h1>
          <p className="text-body text-kore-mid mt-xs">
            Interne Audits durchfuehren, Scores vergleichen und Massnahmen verfolgen
          </p>
        </div>
        <div className="flex gap-md">
          <Link to="templates" className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            <Settings size={16} /> Templates
          </Link>
          <Link to="dashboard" className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link to="create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Neues Audit
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeschlossene Audits</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{summary.totalAudits}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Score</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{summary.averageScore}%</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Pass-Rate</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{summary.passRate}%</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Trend</span>
            <div className="flex items-center gap-sm mt-sm">
              {trendIcon}
              <span className="text-body text-kore-ink capitalize">
                {summary.recentTrend === 'up' ? 'Aufwaerts' : summary.recentTrend === 'down' ? 'Abwaerts' : 'Stabil'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-xl">
        <select
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Status</option>
          <option value="IN_PROGRESS">In Bearbeitung</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="DRAFT">Entwurf</option>
          <option value="CANCELLED">Abgebrochen</option>
        </select>
      </div>

      {/* Audit List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Audits...</div>
      ) : !result || result.data.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ClipboardCheck size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Audits gefunden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Starten Sie Ihr erstes Store Excellence Audit, um die Performance systematisch zu bewerten.
          </p>
          <Link to="create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Erstes Audit starten
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {result.data.map((session: any) => (
              <Link
                key={session.id}
                to={`audits/${session.id}`}
                className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors"
              >
                <div className="flex items-start justify-between gap-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-md mb-xs">
                      <List size={16} className="text-kore-brass flex-shrink-0" />
                      <h3 className="text-body font-medium text-kore-ink truncate">
                        {session.store?.name ?? 'Store'} — {session.template?.name ?? 'Template'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-lg text-small text-kore-mid">
                      {session.store?.city && <span>{session.store.city}</span>}
                      <span>{new Date(session.createdAt).toLocaleDateString('de-DE')}</span>
                      {session.overallScore != null && (
                        <span className="font-medium text-kore-ink">Score: {session.overallScore.toFixed(1)}%</span>
                      )}
                      <span>{session._count?.responses ?? 0} Bewertungen</span>
                    </div>
                  </div>
                  <span className={`text-caption px-md py-xs border ${STATUS_COLORS[session.status] ?? ''} uppercase tracking-widest flex-shrink-0`}>
                    {STATUS_LABELS[session.status] ?? session.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">
                {result.total} Audits gesamt — Seite {result.page} von {totalPages}
              </span>
              <div className="flex gap-sm">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="px-md py-xs border border-kore-border text-small hover:bg-kore-bg disabled:opacity-40 transition-colors">Zurueck</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="px-md py-xs border border-kore-border text-small hover:bg-kore-bg disabled:opacity-40 transition-colors">Weiter</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
