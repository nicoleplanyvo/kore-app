import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X, FileText, Camera } from 'lucide-react';
import { useChecklistSession } from '../../../hooks/useChecklist';
import { ChecklistProgress } from '../components/ChecklistProgress';
import { API_URL } from '../../../lib/api';

const statusLabels: Record<string, { label: string; color: string }> = {
  IN_PROGRESS: { label: 'In Bearbeitung', color: 'text-kore-warning' },
  COMPLETED: { label: 'Abgeschlossen', color: 'text-kore-success' },
  CANCELLED: { label: 'Abgebrochen', color: 'text-kore-error' },
};

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useChecklistSession(id);

  if (isLoading || !session) {
    return (
      <div className="p-xl">
        <div className="text-body text-kore-mid">Lade Checklisten-Ergebnis...</div>
      </div>
    );
  }

  const sections = session.template?.sections ?? [];
  const entries = session.entries ?? [];
  const status = statusLabels[session.status] ?? { label: session.status, color: 'text-kore-mid' };

  return (
    <div className="p-xl max-w-4xl">
      <Link
        to="/tools/checklisten/sessions"
        className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-xl transition-colors"
      >
        <ArrowLeft size={16} />
        Zurueck zum Verlauf
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-2xl mb-2xl">
        <div className="w-full md:w-48 shrink-0">
          <ChecklistProgress
            value={session.completionRate ?? 0}
            size="lg"
          />
          <p className="text-small text-kore-mid text-center mt-sm">
            Erfuellungsgrad
          </p>
        </div>

        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">
            {session.template?.name}
          </h1>
          <div className="mt-md space-y-xs text-small text-kore-mid">
            {session.store && (
              <div>
                Store: {session.store.name}
                {session.store.city ? ` — ${session.store.city}` : ''}
              </div>
            )}
            <div>
              Datum:{' '}
              {session.completedAt
                ? new Date(session.completedAt).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : session.startedAt
                  ? new Date(session.startedAt).toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
            </div>
            <div>
              Status:{' '}
              <span className={status.color}>{status.label}</span>
            </div>
          </div>

          {session.notes && (
            <div className="mt-lg p-md bg-kore-bg border-l-2 border-kore-brass text-small text-kore-mid">
              <div className="flex items-center gap-xs mb-xs">
                <FileText size={14} />
                <span className="font-medium">Notizen</span>
              </div>
              {session.notes}
            </div>
          )}
        </div>
      </div>

      {/* Section-wise overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-2xl">
        {sections.map((sec) => {
          const sectionItems = sec.items ?? [];
          const sectionEntries = entries.filter((e) =>
            sectionItems.some((item) => item.id === e.itemId),
          );
          const answered = sectionEntries.filter(
            (e) =>
              e.valueBool !== null ||
              (e.valueText !== null && e.valueText !== '') ||
              e.valueNumber !== null ||
              e.photoPath !== null,
          ).length;
          const total = sectionItems.length;
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

          return (
            <div
              key={sec.id}
              className="bg-kore-white border border-kore-border p-lg"
            >
              <div className="text-caption text-kore-mid uppercase tracking-widest mb-sm">
                {sec.name}
              </div>
              <div
                className={`font-display text-h2 ${
                  pct >= 75
                    ? 'text-kore-success'
                    : pct >= 50
                      ? 'text-kore-brass'
                      : 'text-kore-error'
                }`}
              >
                {pct}%
              </div>
              <div className="text-small text-kore-mid mt-xs">
                {answered}/{total} beantwortet
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail pro Sektion */}
      {sections.map((sec) => (
        <div key={sec.id} className="mb-2xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg border-b border-kore-border pb-sm">
            {sec.name}
          </h2>

          <div className="space-y-sm">
            {(sec.items ?? []).map((item) => {
              const entry = entries.find((e) => e.itemId === item.id);

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-md px-lg py-md-sm bg-kore-white border border-kore-border"
                >
                  {/* Status Icon */}
                  <div className="shrink-0 mt-px">
                    {item.type === 'BOOLEAN' ? (
                      entry?.valueBool === true ? (
                        <Check size={18} className="text-kore-success" />
                      ) : entry?.valueBool === false ? (
                        <X size={18} className="text-kore-error" />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border border-kore-border" />
                      )
                    ) : entry?.valueText || entry?.valueNumber !== null || entry?.photoPath ? (
                      <Check size={18} className="text-kore-success" />
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border border-kore-border" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-small text-kore-ink">{item.text}</div>

                    {/* Value display */}
                    {item.type === 'TEXT' && entry?.valueText && (
                      <div className="text-small text-kore-mid mt-xs">
                        {entry.valueText}
                      </div>
                    )}
                    {item.type === 'NUMBER' && entry?.valueNumber !== null && entry?.valueNumber !== undefined && (
                      <div className="text-small text-kore-mid mt-xs">
                        Wert: {entry.valueNumber}
                      </div>
                    )}

                    {/* Comment */}
                    {entry?.comment && (
                      <div className="text-small text-kore-mid mt-xs italic">
                        {entry.comment}
                      </div>
                    )}
                  </div>

                  {/* Photo link */}
                  {entry?.photoPath && (
                    <a
                      href={`${API_URL}/api/uploads/${entry.photoPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-kore-brass hover:text-kore-brass-dk"
                    >
                      <Camera size={16} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
