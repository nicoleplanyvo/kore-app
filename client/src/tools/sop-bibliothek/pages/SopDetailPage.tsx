import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, FileText, Send, Archive, Users, Download } from 'lucide-react';
import {
  useSopDocument,
  useSopAcknowledgments,
  usePublishSop,
  useArchiveSop,
  useAcknowledgeSop,
} from '../../../hooks/useSop';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Freigegeben',
  ARCHIVED: 'Archiviert',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-amber-600 bg-amber-50 border-amber-200',
  PUBLISHED: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  ARCHIVED: 'text-kore-faint bg-kore-bg border-kore-border',
};

export function SopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sop, isLoading } = useSopDocument(id);
  const { data: acknowledgments } = useSopAcknowledgments(id);
  const publishMutation = usePublishSop();
  const archiveMutation = useArchiveSop();
  const acknowledgeMutation = useAcknowledgeSop();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade SOP...</div>;
  if (!sop) return <div className="p-xl text-body text-kore-mid">SOP nicht gefunden.</div>;

  const handlePublish = async () => {
    if (!confirm('SOP wirklich freigeben?')) return;
    await publishMutation.mutateAsync(sop.id);
  };

  const handleArchive = async () => {
    if (!confirm('SOP wirklich archivieren?')) return;
    await archiveMutation.mutateAsync(sop.id);
  };

  const handleAcknowledge = async () => {
    await acknowledgeMutation.mutateAsync(sop.id);
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-xl">
        <button onClick={() => navigate(-1)} className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-md">
            <h1 className="font-display text-h1 text-kore-ink truncate">{sop.title}</h1>
            <span className={`text-caption px-md py-xs border ${STATUS_COLORS[sop.status] ?? ''} uppercase tracking-widest flex-shrink-0`}>
              {STATUS_LABELS[sop.status] ?? sop.status}
            </span>
          </div>
          <div className="flex items-center gap-lg text-small text-kore-mid mt-xs">
            {sop.category && <span>{sop.category.name}</span>}
            <span className="flex items-center gap-xs"><Clock size={12} /> Version {sop.version}</span>
            {sop.creator && <span>von {sop.creator.name}</span>}
            <span>Erstellt: {new Date(sop.createdAt).toLocaleDateString('de-DE')}</span>
            <span>Aktualisiert: {new Date(sop.updatedAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-sm mb-xl">
        <Link
          to={`/app/tools/sop/sops/${sop.id}/edit`}
          className="flex items-center gap-xs px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors"
        >
          <FileText size={14} /> Bearbeiten
        </Link>
        {sop.status === 'DRAFT' && (
          <button
            onClick={handlePublish}
            disabled={publishMutation.isPending}
            className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Send size={14} /> {publishMutation.isPending ? 'Wird freigegeben...' : 'Freigeben'}
          </button>
        )}
        {sop.status === 'PUBLISHED' && (
          <>
            <button
              onClick={handleAcknowledge}
              disabled={acknowledgeMutation.isPending}
              className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass transition-colors disabled:opacity-50"
            >
              <CheckCircle size={14} /> {acknowledgeMutation.isPending ? 'Wird bestaetigt...' : 'Gelesen bestaetigen'}
            </button>
            <button
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
              className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:bg-kore-bg transition-colors disabled:opacity-50"
            >
              <Archive size={14} /> Archivieren
            </button>
          </>
        )}
        {sop.attachmentPath && (
          <a
            href={`/api/uploads/${sop.attachmentPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors"
          >
            <Download size={14} /> Anhang
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Content */}
        <div className="lg:col-span-2">
          <div className="bg-kore-white border border-kore-border p-xl">
            <div
              className="prose prose-sm max-w-none text-kore-ink"
              dangerouslySetInnerHTML={{ __html: formatContent(sop.content) }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-lg">
          {/* Version Info */}
          <div className="bg-kore-white border border-kore-border p-lg">
            <h3 className="text-body font-medium text-kore-ink mb-md flex items-center gap-xs">
              <Clock size={16} /> Versionierung
            </h3>
            <div className="space-y-sm text-small text-kore-mid">
              <div className="flex justify-between">
                <span>Aktuelle Version</span>
                <span className="font-medium text-kore-ink">v{sop.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Erstellt</span>
                <span>{new Date(sop.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
              <div className="flex justify-between">
                <span>Letzte Aenderung</span>
                <span>{new Date(sop.updatedAt).toLocaleDateString('de-DE')}</span>
              </div>
              {sop.publishedAt && (
                <div className="flex justify-between">
                  <span>Freigegeben</span>
                  <span>{new Date(sop.publishedAt).toLocaleDateString('de-DE')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Acknowledgments */}
          <div className="bg-kore-white border border-kore-border p-lg">
            <h3 className="text-body font-medium text-kore-ink mb-md flex items-center gap-xs">
              <Users size={16} /> Lesebestaetigung ({sop._count?.acknowledgments ?? 0})
            </h3>
            {acknowledgments && acknowledgments.length > 0 ? (
              <div className="space-y-sm max-h-64 overflow-y-auto">
                {acknowledgments.map((ack: any) => (
                  <div key={ack.id} className="flex items-center justify-between text-small">
                    <span className="text-kore-ink">{ack.user?.name ?? 'Unbekannt'}</span>
                    <span className="text-kore-faint">
                      {new Date(ack.acknowledgedAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-small text-kore-faint">Noch keine Lesebestaetigung vorhanden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Simple markdown-like rendering */
function formatContent(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
