import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Newspaper, Plus, Send, Archive, Copy, Save, Trash2,
  X, Eye, Layers, GripVertical, ChevronUp, ChevronDown, Pencil,
} from 'lucide-react';
import {
  useNewsletter, useUpdateNewsletter, usePublishNewsletter,
  useArchiveNewsletter, useDuplicateNewsletter,
  useAddNewsletterSection, useUpdateNewsletterSection,
  useDeleteNewsletterSection, useReorderSections,
  useRecordNewsletterView,
} from '../../../hooks/useNewsletter';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Veroeffentlicht',
  ARCHIVED: 'Archiviert',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-blue-100 text-blue-700',
};

export function EditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: newsletter, isLoading } = useNewsletter(id);

  const updateNl = useUpdateNewsletter();
  const publish = usePublishNewsletter();
  const archiveNl = useArchiveNewsletter();
  const duplicateNl = useDuplicateNewsletter();
  const addSection = useAddNewsletterSection();
  const updateSection = useUpdateNewsletterSection();
  const deleteSection = useDeleteNewsletterSection();
  const reorder = useReorderSections();
  const recordView = useRecordNewsletterView();

  // Header editing
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ title: '', content: '' });

  // Section form
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [sectionForm, setSectionForm] = useState({ title: '', content: '' });

  // Section editing
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionForm, setEditSectionForm] = useState({ title: '', content: '' });

  // Record view on load
  useEffect(() => {
    if (id && newsletter?.status === 'PUBLISHED') {
      recordView.mutate(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, newsletter?.status]);

  // Sync header form
  useEffect(() => {
    if (newsletter) {
      setHeaderForm({ title: newsletter.title, content: newsletter.content || '' });
    }
  }, [newsletter]);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Newsletter...</div>;
  if (!newsletter) return <div className="p-xl text-body text-kore-mid">Newsletter nicht gefunden.</div>;

  const isDraft = newsletter.status === 'DRAFT';
  const sections = newsletter.sections || [];

  const handleSaveHeader = () => {
    updateNl.mutate(
      { id: newsletter.id, title: headerForm.title, content: headerForm.content || undefined },
      { onSuccess: () => setEditingHeader(false) },
    );
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    addSection.mutate(
      { id: newsletter.id, title: sectionForm.title, content: sectionForm.content },
      { onSuccess: () => { setShowSectionForm(false); setSectionForm({ title: '', content: '' }); } },
    );
  };

  const handleUpdateSection = (sectionId: string) => {
    updateSection.mutate(
      { sectionId, title: editSectionForm.title, content: editSectionForm.content },
      { onSuccess: () => setEditingSectionId(null) },
    );
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!confirm('Abschnitt wirklich loeschen?')) return;
    deleteSection.mutate(sectionId);
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const ids = sections.map((s: any) => s.id);
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    const newOrder = [...ids];
    [newOrder[index], newOrder[swapIdx]] = [newOrder[swapIdx]!, newOrder[index]!];
    reorder.mutate({ id: newsletter.id, order: newOrder as string[] });
  };

  const handlePublish = () => {
    if (!confirm('Newsletter jetzt veroeffentlichen?')) return;
    publish.mutate(newsletter.id);
  };

  const handleArchive = () => {
    if (!confirm('Newsletter archivieren?')) return;
    archiveNl.mutate(newsletter.id, {
      onSuccess: () => navigate('/tools/newsletter'),
    });
  };

  const handleDuplicate = () => {
    duplicateNl.mutate(newsletter.id, {
      onSuccess: (data: any) => {
        if (data?.id) navigate(`/tools/newsletter/${data.id}`);
      },
    });
  };

  return (
    <div className="p-lg max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/newsletter" className="text-kore-mid hover:text-kore-ink">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-sm">
            <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm truncate">
              <Newspaper size={24} />
              {newsletter.title}
            </h1>
            <span className={`px-sm py-xs text-xs shrink-0 ${STATUS_COLORS[newsletter.status] ?? 'bg-kore-bg text-kore-mid'}`}>
              {STATUS_LABELS[newsletter.status] ?? newsletter.status}
            </span>
          </div>
          <p className="text-small text-kore-mid mt-xs">
            {newsletter.creator?.name ?? '--'}
            {newsletter.publishedAt && ` | Veroeffentlicht: ${new Date(newsletter.publishedAt).toLocaleDateString('de-DE')}`}
            {` | ${newsletter._count?.views ?? 0} Aufrufe`}
            {` | ${sections.length} Abschnitte`}
          </p>
        </div>
        <div className="flex items-center gap-xs shrink-0">
          {isDraft && (
            <button
              onClick={handlePublish}
              disabled={publish.isPending}
              className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <Send size={14} /> {publish.isPending ? 'Wird veroeffentlicht...' : 'Veroeffentlichen'}
            </button>
          )}
          <button
            onClick={handleDuplicate}
            title="Als Vorlage duplizieren"
            className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink"
          >
            <Copy size={16} />
          </button>
          {newsletter.status !== 'ARCHIVED' && (
            <button
              onClick={handleArchive}
              title="Archivieren"
              className="p-sm border border-kore-border text-kore-mid hover:text-blue-600"
            >
              <Archive size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Newsletter Header Section */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        {editingHeader ? (
          <div className="space-y-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input
                value={headerForm.title}
                onChange={(e) => setHeaderForm({ ...headerForm, title: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body font-display text-h3"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Einleitung</label>
              <textarea
                value={headerForm.content}
                onChange={(e) => setHeaderForm({ ...headerForm, content: e.target.value })}
                rows={4}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder="Einleitungstext oder Zusammenfassung..."
              />
            </div>
            <div className="flex gap-sm">
              <button
                onClick={handleSaveHeader}
                disabled={updateNl.isPending}
                className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
              >
                <Save size={14} /> Speichern
              </button>
              <button
                onClick={() => setEditingHeader(false)}
                className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <h2 className="font-display text-h2 text-kore-ink">{newsletter.title}</h2>
              {isDraft && (
                <button
                  onClick={() => setEditingHeader(true)}
                  className="p-sm text-kore-mid hover:text-kore-ink"
                  title="Bearbeiten"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
            {newsletter.content && (
              <p className="text-body text-kore-mid mt-sm whitespace-pre-wrap">{newsletter.content}</p>
            )}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-md mb-lg">
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-xl font-bold text-purple-600 flex items-center justify-center gap-xs">
            <Eye size={16} /> {newsletter._count?.views ?? 0}
          </div>
          <div className="text-xs text-kore-mid mt-1">Aufrufe</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-xl font-bold text-kore-brass flex items-center justify-center gap-xs">
            <Layers size={16} /> {sections.length}
          </div>
          <div className="text-xs text-kore-mid mt-1">Abschnitte</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-xl font-bold text-kore-ink">
            {new Date(newsletter.createdAt).toLocaleDateString('de-DE')}
          </div>
          <div className="text-xs text-kore-mid mt-1">Erstellt</div>
        </div>
      </div>

      {/* Sections Header */}
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-display text-h3 text-kore-ink">
          Abschnitte ({sections.length})
        </h2>
        {isDraft && (
          <button
            onClick={() => setShowSectionForm(!showSectionForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={14} /> Abschnitt hinzufuegen
          </button>
        )}
      </div>

      {/* Add Section Form */}
      {showSectionForm && (
        <form onSubmit={handleAddSection} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Abschnitt-Titel</label>
            <input
              value={sectionForm.title}
              onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              className="w-full border border-kore-border px-md py-sm text-body"
              placeholder="z.B. Neuigkeiten, Highlights, Termine..."
              required
            />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Inhalt</label>
            <textarea
              value={sectionForm.content}
              onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
              rows={6}
              className="w-full border border-kore-border px-md py-sm text-body"
              placeholder="Abschnitt-Inhalt hier eingeben..."
              required
            />
          </div>
          <div className="flex gap-sm">
            <button
              type="submit"
              disabled={addSection.isPending}
              className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <Plus size={14} /> Hinzufuegen
            </button>
            <button
              type="button"
              onClick={() => setShowSectionForm(false)}
              className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Sections List */}
      {!sections.length ? (
        <div className="bg-kore-white border border-kore-border p-xl text-center text-kore-mid mb-lg">
          Noch keine Abschnitte vorhanden.
          {isDraft && ' Fuegen Sie den ersten Abschnitt hinzu.'}
        </div>
      ) : (
        <div className="space-y-md mb-lg">
          {sections.map((s: any, index: number) => (
            <div key={s.id} className="bg-kore-white border border-kore-border">
              {editingSectionId === s.id ? (
                /* Edit Mode */
                <div className="p-lg space-y-md">
                  <div>
                    <label className="block text-small text-kore-mid mb-xs">Titel</label>
                    <input
                      value={editSectionForm.title}
                      onChange={(e) =>
                        setEditSectionForm({ ...editSectionForm, title: e.target.value })
                      }
                      className="w-full border border-kore-border px-md py-sm text-body"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-small text-kore-mid mb-xs">Inhalt</label>
                    <textarea
                      value={editSectionForm.content}
                      onChange={(e) =>
                        setEditSectionForm({ ...editSectionForm, content: e.target.value })
                      }
                      rows={6}
                      className="w-full border border-kore-border px-md py-sm text-body"
                      required
                    />
                  </div>
                  <div className="flex gap-sm">
                    <button
                      onClick={() => handleUpdateSection(s.id)}
                      disabled={updateSection.isPending}
                      className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                    >
                      <Save size={14} /> Speichern
                    </button>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-lg">
                  <div className="flex items-start gap-sm">
                    {isDraft && (
                      <div className="flex flex-col gap-xs shrink-0 pt-1">
                        <button
                          onClick={() => handleMoveSection(index, 'up')}
                          disabled={index === 0}
                          className="text-kore-mid hover:text-kore-ink disabled:opacity-20"
                          title="Nach oben"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <GripVertical size={14} className="text-kore-mid/40" />
                        <button
                          onClick={() => handleMoveSection(index, 'down')}
                          disabled={index === sections.length - 1}
                          className="text-kore-mid hover:text-kore-ink disabled:opacity-20"
                          title="Nach unten"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-h3 text-kore-ink mb-sm">{s.title}</h3>
                      <p className="text-body text-kore-mid whitespace-pre-wrap">{s.content}</p>
                    </div>
                    {isDraft && (
                      <div className="flex items-center gap-xs shrink-0">
                        <button
                          onClick={() => {
                            setEditingSectionId(s.id);
                            setEditSectionForm({ title: s.title, content: s.content });
                          }}
                          className="p-sm text-kore-mid hover:text-kore-ink"
                          title="Bearbeiten"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(s.id)}
                          className="p-sm text-kore-mid hover:text-red-600"
                          title="Loeschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview / Info */}
      <div className="bg-kore-bg border border-kore-border p-lg text-center">
        <p className="text-small text-kore-mid">
          {isDraft
            ? 'Dieser Newsletter ist noch ein Entwurf. Fuegen Sie Abschnitte hinzu und veroeffentlichen Sie ihn, wenn er fertig ist.'
            : newsletter.status === 'PUBLISHED'
              ? 'Dieser Newsletter wurde veroeffentlicht und ist fuer alle Teammitglieder sichtbar.'
              : 'Dieser Newsletter wurde archiviert.'}
        </p>
      </div>
    </div>
  );
}
