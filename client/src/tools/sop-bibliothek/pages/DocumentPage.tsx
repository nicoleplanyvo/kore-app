import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, CheckCircle } from 'lucide-react';
import { useSopDocument } from '../../../hooks/useSop';
import { SopStatusBadge } from '../components/SopStatusBadge';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { api } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: doc, isLoading } = useSopDocument(id);

  const acknowledgeMutation = useMutation({
    mutationFn: () => api(`/api/tools/sop/acknowledgments/documents/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sop', 'document', id] }),
  });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade SOP...</div>;
  if (!doc) return <div className="p-xl text-body text-kore-mid">SOP nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/tools/sop" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück zur Bibliothek</Link>

      <div className="bg-kore-white border border-kore-border">
        <div className="p-xl border-b border-kore-border">
          <div className="flex items-start justify-between gap-lg">
            <div>
              <h1 className="font-display text-h1 text-kore-ink">{doc.title}</h1>
              <div className="flex items-center gap-md mt-md flex-wrap">
                <SopStatusBadge status={doc.status} />
                {doc.category && <span className="text-small text-kore-mid">{doc.category.name}</span>}
                <span className="text-small text-kore-faint">Version {doc.version}</span>
                {doc.creator && <span className="text-small text-kore-faint">von {doc.creator.name}</span>}
                <span className="text-small text-kore-faint">{new Date(doc.updatedAt).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
            <div className="flex items-center gap-md flex-shrink-0">
              <button onClick={() => navigate(`/tools/sop/documents/${id}/edit`)} className="flex items-center gap-sm border border-kore-border text-kore-ink px-md py-sm text-small hover:bg-kore-bg transition-colors"><Edit size={14} /> Bearbeiten</button>
            </div>
          </div>
        </div>

        <div className="p-xl">
          <MarkdownRenderer content={doc.content} />
        </div>

        <div className="p-xl border-t border-kore-border flex items-center justify-between">
          <div className="text-small text-kore-mid">
            {doc._count?.acknowledgments ?? 0} Kenntnisnahmen
          </div>
          {!doc.userAcknowledged ? (
            <button onClick={() => acknowledgeMutation.mutate()} disabled={acknowledgeMutation.isPending} className="flex items-center gap-sm bg-emerald-600 text-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50">
              <CheckCircle size={16} /> Gelesen & Verstanden
            </button>
          ) : (
            <span className="flex items-center gap-sm text-small text-emerald-600 font-medium"><CheckCircle size={16} /> Bereits bestätigt</span>
          )}
        </div>
      </div>
    </div>
  );
}
