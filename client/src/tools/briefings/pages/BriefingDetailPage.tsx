import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Megaphone, Check } from 'lucide-react';
import { useBriefing, useAcknowledgeBriefing } from '../../../hooks/useBriefings';

const TYPE_LABELS: Record<string, string> = { MORNING: 'Morgen-Briefing', EVENING: 'Abend-Briefing', SPECIAL: 'Sonder-Briefing' };

export function BriefingDetailPage() {
  const { id } = useParams();
  const { data: briefing, isLoading } = useBriefing(id);
  const ack = useAcknowledgeBriefing();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!briefing) return <div className="p-xl text-body text-kore-mid">Briefing nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/briefings" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Megaphone size={24} /> {briefing.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {TYPE_LABELS[briefing.type] ?? briefing.type} · {new Date(briefing.date).toLocaleDateString('de-DE')} · {briefing.creator?.name ?? '—'}
          </p>
        </div>
        <button onClick={() => ack.mutate(briefing.id)} disabled={ack.isPending} className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">
          <Check size={16} /> {ack.isPending ? 'Wird bestätigt...' : 'Gelesen bestätigen'}
        </button>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="prose text-body text-kore-ink whitespace-pre-wrap">{briefing.content}</div>
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-md">Lesebestätigungen ({briefing.acknowledgments?.length ?? 0})</h2>
      {!briefing.acknowledgments?.length ? (
        <p className="text-body text-kore-mid">Noch keine Bestätigungen.</p>
      ) : (
        <div className="bg-kore-white border border-kore-border divide-y divide-kore-border">
          {briefing.acknowledgments.map((a: any) => (
            <div key={a.id} className="p-md flex items-center justify-between">
              <span className="text-body text-kore-ink">{a.user?.name ?? '—'}</span>
              <span className="text-small text-kore-mid">{new Date(a.readAt).toLocaleString('de-DE')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
