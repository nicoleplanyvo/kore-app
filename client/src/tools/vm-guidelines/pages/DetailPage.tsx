import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Image } from 'lucide-react';
import { useVmGuidelineDoc, usePublishVmGuidelineDoc, useArchiveVmGuidelineDoc } from '../../../hooks/useVmGuidelines';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Veröffentlicht',
  ARCHIVED: 'Archiviert',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-kore-bg text-kore-mid border-kore-border',
};

export function DetailPage() {
  const { id } = useParams();
  const { data: doc, isLoading } = useVmGuidelineDoc(id);
  const publish = usePublishVmGuidelineDoc();
  const archive = useArchiveVmGuidelineDoc();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!doc) return <div className="p-xl text-body text-kore-mid">Guideline nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/vm-guidelines" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">{doc.title}</h1>
          <div className="flex items-center gap-md mt-xs">
            {doc.category && <span className="text-small text-kore-mid">{doc.category}</span>}
            <span className="text-small text-kore-faint">Version {doc.version}</span>
            {doc.effectiveFrom && <span className="text-small text-kore-faint">Gültig ab {doc.effectiveFrom}</span>}
          </div>
        </div>
        <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[doc.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
          {STATUS_LABELS[doc.status] ?? String(doc.status)}
        </span>
      </div>

      {doc.status === 'DRAFT' && (
        <div className="flex gap-sm mb-xl">
          <button onClick={() => publish.mutate(doc.id)} className="px-md py-sm bg-emerald-600 text-kore-white text-small hover:bg-emerald-700">
            Veröffentlichen
          </button>
        </div>
      )}
      {doc.status === 'PUBLISHED' && (
        <div className="flex gap-sm mb-xl">
          <button onClick={() => archive.mutate(doc.id)} className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg">
            Archivieren
          </button>
        </div>
      )}

      <div className="bg-kore-white border border-kore-border p-xl mb-xl">
        <div className="prose prose-sm max-w-none text-kore-ink whitespace-pre-wrap">{doc.content}</div>
      </div>

      {doc.images && doc.images.length > 0 && (
        <div>
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-xs"><Image size={18} /> Bilder</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
            {doc.images.map((img: any) => (
              <div key={img.id} className="bg-kore-white border border-kore-border p-sm">
                <div className="aspect-video bg-kore-bg flex items-center justify-center text-kore-faint text-small">
                  {img.imagePath}
                </div>
                {img.caption && <p className="text-small text-kore-mid mt-xs">{img.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
