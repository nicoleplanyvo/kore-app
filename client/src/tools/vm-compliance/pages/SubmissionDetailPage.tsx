import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useVmSubmissions } from '../../../hooks/useVmCompliance';
import { StatusBadge } from '../components/StatusBadge';
import { PhotoCompare } from '../components/PhotoCompare';
import { api } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useVmSubmissions({ page: 1 });
  const sub = (data?.data ?? []).find(s => s.id === id);
  const [reviewNote, setReviewNote] = useState('');

  const reviewMutation = useMutation({
    mutationFn: (status: string) => api(`/api/tools/vm-compliance/reviews/submissions/${id}/review`, { method: 'PUT', body: JSON.stringify({ status, reviewNote: reviewNote || undefined }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vm'] }); navigate('/tools/vm-compliance'); },
  });

  if (!sub) return <div className="p-xl text-body text-kore-mid">Submission nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>

      <div className="bg-kore-white border border-kore-border p-xl">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 className="font-display text-h1 text-kore-ink">{sub.guideline?.name}</h1>
            <div className="flex items-center gap-md mt-sm">
              <span className="text-small text-kore-mid">{sub.store?.name}</span>
              <span className="text-small text-kore-faint">von {sub.submitter?.name}</span>
              <span className="text-small text-kore-faint">{new Date(sub.submittedAt).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
          <StatusBadge status={sub.status} />
        </div>

        <PhotoCompare referencePhoto={sub.guideline?.referencePhoto ?? null} submittedPhoto={sub.photoPath} />

        {sub.status === 'PENDING' && (
          <div className="mt-xl border-t border-kore-border pt-xl">
            <label className="block text-small text-kore-mid uppercase tracking-widest mb-sm">Kommentar (optional)</label>
            <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3} className="w-full border border-kore-border px-lg py-md text-small focus:outline-none focus:border-kore-brass mb-lg" placeholder="Feedback zum eingereichten Foto..." />
            <div className="flex gap-md justify-end">
              <button onClick={() => reviewMutation.mutate('REJECTED')} disabled={reviewMutation.isPending} className="flex items-center gap-sm border border-red-300 text-red-600 px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"><XCircle size={16} /> Ablehnen</button>
              <button onClick={() => reviewMutation.mutate('APPROVED')} disabled={reviewMutation.isPending} className="flex items-center gap-sm bg-emerald-600 text-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50"><CheckCircle size={16} /> Genehmigen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
