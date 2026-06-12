import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X, Lock } from 'lucide-react';
import { useSpotCheck, useReviewSpotCheckTarget, useCloseSpotCheck, formatDeadline } from '../../../hooks/useSpotChecks';
import { useEffectiveRole } from '../../../hooks/useEffectiveRole';
import { AuthImage } from '../../../components/AuthImage';
/* eslint-disable @typescript-eslint/no-explicit-any */

const TARGET_LABELS: Record<string, string> = {
  PENDING: 'Offen', SUBMITTED: 'Eingereicht', APPROVED: 'Freigegeben', REJECTED: 'Nachbesserung', OVERDUE: 'Überfällig',
};
const TARGET_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50', SUBMITTED: 'text-sky-700 bg-sky-50',
  APPROVED: 'text-emerald-600 bg-emerald-50', REJECTED: 'text-red-600 bg-red-50', OVERDUE: 'text-red-700 bg-red-100',
};

export function SpotCheckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useEffectiveRole();
  const isManager = hasRole('multisite_manager');
  const { data: request, isLoading } = useSpotCheck(id);
  const reviewMutation = useReviewSpotCheckTarget();
  const closeMutation = useCloseSpotCheck();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  if (isLoading) return <div className="p-xl"><p className="text-small text-kore-mid">Lädt...</p></div>;
  if (!request) return <div className="p-xl"><p className="text-small text-kore-mid">Anfrage nicht gefunden.</p></div>;

  const dl = formatDeadline(request.deadline);
  const targets = request.targets ?? [];
  const submitted = targets.filter((t: any) => ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(t.status)).length;
  const approved = targets.filter((t: any) => t.status === 'APPROVED').length;

  const review = (targetId: string, status: 'APPROVED' | 'REJECTED', note?: string) => {
    reviewMutation.mutate(
      { requestId: request.id, targetId, status, reviewNote: note || undefined },
      { onSuccess: () => { setRejectingId(null); setRejectNote(''); } },
    );
  };

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/app/tools/vm-compliance/spot-checks" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Spot-Checks
      </Link>

      <div className="flex items-start justify-between mb-xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">{request.title}</h1>
          <p className="text-small text-kore-mid mt-xs">
            {request.category ? `${request.category} · ` : ''}von {request.creator?.name} · Deadline {new Date(request.deadline).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        {request.status === 'ACTIVE' ? (
          <span className={`px-md py-xs text-caption uppercase tracking-widest shrink-0 ${dl.overdue ? TARGET_COLORS['OVERDUE'] : dl.urgent ? 'text-amber-700 bg-amber-100' : 'text-kore-mid bg-kore-bg'}`}>{dl.label}</span>
        ) : (
          <span className="px-md py-xs text-caption uppercase tracking-widest text-kore-mid bg-kore-bg shrink-0">Geschlossen</span>
        )}
      </div>

      {request.instructions && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <p className="text-small text-kore-mid whitespace-pre-wrap">{request.instructions}</p>
        </div>
      )}

      {request.referencePhoto && (
        <div className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Referenz — so soll es aussehen</h2>
          <AuthImage src={request.referencePhoto} alt="Referenzfoto" className="max-h-72 object-contain border border-kore-border" />
        </div>
      )}

      <div className="flex items-center justify-between mb-lg">
        <h2 className="font-display text-h3 text-kore-ink">Status — {submitted}/{targets.length} eingereicht, {approved} freigegeben</h2>
        {isManager && request.status === 'ACTIVE' && (
          <button onClick={() => closeMutation.mutate(request.id)} disabled={closeMutation.isPending} className="flex items-center gap-sm border border-kore-border text-kore-mid px-lg py-sm text-caption uppercase tracking-widest hover:text-kore-ink transition-colors">
            <Lock size={14} /> Anfrage schließen
          </button>
        )}
      </div>

      <div className="space-y-md">
        {targets.map((t: any) => (
          <div key={t.id} className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center justify-between gap-md flex-wrap">
              <div className="min-w-0">
                <p className="text-body text-kore-ink">{t.store.name}{t.store.city ? ` (${t.store.city})` : ''}</p>
                <p className="text-small text-kore-mid">
                  {t.submittedAt
                    ? `Eingereicht ${new Date(t.submittedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                    : 'Noch keine Einreichung'}
                  {t.reviewNote ? ` · Anmerkung: ${t.reviewNote}` : ''}
                </p>
              </div>
              <span className={`px-md py-xs text-caption uppercase tracking-widest shrink-0 ${TARGET_COLORS[t.status] ?? 'text-kore-mid bg-kore-bg'}`}>
                {TARGET_LABELS[t.status] ?? t.status}
              </span>
            </div>

            {t.photoPath && (
              <div className="mt-lg grid grid-cols-1 md:grid-cols-2 gap-lg items-start">
                {request.referencePhoto && (
                  <div>
                    <p className="text-caption text-kore-faint uppercase tracking-widest mb-sm">Referenz</p>
                    <AuthImage src={request.referencePhoto} alt="Referenz" className="w-full max-h-64 object-contain border border-kore-border" />
                  </div>
                )}
                <div>
                  <p className="text-caption text-kore-faint uppercase tracking-widest mb-sm">Einreichung {t.store.name}</p>
                  <AuthImage src={t.photoPath} alt={`Foto ${t.store.name}`} className="w-full max-h-64 object-contain border border-kore-border" />
                  {t.comment && <p className="text-small text-kore-mid mt-sm">{t.comment}</p>}
                </div>
              </div>
            )}

            {isManager && t.status === 'SUBMITTED' && (
              <div className="mt-lg border-t border-kore-border pt-lg">
                {rejectingId === t.id ? (
                  <div className="flex gap-md items-start flex-wrap">
                    <input
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Was muss nachgebessert werden?"
                      className="flex-1 min-w-48 border border-kore-border px-md py-sm text-small bg-kore-white"
                    />
                    <button onClick={() => review(t.id, 'REJECTED', rejectNote)} disabled={reviewMutation.isPending} className="bg-red-600 text-kore-white px-lg py-sm text-caption uppercase tracking-widest disabled:opacity-50">Ablehnen</button>
                    <button onClick={() => { setRejectingId(null); setRejectNote(''); }} className="border border-kore-border px-lg py-sm text-caption uppercase tracking-widest text-kore-mid">Abbrechen</button>
                  </div>
                ) : (
                  <div className="flex gap-md">
                    <button onClick={() => review(t.id, 'APPROVED')} disabled={reviewMutation.isPending} className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-sm text-caption uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50">
                      <Check size={14} /> Freigeben
                    </button>
                    <button onClick={() => setRejectingId(t.id)} className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-sm text-caption uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-colors">
                      <X size={14} /> Nachbesserung anfordern
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
