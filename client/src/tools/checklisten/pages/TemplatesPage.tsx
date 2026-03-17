import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useChecklistTemplates, useCreateTemplate, useDeleteTemplate, useUpdateTemplate } from '../../../hooks/useChecklist';

export function TemplatesPage() {
  const { data: templates, isLoading } = useChecklistTemplates();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const deleteTemplate = useDeleteTemplate();

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/checklisten" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-brass transition-colors mb-lg">
        <ArrowLeft size={14} />
        Zurueck
      </Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Vorlagen</h1>
          <p className="text-body text-kore-mid mt-xs">Checklisten-Vorlagen verwalten und erstellen</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingId(null); }}
          className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
        >
          <Plus size={16} />
          Neue Vorlage
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editingId) && (
        <TemplateForm
          template={editingId ? templates?.find(t => t.id === editingId) : undefined}
          onClose={() => { setShowCreate(false); setEditingId(null); }}
        />
      )}

      {/* Templates List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Vorlagen...</div>
      ) : templates && templates.length > 0 ? (
        <div className="space-y-md">
          {templates.map(t => {
            const totalItems = t.sections?.reduce((s: number, sec: any) => s + (sec.items?.length || sec._count?.items || 0), 0) || 0;
            const isExpanded = expandedId === t.id;

            return (
              <div key={t.id} className="bg-kore-white border border-kore-border">
                <div className="flex items-center justify-between p-lg">
                  <div className="flex items-center gap-md cursor-pointer flex-1" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                    <FileText size={18} className="text-kore-brass flex-shrink-0" />
                    <div>
                      <h3 className="font-display text-h4 text-kore-ink">
                        {t.name}
                        {t.isDefault && (
                          <span className="ml-sm text-caption text-kore-brass uppercase tracking-widest">(Standard)</span>
                        )}
                      </h3>
                      {t.description && <p className="text-small text-kore-mid mt-xxs">{t.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-md">
                    <span className="text-small text-kore-mid">{totalItems} Punkte</span>
                    <span className="text-small text-kore-faint">v{t.version}</span>
                    {t._count?.sessions > 0 && (
                      <span className="text-small text-kore-faint">{t._count.sessions}x verwendet</span>
                    )}

                    {!t.isDefault && (
                      <>
                        <button
                          onClick={() => { setEditingId(t.id); setShowCreate(false); }}
                          className="p-xs text-kore-mid hover:text-kore-brass transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Vorlage wirklich loeschen?')) deleteTemplate.mutate(t.id); }}
                          className="p-xs text-kore-mid hover:text-red-600 transition-colors"
                          title="Loeschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}

                    <button onClick={() => setExpandedId(isExpanded ? null : t.id)} className="p-xs text-kore-mid">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: show sections + items */}
                {isExpanded && t.sections && (
                  <div className="border-t border-kore-border px-lg pb-lg pt-md">
                    {t.sections.map((sec: any) => (
                      <div key={sec.id} className="mb-md">
                        <h4 className="text-small font-medium text-kore-ink uppercase tracking-widest mb-xs">{sec.name}</h4>
                        <ul className="space-y-xxs">
                          {sec.items?.map((item: any) => (
                            <li key={item.id} className="text-small text-kore-mid flex items-center gap-sm">
                              <span className="w-1.5 h-1.5 bg-kore-brass rounded-full flex-shrink-0" />
                              {item.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <FileText size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Vorlagen</h2>
          <p className="text-body text-kore-mid max-w-md">Erstellen Sie Ihre erste Checklisten-Vorlage.</p>
        </div>
      )}
    </div>
  );
}

// ── Template Form ────────────────────────────────────────
function TemplateForm({ template, onClose }: { template?: any; onClose: () => void }) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [recurrence, setRecurrence] = useState(template?.recurrence || '');
  const [sections, setSections] = useState<{ name: string; items: string[] }[]>(
    template?.sections?.map((s: any) => ({
      name: s.name,
      items: s.items?.map((i: any) => i.text) || [''],
    })) || [{ name: 'Allgemein', items: [''] }],
  );

  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const isPending = createTemplate.isPending || updateTemplate.isPending;

  const handleSubmit = () => {
    if (!name.trim() || sections.some(s => !s.name.trim() || s.items.every(i => !i.trim()))) return;

    const payload = {
      name,
      description: description || undefined,
      recurrence: recurrence || undefined,
      sections: sections.map((sec, si) => ({
        name: sec.name,
        sortOrder: si,
        items: sec.items.filter(i => i.trim()).map((text, ii) => ({ text, sortOrder: ii })),
      })),
    };

    if (template) {
      updateTemplate.mutate({ id: template.id, ...payload }, { onSuccess: () => onClose() });
    } else {
      createTemplate.mutate(payload, { onSuccess: () => onClose() });
    }
  };

  const addSection = () => setSections([...sections, { name: '', items: [''] }]);

  const updateSection = (idx: number, field: string, value: string) => {
    const next = [...sections];
    (next[idx] as any)[field] = value;
    setSections(next);
  };

  const addItem = (secIdx: number) => {
    const next = [...sections];
    next[secIdx].items.push('');
    setSections(next);
  };

  const updateItem = (secIdx: number, itemIdx: number, value: string) => {
    const next = [...sections];
    next[secIdx].items[itemIdx] = value;
    setSections(next);
  };

  const removeItem = (secIdx: number, itemIdx: number) => {
    const next = [...sections];
    next[secIdx].items = next[secIdx].items.filter((_, i) => i !== itemIdx);
    if (next[secIdx].items.length === 0) next[secIdx].items = [''];
    setSections(next);
  };

  const removeSection = (idx: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-kore-white border border-kore-border mb-xl">
      <div className="p-xl border-b border-kore-border">
        <h2 className="font-display text-h3 text-kore-ink">{template ? 'Vorlage bearbeiten' : 'Neue Vorlage'}</h2>
      </div>

      <div className="p-xl space-y-lg">
        {/* Name */}
        <div>
          <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Taeglich Oeffnung" className="w-full border border-kore-border px-md py-sm text-small" />
        </div>

        {/* Description */}
        <div>
          <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Beschreibung</label>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optionale Beschreibung" className="w-full border border-kore-border px-md py-sm text-small" />
        </div>

        {/* Recurrence */}
        <div>
          <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Wiederholung</label>
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small">
            <option value="">Keine (einmalig)</option>
            <option value="daily">Taeglich</option>
            <option value="weekly">Woechentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>

        {/* Sections */}
        {sections.map((sec, si) => (
          <div key={si} className="border border-kore-border p-md">
            <div className="flex items-center gap-md mb-md">
              <input
                value={sec.name}
                onChange={e => updateSection(si, 'name', e.target.value)}
                placeholder="Abschnittsname"
                className="flex-1 border border-kore-border px-md py-xs text-small font-medium"
              />
              {sections.length > 1 && (
                <button onClick={() => removeSection(si)} className="text-small text-kore-mid hover:text-red-600">Entfernen</button>
              )}
            </div>

            {sec.items.map((item, ii) => (
              <div key={ii} className="flex gap-sm mb-sm">
                <input
                  value={item}
                  onChange={e => updateItem(si, ii, e.target.value)}
                  placeholder={`Pruefpunkt ${ii + 1}`}
                  className="flex-1 border border-kore-border px-md py-xs text-small"
                />
                {sec.items.length > 1 && (
                  <button onClick={() => removeItem(si, ii)} className="text-kore-mid hover:text-red-600 px-sm text-small">x</button>
                )}
              </div>
            ))}

            <button onClick={() => addItem(si)} className="text-small text-kore-brass hover:text-kore-brass-dk transition-colors">
              + Pruefpunkt
            </button>
          </div>
        ))}

        <button onClick={addSection} className="text-small text-kore-brass hover:text-kore-brass-dk transition-colors">
          + Abschnitt hinzufuegen
        </button>
      </div>

      <div className="p-xl border-t border-kore-border flex justify-end gap-md">
        <button onClick={onClose} className="px-lg py-sm text-small text-kore-mid hover:text-kore-ink transition-colors">Abbrechen</button>
        <button
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
        >
          {isPending ? 'Speichern...' : template ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </div>
  );
}
