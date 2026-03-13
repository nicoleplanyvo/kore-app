import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Check, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTeamMessage, useMarkTeamMessageRead } from '../../../hooks/useTeamPush';

const PRIORITY_LABELS: Record<string, string> = { NORMAL: 'Normal', HIGH: 'Hoch', URGENT: 'Dringend' };
const PRIORITY_BADGES: Record<string, string> = { NORMAL: 'bg-kore-bg text-kore-mid', HIGH: 'bg-amber-100 text-amber-700', URGENT: 'bg-red-100 text-red-700' };

export function MessageDetailPage() {
  const { id } = useParams();
  const { data: message, isLoading } = useTeamMessage(id);
  const markRead = useMarkTeamMessageRead();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!message) return <div className="p-xl text-body text-kore-mid">Nachricht nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/team-push" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Send size={24} /> {message.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {message.sender?.name ?? '—'} · {new Date(message.createdAt).toLocaleString('de-DE')}
          </p>
        </div>
        <span className={`px-sm py-xs text-small ${PRIORITY_BADGES[message.priority] ?? 'bg-kore-bg text-kore-mid'}`}>
          {PRIORITY_LABELS[message.priority] ?? message.priority}
        </span>
        <button onClick={() => markRead.mutate(message.id)} disabled={markRead.isPending} className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">
          <Check size={16} /> Gelesen
        </button>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="text-body text-kore-ink whitespace-pre-wrap">{message.body}</div>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg">
        <h2 className="font-display text-h3 text-kore-ink mb-md">Gelesen von ({message.reads?.length ?? message._count?.reads ?? 0})</h2>
        {!message.reads?.length ? (
          <p className="text-body text-kore-mid">Noch niemand hat diese Nachricht gelesen.</p>
        ) : (
          <div className="divide-y divide-kore-border">
            {message.reads.map((r: any) => (
              <div key={r.id} className="py-sm flex items-center justify-between">
                <span className="text-body text-kore-ink">{r.user?.name ?? '—'}</span>
                <span className="text-small text-kore-mid">{new Date(r.readAt).toLocaleString('de-DE')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
