import { Link } from 'react-router-dom';
import { Plus, List, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAuditSummary } from '../../../hooks/useAudit';
import { ScoreRing } from '../../../components/ScoreRing';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import t from '../../../locales/de.json';

export function SEAOverviewPage() {
  const { data: summary, isLoading } = useAuditSummary();

  if (isLoading) return <LoadingSpinner />;

  const TrendIcon = summary?.recentTrend === 'up' ? TrendingUp :
    summary?.recentTrend === 'down' ? TrendingDown : Minus;

  return (
    <div className="px-lg py-lg space-y-xl max-w-lg mx-auto">
      <h1 className="font-display text-h2 text-kore-ink">{t.audit.title}</h1>

      {/* Score */}
      {summary && (
        <div className="flex flex-col items-center gap-lg">
          <ScoreRing score={summary.averageScore} size={140} strokeWidth={10} />

          <div className="grid grid-cols-3 gap-md w-full">
            <Card className="text-center">
              <p className="text-h3 font-display text-kore-ink">{summary.totalAudits}</p>
              <p className="text-caption text-kore-mid uppercase tracking-widest">{t.audit.totalAudits}</p>
            </Card>
            <Card className="text-center">
              <p className="text-h3 font-display text-kore-ink">{summary.passRate}%</p>
              <p className="text-caption text-kore-mid uppercase tracking-widest">{t.audit.passRate}</p>
            </Card>
            <Card className="text-center flex flex-col items-center justify-center">
              <TrendIcon
                size={24}
                className={
                  summary.recentTrend === 'up' ? 'text-kore-success' :
                  summary.recentTrend === 'down' ? 'text-kore-error' :
                  'text-kore-mid'
                }
              />
              <p className="text-caption text-kore-mid uppercase tracking-widest mt-xs">{t.audit.trend}</p>
            </Card>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-md-sm">
        <Link to="/tools/sea/sessions/new">
          <Button className="w-full" size="lg">
            <Plus size={18} className="mr-sm" />
            {t.audit.newSession}
          </Button>
        </Link>
        <Link to="/tools/sea/sessions">
          <Button variant="secondary" className="w-full" size="md">
            <List size={18} className="mr-sm" />
            {t.audit.sessions}
          </Button>
        </Link>
      </div>
    </div>
  );
}
