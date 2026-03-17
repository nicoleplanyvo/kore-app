import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Plus, CheckCircle2, Circle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { useChecklists, useChecklistStores, useToggleCheckItem, useCreateChecklist, useChecklistTemplates } from '../../../hooks/useChecklist';

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const { data: stores } = useChecklistStores();
  const { data: result, isLoading } = useChecklists(1, storeId || undefined, undefined, today);
  const toggleItem = useToggleCheckItem();

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Checklisten</h1>
          <p className="text-body text-kore-mid mt-xs">Heutige Checklisten und Fortschritt</p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/checklisten/dashboard"
            className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/tools/checklisten/templates"
            className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors"
          >
            Vorlagen
          </Link>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} />
            Neue Checkliste
          </button>
        </div>
      </div>

      {/* Store Filter */}
      {stores && stores.length > 1 && (
        <div className="mb-xl">
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="border border-kore-border px-lg py-md text-small bg-kore-white min-w-[200px]"
          >
            <option value="">Alle Stores</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* Create Dialog */}
      {showCreate && (
        <CreateChecklistDialog
          stores={stores || []}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Today's Checklists */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : result && result.data.length > 0 ? (
        <div className="space-y-lg">
          {result.data.map(cl => (
            <ChecklistCard key={cl.id} checklist={cl} onToggle={toggleItem.mutate} />
          ))}
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ClipboardCheck size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Checklisten fuer heute</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie eine neue Checkliste oder warten Sie auf die naechste wiederkehrende Checkliste.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} />
            Checkliste erstellen
          </button>
        </div>
      )}
    </div>
  );
}

// ── Checklist Card with inline check ──────────────────────
function ChecklistCard({ checklist, onToggle }: { checklist: any; onToggle: (v: { checklistId: string; itemId: string }) => void }) {
  const [expanded, setExpanded] = useState(true);
  const isComplete = checklist.status === 'COMPLETED';
  const isOverdue = !isComplete && checklist.notes?.match(/Frist:\s*(\d{4}-\d{2}-\d{2})/) &&
    new Date(checklist.notes.match(/Frist:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? '') < new Date(new Date().toISOString().slice(0, 10));

  const progress = checklist.totalItems > 0
    ? Math.round((checklist.checkedItems / checklist.totalItems) * 100)
    : 0;

  // Collect all items from template sections (if available from the list endpoint)
  const entries = checklist.entries || [];
  const entryMap = new Map(entries.map((e: any) => [e.itemId, e]));

  return (
    <div className={`bg-kore-white border ${isOverdue ? 'border-red-300' : isComplete ? 'border-emerald-300' : 'border-kore-border'} transition-colors`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-lg cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-md">
          {isComplete ? (
            <CheckCircle2 size={20} className="text-emerald-600" />
          ) : isOverdue ? (
            <AlertTriangle size={20} className="text-red-500" />
          ) : (
            <Clock size={20} className="text-kore-brass" />
          )}
          <div>
            <h3 className="font-display text-h4 text-kore-ink">{checklist.template?.name || 'Checkliste'}</h3>
            <p className="text-small text-kore-mid">{checklist.store?.name}{checklist.store?.city ? ` - ${checklist.store.city}` : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-lg">
          <div className="text-right">
            <span className="text-small font-medium text-kore-ink">{checklist.checkedItems}/{checklist.totalItems}</span>
            <div className="w-24 bg-kore-bg h-1.5 mt-xs">
              <div
                className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-kore-brass'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ChevronRight size={16} className={`text-kore-mid transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Items (inline quick-check) — shown if we have template detail */}
      {expanded && (
        <div className="border-t border-kore-border px-lg pb-lg">
          <div className="pt-md text-right mb-sm">
            <Link
              to={`/tools/checklisten/checklists/${checklist.id}`}
              className="text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
            >
              Vollansicht &rarr;
            </Link>
          </div>
          {/* We show a summary since list endpoint doesn't include full items */}
          <div className="flex items-center gap-md">
            <span className={`text-small font-medium ${isComplete ? 'text-emerald-600' : isOverdue ? 'text-red-600' : 'text-kore-ink'}`}>
              {isComplete ? 'Abgeschlossen' : isOverdue ? 'Ueberfaellig' : 'In Bearbeitung'}
            </span>
            <span className="text-small text-kore-mid">
              {progress}% erledigt
            </span>
            {checklist.conductor && (
              <span className="text-small text-kore-faint">
                Erstellt von {checklist.conductor.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Dialog ─────────────────────────────────────────
function CreateChecklistDialog({ stores, onClose }: { stores: any[]; onClose: () => void }) {
  const [mode, setMode] = useState<'template' | 'adhoc'>('template');
  const [selectedStore, setSelectedStore] = useState(stores.length === 1 ? stores[0].id : '');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [title, setTitle] = useState('');
  const [items, setItems] = useState(['']);
  const [dueDate, setDueDate] = useState('');

  const { data: templates } = useChecklistTemplates();
  const create = useCreateChecklist();

  const handleSubmit = () => {
    if (!selectedStore) return;

    if (mode === 'template' && selectedTemplate) {
      create.mutate(
        { storeId: selectedStore, templateId: selectedTemplate, dueDate: dueDate || undefined },
        { onSuccess: () => onClose() },
      );
    } else if (mode === 'adhoc' && items.filter(i => i.trim()).length > 0) {
      create.mutate(
        { storeId: selectedStore, title: title || undefined, items: items.filter(i => i.trim()).map(text => ({ text })), dueDate: dueDate || undefined },
        { onSuccess: () => onClose() },
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-xl">
      <div className="bg-kore-white border border-kore-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-xl border-b border-kore-border">
          <h2 className="font-display text-h3 text-kore-ink">Neue Checkliste</h2>
        </div>

        <div className="p-xl space-y-lg">
          {/* Store */}
          <div>
            <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Store</label>
            <select
              value={selectedStore}
              onChange={e => setSelectedStore(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-small"
            >
              <option value="">Store waehlen...</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-sm">
            <button
              onClick={() => setMode('template')}
              className={`flex-1 py-sm text-small font-medium uppercase tracking-widest border ${mode === 'template' ? 'bg-kore-ink text-kore-white border-kore-ink' : 'border-kore-border text-kore-mid hover:bg-kore-bg'} transition-colors`}
            >
              Aus Vorlage
            </button>
            <button
              onClick={() => setMode('adhoc')}
              className={`flex-1 py-sm text-small font-medium uppercase tracking-widest border ${mode === 'adhoc' ? 'bg-kore-ink text-kore-white border-kore-ink' : 'border-kore-border text-kore-mid hover:bg-kore-bg'} transition-colors`}
            >
              Individuell
            </button>
          </div>

          {mode === 'template' ? (
            <div>
              <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Vorlage</label>
              <select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small"
              >
                <option value="">Vorlage waehlen...</option>
                {templates?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (Standard)' : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Titel</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="z.B. Tagesabschluss-Checkliste"
                  className="w-full border border-kore-border px-md py-sm text-small"
                />
              </div>
              <div>
                <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Pruefpunkte</label>
                {items.map((item, i) => (
                  <div key={i} className="flex gap-sm mb-sm">
                    <input
                      value={item}
                      onChange={e => { const next = [...items]; next[i] = e.target.value; setItems(next); }}
                      placeholder={`Punkt ${i + 1}`}
                      className="flex-1 border border-kore-border px-md py-sm text-small"
                    />
                    {items.length > 1 && (
                      <button
                        onClick={() => setItems(items.filter((_, j) => j !== i))}
                        className="text-kore-mid hover:text-red-600 px-sm"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setItems([...items, ''])}
                  className="text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
                >
                  + Punkt hinzufuegen
                </button>
              </div>
            </>
          )}

          {/* Due Date */}
          <div>
            <label className="text-caption text-kore-mid uppercase tracking-widest block mb-xs">Frist (optional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-small"
            />
          </div>
        </div>

        <div className="p-xl border-t border-kore-border flex justify-end gap-md">
          <button onClick={onClose} className="px-lg py-sm text-small text-kore-mid hover:text-kore-ink transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={create.isPending || !selectedStore}
            className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            {create.isPending ? 'Wird erstellt...' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
