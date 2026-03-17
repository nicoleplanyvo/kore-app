import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock, User, AlertTriangle } from 'lucide-react';
import { useChecklist, useToggleCheckItem } from '../../../hooks/useChecklist';

export function ChecklistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: checklist, isLoading } = useChecklist(id!);
  const toggleItem = useToggleCheckItem();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Daten...</div>;
  if (!checklist) return <div className="p-xl text-body text-kore-mid">Checkliste nicht gefunden.</div>;

  const isComplete = checklist.status === 'COMPLETED';
  const progress = checklist.totalItems > 0
    ? Math.round((checklist.checkedItems / checklist.totalItems) * 100)
    : 0;

  // Build entry map: itemId -> entry
  const entryMap = new Map((checklist.entries || []).map((e: any) => [e.itemId, e]));

  // Parse due date from notes
  const dueDateMatch = checklist.notes?.match(/Frist:\s*(\d{4}-\d{2}-\d{2})/);
  const dueDate = dueDateMatch ? dueDateMatch[1] : null;
  const isOverdue = dueDate && !isComplete && new Date(dueDate) < new Date(new Date().toISOString().slice(0, 10));

  return (
    <div className="p-xl max-w-4xl">
      {/* Back + Header */}
      <Link to="/tools/checklisten" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-brass transition-colors mb-lg">
        <ArrowLeft size={14} />
        Zurueck
      </Link>

      <div className="flex items-start justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">{checklist.template?.name || 'Checkliste'}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {checklist.store?.name}{checklist.store?.city ? ` - ${checklist.store.city}` : ''}
          </p>
          {dueDate && (
            <p className={`text-small mt-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-kore-mid'}`}>
              Frist: {new Date(dueDate).toLocaleDateString('de-DE')}
              {isOverdue ? ' (ueberfaellig)' : ''}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className={`inline-flex items-center gap-sm px-md py-xs text-small font-medium ${isComplete ? 'bg-emerald-50 text-emerald-700' : isOverdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
            {isComplete ? <CheckCircle2 size={14} /> : isOverdue ? <AlertTriangle size={14} /> : <Clock size={14} />}
            {isComplete ? 'Abgeschlossen' : isOverdue ? 'Ueberfaellig' : 'In Bearbeitung'}
          </div>
          <div className="mt-sm">
            <span className="font-display text-h2 text-kore-ink">{progress}%</span>
            <span className="text-small text-kore-mid ml-sm">{checklist.checkedItems}/{checklist.totalItems} erledigt</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-kore-bg h-2 mb-2xl">
        <div
          className={`h-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-kore-brass'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Sections + Items */}
      {checklist.template?.sections?.map((section: any) => (
        <div key={section.id} className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">{section.name}</h2>
          <div className="bg-kore-white border border-kore-border divide-y divide-kore-border">
            {section.items?.map((item: any) => {
              const entry = entryMap.get(item.id) as any;
              const checked = entry?.valueBool === true;
              const checkedByUserId = entry?.comment;
              const checkedAt = entry?.answeredAt;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-md p-md cursor-pointer hover:bg-kore-bg/50 transition-colors ${checked ? 'bg-emerald-50/30' : ''}`}
                  onClick={() => {
                    if (checklist.status === 'IN_PROGRESS') {
                      toggleItem.mutate({ checklistId: checklist.id, itemId: item.id });
                    }
                  }}
                >
                  {/* Checkbox */}
                  {checked ? (
                    <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle size={20} className="text-kore-faint flex-shrink-0" />
                  )}

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <span className={`text-body ${checked ? 'text-kore-mid line-through' : 'text-kore-ink'}`}>
                      {item.text}
                    </span>
                  </div>

                  {/* Who + When */}
                  {checked && checkedAt && (
                    <div className="flex items-center gap-xs text-small text-kore-faint flex-shrink-0">
                      <User size={12} />
                      <span>{new Date(checkedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Conductor Info */}
      <div className="mt-xl pt-xl border-t border-kore-border text-small text-kore-mid">
        <p>Erstellt von: {checklist.conductor?.name || '-'}</p>
        <p>Gestartet: {new Date(checklist.startedAt).toLocaleString('de-DE')}</p>
        {checklist.completedAt && (
          <p>Abgeschlossen: {new Date(checklist.completedAt).toLocaleString('de-DE')}</p>
        )}
      </div>
    </div>
  );
}
