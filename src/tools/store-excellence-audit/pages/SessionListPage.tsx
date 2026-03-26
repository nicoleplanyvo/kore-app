import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuditSessions } from '../../../hooks/useAudit';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { EmptyState } from '../../../components/EmptyState';
import { ClipboardCheck } from 'lucide-react';
import t from '../../../locales/de.json';

const statusLabels = t.status as Record<string, string>;

export function SEASessionListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditSessions(page, 10);

  if (isLoading) return <LoadingSpinner />;

  const sessions = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="px-lg py-lg space-y-lg max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-h2 text-kore-ink">{t.audit.sessions}</h1>
        <Link to="/tools/sea/sessions/new">
          <Button size="sm">
            <Plus size={16} className="mr-xs" />
            Neu
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Noch keine Audits"
          description="Starte dein erstes Store Excellence Audit."
          action={
            <Link to="/tools/sea/sessions/new">
              <Button>{t.audit.newSession}</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-md-sm">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={
                session.status === 'DRAFT' || session.status === 'IN_PROGRESS'
                  ? `/tools/sea/sessions/${session.id}/conduct`
                  : `/tools/sea/sessions/${session.id}`
              }
            >
              <Card className="flex items-center justify-between hover:border-kore-brass transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium text-kore-ink truncate">
                    {session.store?.name ?? 'Store'}
                  </p>
                  <div className="flex items-center gap-md-sm mt-xs">
                    <span className="text-caption text-kore-mid">
                      {new Date(session.createdAt).toLocaleDateString('de-DE')}
                    </span>
                    <span className="text-caption text-kore-mid">
                      {session.template?.name}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-md-sm shrink-0">
                  {session.overallScore !== null && (
                    <span className="text-body font-medium text-kore-brass">
                      {Math.round(session.overallScore)}%
                    </span>
                  )}
                  <Badge
                    variant={
                      session.status === 'COMPLETED' ? 'success' :
                      session.status === 'IN_PROGRESS' ? 'brass' :
                      session.status === 'CANCELLED' ? 'error' :
                      'default'
                    }
                  >
                    {statusLabels[session.status] ?? session.status}
                  </Badge>
                  <ChevronRight size={16} className="text-kore-faint" />
                </div>
              </Card>
            </Link>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-lg pt-md">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center text-kore-mid disabled:opacity-30 touch-manipulation"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-small text-kore-mid">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center text-kore-mid disabled:opacity-30 touch-manipulation"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
