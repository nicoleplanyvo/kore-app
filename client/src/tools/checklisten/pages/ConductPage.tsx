import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, MessageSquare } from 'lucide-react';
import { api } from '../../../lib/api';
import { ItemInput } from '../components/ItemInput';

interface ChecklistItem {
  id: string;
  text: string;
  type: string;
  isRequired: boolean;
  sortOrder: number;
}

interface ChecklistSection {
  id: string;
  name: string;
  sortOrder: number;
  items: ChecklistItem[];
}

interface ChecklistSessionData {
  id: string;
  status: string;
  completionRate: number;
  notes: string | null;
  template: {
    id: string;
    name: string;
    sections: ChecklistSection[];
  };
  store: {
    id: string;
    name: string;
    city: string | null;
  };
  entries: {
    id: string;
    itemId: string;
    valueBool: boolean | null;
    valueText: string | null;
    valueNumber: number | null;
    photoPath: string | null;
    comment: string | null;
  }[];
}

interface EntryState {
  itemId: string;
  valueBool: boolean | null;
  valueText: string | null;
  valueNumber: number | null;
  photoPath: string | null;
  comment: string;
  saving: boolean;
}

export function ConductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<ChecklistSessionData | null>(null);
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [entries, setEntries] = useState<Map<string, EntryState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    api<ChecklistSessionData>(`/api/tools/checklisten/sessions/${id}`)
      .then((data) => {
        setSession(data);
        const secs = data.template?.sections ?? [];
        setSections(secs);

        const entryMap = new Map<string, EntryState>();
        for (const sec of secs) {
          for (const item of sec.items ?? []) {
            const existing = data.entries?.find((e) => e.itemId === item.id);
            entryMap.set(item.id, {
              itemId: item.id,
              valueBool: existing?.valueBool ?? null,
              valueText: existing?.valueText ?? null,
              valueNumber: existing?.valueNumber ?? null,
              photoPath: existing?.photoPath ?? null,
              comment: existing?.comment ?? '',
              saving: false,
            });
          }
        }
        setEntries(entryMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const saveEntry = useCallback(
    async (itemId: string, updates: Partial<EntryState>) => {
      setEntries((prev) => {
        const next = new Map(prev);
        const current = next.get(itemId);
        if (current) next.set(itemId, { ...current, ...updates, saving: true });
        return next;
      });

      try {
        await api(`/api/tools/checklisten/sessions/${id}/entries/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify({
            valueBool: updates.valueBool,
            valueText: updates.valueText,
            valueNumber: updates.valueNumber,
            comment: updates.comment,
          }),
        });
      } catch (error) {
        console.error('Eintrag speichern fehlgeschlagen:', error);
      } finally {
        setEntries((prev) => {
          const next = new Map(prev);
          const current = next.get(itemId);
          if (current) next.set(itemId, { ...current, saving: false });
          return next;
        });
      }
    },
    [id],
  );

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api(`/api/tools/checklisten/sessions/${id}/complete`, {
        method: 'POST',
      });
      navigate(`/tools/checklisten/sessions/${id}`);
    } catch (error) {
      console.error('Checkliste abschliessen fehlgeschlagen:', error);
      setCompleting(false);
    }
  };

  const toggleComment = (itemId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  if (loading || !session) {
    return (
      <div className="p-xl">
        <div className="text-body text-kore-mid">Lade Checkliste...</div>
      </div>
    );
  }

  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    navigate(`/tools/checklisten/sessions/${id}`);
    return null;
  }

  const currentSection = sections[currentSectionIdx];
  const items = currentSection?.items ?? [];
  const isLastSection = currentSectionIdx === sections.length - 1;
  const isFirstSection = currentSectionIdx === 0;

  // Calculate progress
  const totalItems = sections.reduce(
    (sum, sec) => sum + (sec.items?.length ?? 0),
    0,
  );
  const answeredItems = Array.from(entries.values()).filter(
    (e) =>
      e.valueBool !== null ||
      (e.valueText !== null && e.valueText !== '') ||
      e.valueNumber !== null ||
      e.photoPath !== null,
  ).length;
  const progressPct = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-kore-white border-b border-kore-border px-lg py-md-sm">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-caption text-kore-mid uppercase tracking-widest">
            {session.template?.name}
          </span>
          <span className="text-small text-kore-mid">
            {answeredItems}/{totalItems} beantwortet
          </span>
        </div>
        <div className="w-full h-1 bg-kore-border rounded-full overflow-hidden">
          <div
            className="h-full bg-kore-brass transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-sm mt-md-sm overflow-x-auto">
          {sections.map((sec, idx) => (
            <button
              key={sec.id}
              onClick={() => setCurrentSectionIdx(idx)}
              className={`whitespace-nowrap px-md-sm py-xs text-caption uppercase tracking-widest transition-colors ${
                idx === currentSectionIdx
                  ? 'text-kore-brass border-b-2 border-kore-brass'
                  : 'text-kore-faint hover:text-kore-mid'
              }`}
            >
              {sec.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Items List */}
      <div className="flex-1 p-lg md:p-xl space-y-lg max-w-3xl">
        <h2 className="font-display text-h2 text-kore-ink">
          {currentSection?.name}
        </h2>

        {items.map((item: ChecklistItem) => {
          const state = entries.get(item.id);
          if (!state) return null;
          const commentExpanded = expandedComments.has(item.id);

          return (
            <div
              key={item.id}
              className="bg-kore-white border border-kore-border p-lg space-y-md"
            >
              <div className="flex items-start justify-between gap-md">
                <div className="flex-1">
                  <h3 className="text-body text-kore-ink font-medium">
                    {item.text}
                  </h3>
                </div>
                <div className="flex items-center gap-sm shrink-0">
                  {item.isRequired && (
                    <span className="text-caption text-kore-brass">Pflicht</span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleComment(item.id)}
                    className={`p-xs transition-colors ${
                      commentExpanded || state.comment
                        ? 'text-kore-brass'
                        : 'text-kore-faint hover:text-kore-mid'
                    }`}
                    title="Kommentar"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>

              {/* Item Input */}
              <ItemInput
                item={item}
                valueBool={state.valueBool}
                valueText={state.valueText}
                valueNumber={state.valueNumber}
                photoPath={state.photoPath}
                onChange={(updates) => {
                  const merged = { ...state, ...updates };
                  setEntries((prev) => {
                    const next = new Map(prev);
                    next.set(item.id, merged);
                    return next;
                  });
                  saveEntry(item.id, updates);
                }}
              />

              {/* Kommentar (collapsible) */}
              {(commentExpanded || state.comment) && (
                <div>
                  <textarea
                    value={state.comment}
                    onChange={(e) => {
                      setEntries((prev) => {
                        const next = new Map(prev);
                        next.set(item.id, { ...state, comment: e.target.value });
                        return next;
                      });
                    }}
                    onBlur={() => {
                      if (state.comment) {
                        saveEntry(item.id, { comment: state.comment });
                      }
                    }}
                    placeholder="Optionaler Kommentar..."
                    rows={2}
                    className="input-default resize-none"
                  />
                </div>
              )}

              {state.saving && (
                <span className="text-caption text-kore-faint">Speichern...</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-kore-white border-t border-kore-border px-lg py-md flex items-center justify-between">
        <button
          onClick={() => setCurrentSectionIdx((i) => Math.max(0, i - 1))}
          disabled={isFirstSection}
          className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
          Zurueck
        </button>

        {isLastSection ? (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex items-center gap-sm bg-kore-success text-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <CheckCircle size={16} />
            {completing ? 'Wird abgeschlossen...' : 'Abschliessen'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentSectionIdx((i) => Math.min(sections.length - 1, i + 1))}
            className="flex items-center gap-xs text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
          >
            Weiter
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
