import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useAuditSession } from '../../../hooks/useAudit';
import { calculateAuditScore } from '../../../lib/audit-scoring';
import { ScoreRing } from '../../../components/ScoreRing';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import type { AuditCategory } from '../../../types';
import t from '../../../locales/de.json';

const statusLabels = t.status as Record<string, string>;

export function SEASessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useAuditSession(id);

  if (isLoading || !session) return <LoadingSpinner />;

  const categories = session.template?.categories ?? [];
  const responses = session.responses ?? [];

  // Score berechnen
  const scoreResult = calculateAuditScore(
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      weight: c.weight,
      criteria: (c.criteria ?? []).map((cr) => ({
        id: cr.id,
        isRequired: cr.isRequired,
      })),
    })),
    responses.map((r) => ({
      criterionId: r.criterionId,
      scorePercent: r.scorePercent,
      passed: r.passed,
    })),
  );

  // Wenn noch laufend, zum Conduct-Page
  if (session.status === 'DRAFT' || session.status === 'IN_PROGRESS') {
    return (
      <div className="px-lg py-lg space-y-lg max-w-lg mx-auto text-center">
        <p className="text-body text-kore-mid">Dieses Audit ist noch nicht abgeschlossen.</p>
        <Link to={`/tools/sea/sessions/${id}/conduct`}>
          <Button>Audit fortsetzen</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-lg py-lg space-y-xl max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-md">
        <Link
          to="/tools/sea/sessions"
          className="w-10 h-10 flex items-center justify-center text-kore-mid hover:text-kore-ink touch-manipulation"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h3 text-kore-ink">
            {session.store?.name}
          </h1>
          <p className="text-caption text-kore-mid">
            {new Date(session.createdAt).toLocaleDateString('de-DE')} · {session.template?.name}
          </p>
        </div>
        <Badge
          variant={session.status === 'COMPLETED' ? 'success' : 'default'}
        >
          {statusLabels[session.status] ?? session.status}
        </Badge>
      </div>

      {/* Overall Score */}
      <div className="flex flex-col items-center">
        <ScoreRing score={session.overallScore ?? 0} size={140} strokeWidth={10} />
        <p className="text-small text-kore-mid mt-md">
          Bestehensquote: {scoreResult.overallPassRate}%
        </p>
      </div>

      {/* Category Scores */}
      <div className="space-y-md-sm">
        <h2 className="text-caption text-kore-mid uppercase tracking-widest">Kategorien</h2>
        {scoreResult.categories.map((cat) => (
          <Card key={cat.categoryId} className="space-y-sm">
            <div className="flex items-center justify-between">
              <span className="text-body font-medium text-kore-ink">{cat.categoryName}</span>
              <span className={`text-body font-medium ${
                cat.averagePercent >= 75 ? 'text-kore-success' :
                cat.averagePercent >= 50 ? 'text-kore-brass' :
                'text-kore-error'
              }`}>
                {cat.averagePercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-kore-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  cat.averagePercent >= 75 ? 'bg-kore-success' :
                  cat.averagePercent >= 50 ? 'bg-kore-brass' :
                  'bg-kore-error'
                }`}
                style={{ width: `${cat.averagePercent}%` }}
              />
            </div>
            <div className="flex gap-lg text-caption text-kore-mid">
              <span>{cat.scoredCount}/{cat.criteriaCount} bewertet</span>
              <span className="text-kore-success">{cat.passCount} bestanden</span>
              <span className="text-kore-error">{cat.failCount} nicht bestanden</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Criteria Detail */}
      {categories.map((cat: AuditCategory) => (
        <div key={cat.id} className="space-y-md-sm">
          <h2 className="text-caption text-kore-mid uppercase tracking-widest">{cat.name}</h2>
          {(cat.criteria ?? []).map((crit) => {
            const resp = responses.find((r) => r.criterionId === crit.id);
            return (
              <Card key={crit.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-small text-kore-ink truncate">{crit.name}</p>
                  {resp?.comment && (
                    <p className="text-caption text-kore-mid mt-xs truncate">{resp.comment}</p>
                  )}
                </div>
                <div className="flex items-center gap-md-sm shrink-0">
                  {resp?.scorePercent !== null && resp?.scorePercent !== undefined && (
                    <span className="text-small font-medium text-kore-brass">
                      {resp.scorePercent}%
                    </span>
                  )}
                  {resp?.passed === true && (
                    <div className="w-8 h-8 bg-kore-success/10 text-kore-success flex items-center justify-center rounded-full">
                      <Check size={16} />
                    </div>
                  )}
                  {resp?.passed === false && (
                    <div className="w-8 h-8 bg-kore-error/10 text-kore-error flex items-center justify-center rounded-full">
                      <X size={16} />
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
