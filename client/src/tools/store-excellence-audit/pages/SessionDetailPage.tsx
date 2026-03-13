import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Camera } from 'lucide-react';
import { useAuditSession } from '../../../hooks/useAudit';
import { ScoreRing } from '../components/ScoreRing';
import { calculateAuditScore } from '@shared/validators/audit-scoring';
import { API_URL } from '../../../lib/api';
import type { AuditCategory, AuditResponse } from '@shared/types';

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useAuditSession(id);

  if (isLoading || !session) {
    return (
      <div className="p-xl">
        <div className="text-body text-kore-mid">Lade Audit-Ergebnis...</div>
      </div>
    );
  }

  const categories = session.template?.categories ?? [];
  const responses = session.responses ?? [];

  const scoreResult = calculateAuditScore(
    categories.map((cat: AuditCategory) => ({
      id: cat.id,
      name: cat.name,
      weight: cat.weight,
      criteria: (cat.criteria ?? []).map((c) => ({
        id: c.id,
        isRequired: c.isRequired,
      })),
    })),
    responses.map((r: AuditResponse) => ({
      criterionId: r.criterionId,
      scorePercent: r.scorePercent,
      passed: r.passed,
    })),
  );

  return (
    <div className="p-xl max-w-4xl">
      <Link
        to="/tools/sea/sessions"
        className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-xl transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück zur Übersicht
      </Link>

      <div className="flex flex-col md:flex-row md:items-start gap-2xl mb-2xl">
        <div className="flex flex-col items-center">
          <ScoreRing score={session.overallScore ?? 0} size={160} label="Gesamt" />
          <div className="mt-md text-center">
            <div className="text-small text-kore-mid">
              Pass-Rate: {scoreResult.overallPassRate}%
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">
            {session.template?.name}
          </h1>
          <div className="mt-md space-y-xs text-small text-kore-mid">
            {(session as any).store && (
              <div>Store: {(session as any).store.name}{(session as any).store.city ? ` — ${(session as any).store.city}` : ''}</div>
            )}
            {session.storeLocation && <div>Bereich: {session.storeLocation}</div>}
            <div>
              Datum:{' '}
              {session.completedAt
                ? new Date(session.completedAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </div>
            <div>
              Status:{' '}
              <span
                className={
                  session.status === 'COMPLETED' ? 'text-kore-success' : 'text-kore-warning'
                }
              >
                {session.status === 'COMPLETED' ? 'Abgeschlossen' : session.status}
              </span>
            </div>
          </div>
          {session.notes && (
            <div className="mt-lg p-md bg-kore-bg border-l-2 border-kore-brass text-small text-kore-mid">
              {session.notes}
            </div>
          )}
        </div>
      </div>

      {/* Kategorie-Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-2xl">
        {scoreResult.categories.map((cat) => (
          <div
            key={cat.categoryId}
            className="bg-kore-white border border-kore-border p-lg"
          >
            <div className="text-caption text-kore-mid uppercase tracking-widest mb-sm">
              {cat.categoryName}
            </div>
            <div
              className={`font-display text-h2 ${
                cat.averagePercent >= 75
                  ? 'text-kore-success'
                  : cat.averagePercent >= 50
                    ? 'text-kore-brass'
                    : 'text-kore-error'
              }`}
            >
              {Math.round(cat.averagePercent)}%
            </div>
            <div className="text-small text-kore-mid mt-xs">
              {cat.passCount}/{cat.passCount + cat.failCount} bestanden
              <span className="text-kore-faint"> · Gewicht: {cat.weight}x</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail pro Kategorie */}
      {categories.map((cat: AuditCategory) => (
        <div key={cat.id} className="mb-2xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg border-b border-kore-border pb-sm">
            {cat.name}
          </h2>

          <div className="space-y-sm">
            {(cat.criteria ?? []).map((crit) => {
              const response = responses.find(
                (r: AuditResponse) => r.criterionId === crit.id,
              );

              return (
                <div
                  key={crit.id}
                  className="flex items-center gap-md px-lg py-md-sm bg-kore-white border border-kore-border"
                >
                  <div className="shrink-0">
                    {response?.passed === true ? (
                      <Check size={18} className="text-kore-success" />
                    ) : response?.passed === false ? (
                      <X size={18} className="text-kore-error" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border border-kore-border" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-small text-kore-ink">{crit.name}</div>
                    {response?.comment && (
                      <div className="text-small text-kore-mid mt-xs italic">
                        {response.comment}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    {response?.scorePercent !== null && response?.scorePercent !== undefined ? (
                      <span
                        className={`text-small font-medium ${
                          response.scorePercent >= 75
                            ? 'text-kore-success'
                            : response.scorePercent >= 50
                              ? 'text-kore-brass'
                              : 'text-kore-error'
                        }`}
                      >
                        {response.scorePercent}%
                      </span>
                    ) : (
                      <span className="text-small text-kore-faint">—</span>
                    )}
                  </div>

                  {response?.photoPath && (
                    <a
                      href={`${API_URL}/api/uploads/${response.photoPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-kore-brass hover:text-kore-brass-dk"
                    >
                      <Camera size={16} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
