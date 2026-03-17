import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Trash2, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuditTemplates, useCreateAuditTemplate, useDeleteAuditTemplate } from '../../../hooks/useAudit';
import { api } from '../../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function TemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = useAuditTemplates();
  const createMutation = useCreateAuditTemplate();
  const deleteMutation = useDeleteAuditTemplate();
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({ name: newName, description: newDescription || undefined });
    setNewName('');
    setNewDescription('');
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Template wirklich deaktivieren?')) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleClone = async (id: string) => {
    await api(`/api/tools/sea/templates/${id}/clone`, { method: 'POST' });
    qc.invalidateQueries({ queryKey: ['audit', 'templates'] });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <button onClick={() => navigate(-1)} className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Audit Templates</h1>
          <p className="text-body text-kore-mid mt-xs">Vorlagen mit Kategorien und Kriterien verwalten</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
        >
          <Plus size={16} /> Neues Template
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h2 className="text-body font-medium text-kore-ink mb-lg">Neues Template</h2>
          <div className="space-y-md">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Template-Name..."
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Beschreibung (optional)..."
              rows={2}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass resize-y"
            />
            <div className="flex gap-sm">
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || createMutation.isPending}
                className="px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Wird erstellt...' : 'Erstellen'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-md py-sm text-small text-kore-mid hover:text-kore-ink transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Templates...</div>
      ) : !templates || templates.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <Settings size={48} className="text-kore-faint mx-auto mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Templates vorhanden</h2>
          <p className="text-body text-kore-mid">Erstellen Sie Ihr erstes Audit-Template.</p>
        </div>
      ) : (
        <div className="space-y-sm">
          {templates.map((tmpl: any) => {
            const isExpanded = expandedId === tmpl.id;
            return (
              <div key={tmpl.id} className="bg-kore-white border border-kore-border">
                <div className="flex items-center justify-between p-lg">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}
                    className="flex items-center gap-md flex-1 text-left"
                  >
                    {isExpanded ? <ChevronDown size={16} className="text-kore-mid" /> : <ChevronRight size={16} className="text-kore-mid" />}
                    <div>
                      <h3 className="text-body font-medium text-kore-ink">
                        {tmpl.name}
                        {tmpl.isDefault && <span className="ml-sm text-caption text-kore-brass">(KORE Standard)</span>}
                      </h3>
                      <div className="text-small text-kore-mid mt-xs">
                        {tmpl.categories?.length ?? 0} Kategorien — Version {tmpl.version}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-xs">
                    <button
                      onClick={() => handleClone(tmpl.id)}
                      className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink transition-colors"
                      title="Kopieren"
                    >
                      <Copy size={14} />
                    </button>
                    {!tmpl.isDefault && (
                      <button
                        onClick={() => handleDelete(tmpl.id)}
                        disabled={deleteMutation.isPending}
                        className="p-sm border border-red-200 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        title="Deaktivieren"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && tmpl.categories && (
                  <div className="border-t border-kore-border px-lg py-md">
                    {tmpl.description && (
                      <p className="text-small text-kore-mid mb-md">{tmpl.description}</p>
                    )}
                    {tmpl.categories.map((cat: any) => (
                      <div key={cat.id} className="mb-md last:mb-0">
                        <div className="flex items-center justify-between text-small font-medium text-kore-ink mb-xs">
                          <span>{cat.name}</span>
                          <span className="text-kore-faint">
                            Gewicht {cat.weight}x — {cat._count?.criteria ?? cat.criteria?.length ?? 0} Kriterien
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-caption text-kore-faint mb-xs">{cat.description}</p>
                        )}
                        {cat.criteria && cat.criteria.length > 0 && (
                          <div className="pl-lg border-l border-kore-border space-y-xs">
                            {cat.criteria.map((crit: any) => (
                              <div key={crit.id} className="text-caption text-kore-mid flex items-center gap-sm">
                                <span className="flex-1">{crit.name}</span>
                                {crit.isRequired && <span className="text-red-400">Pflicht</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
