import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { useAuditSessions } from '../../../hooks/useAudit';
import type { AuditSession } from '@shared/types';

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Entwurf', color: 'text-kore-faint' },
  IN_PROGRESS: { label: 'In Arbeit', color: 'text-kore-warning' },
  COMPLETED: { label: 'Abgeschlossen', color: 'text-kore-success' },
  CANCELLED: { label: 'Abgebrochen', color: 'text-kore-error' },
};

export function SessionListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditSessions(page);

  const sessions = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Audit-Historie</h1>
          <p className="text-body text-kore-mid mt-xs">{total} Audits insgesamt</p>
        </div>
        <Link
          to="/tools/sea/sessions/new"
          className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
        >
          <Plus size={16} />
          Neues Audit
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Audits...</div>
      ) : sessions.length === 0 ? (
        <div className="text-body text-kore-mid">Noch keine Audits vorhanden.</div>
      ) : (
        <>
          <div className="bg-kore-white border border-kore-border overflow-hidden">
            <table className="w-full">
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
                    Score
                  </th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md-sm">
                    Status
                  </th>
                  <th className="px-lg py-md-sm" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session: AuditSession) => {
                  const status = statusLabels[session.status] ?? statusLabels['DRAFT']!;
                  const date = session.completedAt ?? session.createdAt;
                  return (
                    <tr
                      key={session.id}
                      className="border-b border-kore-border last:border-b-0 hover:bg-kore-bg transition-colors"
                    >
                      <td className="px-lg py-md text-small text-kore-ink">
                        {new Date(date).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-lg py-md text-small text-kore-ink">
                        {(session as any).template?.name ?? '—'}
                      </td>
                      <td className="px-lg py-md text-small text-kore-mid">
                        {(session as any).store?.name ?? session.storeLocation ?? '—'}
                      </td>
                      <td className="px-lg py-md text-small font-medium">
                        {session.overallScore !== null && session.overallScore !== undefined ? (
                          <span
                            className={
                              session.overallScore >= 75
                                ? 'text-kore-success'
                                : session.overallScore >= 50
                                  ? 'text-kore-brass'
                                  : 'text-kore-error'
                            }
                          >
                            {Math.round(session.overallScore)}%
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
                            session.status === 'IN_PROGRESS' || session.status === 'DRAFT'
                              ? `/tools/sea/sessions/${session.id}/conduct`
                              : `/tools/sea/sessions/${session.id}`
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
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-small text-kore-mid hover:text-kore-ink disabled:opacity-30 transition-colors"
              >
                Zurück
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
