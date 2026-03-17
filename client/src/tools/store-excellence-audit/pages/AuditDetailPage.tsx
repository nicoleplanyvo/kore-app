import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Send, Trash2 } from 'lucide-react';
import { useAuditSession, useUpsertAuditResponse, useCompleteAuditSession, useCancelAuditSession } from '../../../hooks/useAudit';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

export function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isLoading } = useAuditSession(id);
  const upsertResponse = useUpsertAuditResponse();
  const completeMutation = useCompleteAuditSession();
  const cancelMutation = useCancelAuditSession();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Audit...</div>;
  if (!session) return <div className="p-xl text-body text-kore-mid">Audit nicht gefunden.</div>;

  const isEditable = session.status === 'IN_PROGRESS' || session.status === 'DRAFT';
  const categories = session.template?.categories ?? [];
  const responses = session.responses ?? [];

  const getResponse = (criterionId: string) =>
    responses.find((r: any) => r.criterionId === criterionId);

  const handlePassFail = async (criterionId: string, passed: boolean) => {
    if (!isEditable) return;
    await upsertResponse.mutateAsync({
      sessionId: session.id,
      criterionId,
      passed,
      scorePercent: passed ? 100 : 0,
    });
  };

  const handleScore = async (criterionId: string, scorePercent: number) => {
    if (!isEditable) return;
    await upsertResponse.mutateAsync({
      sessionId: session.id,
      criterionId,
      scorePercent,
    });
  };

  const handleComment = async (criterionId: string, comment: string) => {
    if (!isEditable) return;
    await upsertResponse.mutateAsync({
      sessionId: session.id,
      criterionId,
      comment,
    });
  };

  const handleComplete = async () => {
    if (!confirm('Audit wirklich abschliessen? Der Score wird berechnet.')) return;
    await completeMutation.mutateAsync(session.id);
  };

  const handleCancel = async () => {
    if (!confirm('Audit wirklich abbrechen?')) return;
    await cancelMutation.mutateAsync(session.id);
    navigate('/app/tools/sea');
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-xl">
        <button onClick={() => navigate(-1)} className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">
            {session.store?.name ?? 'Store'} — {session.template?.name ?? 'Audit'}
          </h1>
          <div className="flex items-center gap-lg text-small text-kore-mid mt-xs">
            <span>Status: {STATUS_LABELS[session.status] ?? session.status}</span>
            {session.store?.city && <span>{session.store.city}</span>}
            <span>{new Date(session.createdAt).toLocaleDateString('de-DE')}</span>
            {session.overallScore != null && (
              <span className="font-medium text-kore-ink">Score: {session.overallScore.toFixed(1)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isEditable && (
        <div className="flex gap-sm mb-xl">
          <button
            onClick={handleComplete}
            disabled={completeMutation.isPending}
            className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Send size={14} /> {completeMutation.isPending ? 'Wird abgeschlossen...' : 'Audit abschliessen'}
          </button>
          <button
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="flex items-center gap-xs px-md py-sm border border-red-300 text-red-600 text-small hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} /> Abbrechen
          </button>
        </div>
      )}

      {/* Score Summary (completed) */}
      {session.status === 'COMPLETED' && session.overallScore != null && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl text-center">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtscore</span>
          <div className={`font-display text-h1 mt-sm ${session.overallScore >= 80 ? 'text-emerald-600' : session.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {session.overallScore.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Categories & Criteria */}
      <div className="space-y-md">
        {categories.map((cat: any) => {
          const isExpanded = expandedCategory === cat.id || expandedCategory === null;
          const criteria = cat.criteria ?? [];
          const catResponses = criteria.map((c: any) => getResponse(c.id)).filter(Boolean);
          const answeredCount = catResponses.length;

          return (
            <div key={cat.id} className="bg-kore-white border border-kore-border">
              <button
                onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                className="w-full flex items-center justify-between p-lg text-left hover:bg-kore-bg transition-colors"
              >
                <div>
                  <h2 className="text-body font-medium text-kore-ink">{cat.name}</h2>
                  {cat.description && <p className="text-small text-kore-mid mt-xs">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-md text-small text-kore-mid">
                  <span>Gewicht: {cat.weight}x</span>
                  <span>{answeredCount}/{criteria.length} bewertet</span>
                </div>
              </button>

              {isExpanded && criteria.length > 0 && (
                <div className="border-t border-kore-border">
                  {criteria.map((crit: any) => {
                    const resp = getResponse(crit.id);
                    return (
                      <CriterionRow
                        key={crit.id}
                        criterion={crit}
                        response={resp}
                        isEditable={isEditable}
                        onPassFail={(passed) => handlePassFail(crit.id, passed)}
                        onScore={(score) => handleScore(crit.id, score)}
                        onComment={(comment) => handleComment(crit.id, comment)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="bg-kore-white border border-kore-border p-lg mt-xl">
          <h3 className="text-body font-medium text-kore-ink mb-sm">Notizen</h3>
          <p className="text-small text-kore-mid whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
    </div>
  );
}

function CriterionRow({
  criterion,
  response,
  isEditable,
  onPassFail,
  onScore,
  onComment,
}: {
  criterion: any;
  response: any;
  isEditable: boolean;
  onPassFail: (passed: boolean) => void;
  onScore: (score: number) => void;
  onComment: (comment: string) => void;
}) {
  const [comment, setComment] = useState(response?.comment ?? '');
  const [showComment, setShowComment] = useState(!!response?.comment);

  return (
    <div className="px-lg py-md border-b border-kore-border last:border-0">
      <div className="flex items-start justify-between gap-lg">
        <div className="flex-1 min-w-0">
          <span className="text-small font-medium text-kore-ink">{criterion.name}</span>
          {criterion.description && (
            <p className="text-caption text-kore-faint mt-xs">{criterion.description}</p>
          )}
          <div className="flex items-center gap-xs mt-xs text-caption text-kore-faint">
            {criterion.isRequired && <span className="text-red-500">Pflicht</span>}
            {criterion.photoRequired && <span>Foto erforderlich</span>}
          </div>
        </div>

        {/* Scoring controls */}
        <div className="flex items-center gap-sm flex-shrink-0">
          {/* Pass/Fail buttons */}
          <button
            onClick={() => isEditable && onPassFail(true)}
            disabled={!isEditable}
            className={`p-sm border transition-colors ${response?.passed === true ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'border-kore-border text-kore-faint hover:text-emerald-600'} disabled:opacity-50`}
          >
            <CheckCircle size={18} />
          </button>
          <button
            onClick={() => isEditable && onPassFail(false)}
            disabled={!isEditable}
            className={`p-sm border transition-colors ${response?.passed === false ? 'bg-red-50 border-red-300 text-red-600' : 'border-kore-border text-kore-faint hover:text-red-600'} disabled:opacity-50`}
          >
            <XCircle size={18} />
          </button>

          {/* Score slider */}
          <div className="flex items-center gap-xs">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={response?.scorePercent ?? 50}
              onChange={(e) => isEditable && onScore(Number(e.target.value))}
              disabled={!isEditable}
              className="w-20 h-1 accent-kore-ink"
            />
            <span className="text-caption text-kore-mid w-8 text-right">{response?.scorePercent ?? '-'}%</span>
          </div>

          {/* Comment toggle */}
          <button
            onClick={() => setShowComment(!showComment)}
            className="text-caption text-kore-faint hover:text-kore-ink transition-colors"
          >
            {showComment ? 'Kommentar' : 'Komm.'}
          </button>
        </div>
      </div>

      {showComment && (
        <div className="mt-sm">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onBlur={() => { if (comment !== (response?.comment ?? '')) onComment(comment); }}
            placeholder="Kommentar..."
            rows={2}
            disabled={!isEditable}
            className="w-full border border-kore-border px-md py-xs text-small bg-kore-white focus:outline-none focus:border-kore-brass disabled:opacity-50 resize-none"
          />
        </div>
      )}
    </div>
  );
}
