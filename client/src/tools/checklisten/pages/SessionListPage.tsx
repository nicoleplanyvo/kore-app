import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Eye } from 'lucide-react';
import { useChecklistSessions } from '../../../hooks/useChecklist';

const statusLabels: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'text-kore-warning' },
  COMPLETED: { label: 'Abgeschlossen', color: 'text-kore-success' },
  CANCELLED: { label: 'Abgebrochen', color: 'text-kore-error' },
};

export function SessionListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useChecklistSessions(page);

  const sessions = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-xl max-w-5xl">
      <Link
        to="/tools/checklisten"
        className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-xl transition-colors"
      >
        <ArrowLeft size={16} />
        Zurueck zur Uebersicht
      </Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Checklisten-Verlauf</h1>
          <p className="text-body text-kore-mid mt-xs">{total} Checklisten insgesamt</p>
        </div>
        <Link
          to="/tools/checklisten/sessions/new"
          className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
        >
          <Plus size={16} />
          Neue Checkliste
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Checklisten...</div>
      ) : sessions.length === 0 ? (
        <div className="text-body text-kore-mid">Noch keine Checklisten vorhanden.</div>
      ) : (
        <>
          <div className="bg-kore-white border border-kore-border overflow-hidden">
            {/* Desktop-Tabelle */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md-sm">
                    Datum
                  </th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md-sm">
                    Template
                  </th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md-sm">
                    Store
                  </th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md-sm">
                    Erfuellungsgrad
                  </th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md-sm">
                    Status
                  </th>
                  <th className="px-lg py-md-sm" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const status = statusLabels[session.status] ?? { label: session.status, color: 'text-kore-mid' };
                  const date = session.completedAt ?? session.startedAt;
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-kore-border last:border-b-0 hover:bg-kore-bg transition-colors"
                    >
                      <td className="px-lg py-md text-small text-kore-ink">
                        {new Date(date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-lg py-md text-small text-kore-ink">
                        {session.template?.name ?? '—'}
                      </td>
                      <td className="px-lg py-md text-small text-kore-mid">
                        {session.store?.name ?? '—'}
                        {session.store?.city ? ` — ${session.store.city}` : ''}
                      </td>
                      <td className="px-lg py-md text-small font-medium">
                        {session.completionRate !== null && session.completionRate !== undefined ? (
                          <span
                            className={
                              session.completionRate >= 75
                                ? 'text-kore-success'
                                : session.completionRate >= 50
                                  ? 'text-kore-brass'
                                  : 'text-kore-error'
                            }
                          >
                            {Math.round(session.completionRate)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`px-lg py-md text-small ${status.color}`}>
                        {status.label}
                      </td>
                      <td className="px-lg py-md text-right">
                        <Link
                          to={
                            session.status === 'IN_PROGRESS'
                              ? `/tools/checklisten/sessions/${session.id}/conduct`
                              : `/tools/checklisten/sessions/${session.id}`
                          }
                          className="text-kore-brass hover:text-kore-brass-dk transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile-Kartenansicht */}
            <div className="sm:hidden divide-y divide-kore-border">
              {sessions.map((session) => {
                const status = statusLabels[session.status] ?? { label: session.status, color: 'text-kore-mid' };
                const date = session.completedAt ?? session.startedAt;
                return (
                  <Link
                    key={session.id}
                    to={
                      session.status === 'IN_PROGRESS'
                        ? `/tools/checklisten/sessions/${session.id}/conduct`
                        : `/tools/checklisten/sessions/${session.id}`
                    }
                    className="block px-lg py-md hover:bg-kore-bg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-xs">
                      <span className="text-small text-kore-ink font-medium">
                        {session.template?.name ?? '—'}
                      </span>
                      <span className={`text-small ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center justify-between text-small text-kore-mid">
                      <span>{session.store?.name ?? '—'}</span>
                      <span>{new Date(date).toLocaleDateString('de-DE')}</span>
                    </div>
                    {session.completionRate !== null && session.completionRate !== undefined && (
                      <div className="mt-sm w-full h-1 bg-kore-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            session.completionRate >= 75
                              ? 'bg-kore-success'
                              : session.completionRate >= 50
                                ? 'bg-kore-brass'
                                : 'bg-kore-error'
                          }`}
                          style={{ width: `${Math.round(session.completionRate)}%` }}
                        />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-small text-kore-mid hover:text-kore-ink disabled:opacity-30 transition-colors"
              >
                Zurueck
              </button>
              <span className="text-small text-kore-mid">
                Seite {page} von {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-small text-kore-mid hover:text-kore-ink disabled:opacity-30 transition-colors"
              >
                Weiter
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
