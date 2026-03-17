import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Calendar, Layers, CheckCircle } from 'lucide-react';
import { useVmGuidelineDoc, useConfirmReadGuideline, usePublishVmGuidelineDoc, useArchiveVmGuidelineDoc } from '../../../hooks/useVmGuidelines';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', PUBLISHED: 'Veroeffentlicht', ARCHIVED: 'Archiviert' };

export function GuidelineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: doc, isLoading } = useVmGuidelineDoc(id);
  const confirmRead = useConfirmReadGuideline();
  const publishMutation = usePublishVmGuidelineDoc();
  const archiveMutation = useArchiveVmGuidelineDoc();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!doc) return <div className="p-xl text-body text-kore-mid">Guideline nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/app/tools/vm-guidelines" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurueck zur Bibliothek
      </Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <div className="flex items-center gap-md mb-sm">
            <span className={`text-caption px-md py-xs uppercase tracking-widest ${doc.status === 'PUBLISHED' ? 'text-emerald-600 bg-emerald-50' : doc.status === 'DRAFT' ? 'text-amber-600 bg-amber-50' : 'text-kore-faint bg-kore-bg'}`}>
              {STATUS_LABELS[doc.status] || doc.status}
            </span>
            {doc.category && <span className="text-caption text-kore-faint">{doc.category}</span>}
          </div>
          <h1 className="font-display text-h1 text-kore-ink">{doc.title}</h1>
        </div>
        <div className="flex gap-sm">
          {doc.status === 'DRAFT' && (
            <button onClick={() => publishMutation.mutate(doc.id)} disabled={publishMutation.isPending} className="px-lg py-md-sm border border-emerald-600 text-emerald-600 text-small font-medium uppercase tracking-widest hover:bg-emerald-50 transition-colors disabled:opacity-50">
              Veroeffentlichen
            </button>
          )}
          {doc.status === 'PUBLISHED' && (
            <button onClick={() => archiveMutation.mutate(doc.id)} disabled={archiveMutation.isPending} className="px-lg py-md-sm border border-kore-border text-kore-mid text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors disabled:opacity-50">
              Archivieren
            </button>
          )}
          <Link to={`/app/tools/vm-guidelines/manage?edit=${doc.id}`} className="px-lg py-md-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs"><Layers size={14} /> Version</div>
          <div className="font-display text-h2 text-kore-ink">{doc.version}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs"><Calendar size={14} /> Gueltig ab</div>
          <div className="text-body text-kore-ink">{doc.effectiveFrom ? new Date(doc.effectiveFrom).toLocaleDateString('de-DE') : '-'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Bilder</div>
          <div className="font-display text-h2 text-kore-ink">{doc.images?.length ?? 0}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Aktualisiert</div>
          <div className="text-body text-kore-ink">{new Date(doc.updatedAt).toLocaleDateString('de-DE')}</div>
        </div>
      </div>

      {/* Images */}
      {doc.images && doc.images.length > 0 && (
        <div className="mb-2xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Bilder</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {doc.images.map((img: any) => (
              <div key={img.id} className="bg-kore-white border border-kore-border">
                <img src={img.imagePath} alt={img.caption || 'Guideline'} className="w-full aspect-video object-cover" />
                {img.caption && <p className="p-md text-small text-kore-mid">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="bg-kore-white border border-kore-border p-xl mb-xl">
        <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><BookOpen size={18} /> Anweisungen</h2>
        <div className="prose prose-sm max-w-none text-kore-ink whitespace-pre-wrap">{doc.content}</div>
      </div>

      {/* Read confirmation */}
      {doc.status === 'PUBLISHED' && (
        <div className="flex justify-end">
          <button
            onClick={() => confirmRead.mutate(doc.id)}
            disabled={confirmRead.isPending || confirmRead.isSuccess}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <CheckCircle size={16} /> {confirmRead.isSuccess ? 'Gelesen bestaetigt' : 'Als gelesen markieren'}
          </button>
        </div>
      )}
    </div>
  );
}
