import { Link } from 'react-router-dom';
import { ClipboardCheck, Wrench, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAuditSummary, useAuditSessions } from '../hooks/useAudit';
import { ScoreRing } from '../components/ScoreRing';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import t from '../locales/de.json';

const statusLabels = t.status as Record<string, string>;
const roleLabels = t.roles as Record<string, string>;

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const { data: summary, isLoading: summaryLoading } = useAuditSummary();
  const { data: recentSessions, isLoading: sessionsLoading } = useAuditSessions(1, 5);

  const TrendIcon = summary?.recentTrend === 'up' ? TrendingUp :
    summary?.recentTrend === 'down' ? TrendingDown : Minus;

  return (
    <div className="px-lg py-lg space-y-xl max-w-lg mx-auto">
      {/* Begruessung */}
      <div>
        <h1 className="font-display text-h1 text-kore-ink">
          {t.home.greeting}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-small text-kore-mid mt-xs">
          {roleLabels[user?.role ?? 'learner']}
        </p>
      </div>

      {/* Quick Stats */}
      {summaryLoading ? (
        <LoadingSpinner />
      ) : summary ? (
        <div className="flex items-center gap-lg">
          <ScoreRing score={summary.averageScore} size={100} />
          <div className="space-y-sm flex-1">
            <div className="flex items-center justify-between">
              <span className="text-caption text-kore-mid uppercase tracking-widest">{t.audit.totalAudits}</span>
              <span className="text-body font-medium text-kore-ink">{summary.totalAudits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-kore-mid uppercase tracking-widest">{t.audit.passRate}</span>
              <span className="text-body font-medium text-kore-ink">{summary.passRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-kore-mid uppercase tracking-widest">{t.audit.trend}</span>
              <TrendIcon
                size={18}
                className={
                  summary.recentTrend === 'up' ? 'text-kore-success' :
                  summary.recentTrend === 'down' ? 'text-kore-error' :
                  'text-kore-mid'
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Schnellstart */}
      <div className="space-y-md-sm">
        <h2 className="text-caption text-kore-mid uppercase tracking-widest">{t.home.quickActions}</h2>
        <div className="grid grid-cols-2 gap-md-sm">
          <Link to="/tools/sea/sessions/new">
            <Card className="flex flex-col items-center gap-sm text-center hover:border-kore-brass transition-colors">
              <ClipboardCheck size={24} className="text-kore-brass" />
              <span className="text-small text-kore-ink font-medium">{t.home.newAudit}</span>
            </Card>
          </Link>
          <Link to="/tools">
            <Card className="flex flex-col items-center gap-sm text-center hover:border-kore-brass transition-colors">
              <Wrench size={24} className="text-kore-brass" />
              <span className="text-small text-kore-ink font-medium">{t.home.viewTools}</span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Letzte Aktivitaet */}
      <div className="space-y-md-sm">
        <h2 className="text-caption text-kore-mid uppercase tracking-widest">{t.home.recentActivity}</h2>
        {sessionsLoading ? (
          <LoadingSpinner />
        ) : recentSessions?.data && recentSessions.data.length > 0 ? (
          <div className="space-y-sm">
            {recentSessions.data.map((session) => (
              <Link key={session.id} to={`/tools/sea/sessions/${session.id}`}>
                <Card className="flex items-center justify-between hover:border-kore-brass transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-kore-ink truncate">
                      {session.store?.name ?? 'Store'}
                    </p>
                    <p className="text-caption text-kore-mid">
                      {new Date(session.createdAt).toLocaleDateString('de-DE')}
                    </p>
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
            <Link to="/tools/sea/sessions">
              <Button variant="ghost" size="sm" className="w-full">
                Alle Audits anzeigen
              </Button>
            </Link>
          </div>
        ) : (
          <Card className="text-center">
            <p className="text-small text-kore-mid">{t.home.noActivity}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
