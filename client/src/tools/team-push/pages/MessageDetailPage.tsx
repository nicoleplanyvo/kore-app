import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Check, AlertTriangle, AlertCircle,
  Trash2, Users, Clock, Eye, EyeOff,
} from 'lucide-react';
import {
  useTeamMessage, useMarkTeamMessageRead, useUnreadUsers, useDeleteTeamMessage,
} from '../../../hooks/useTeamPush';

const PRIORITY_LABELS: Record<string, string> = { NORMAL: 'Normal', HIGH: 'Hoch', URGENT: 'Dringend' };
const PRIORITY_BADGES: Record<string, string> = {
  NORMAL: 'bg-kore-bg text-kore-mid',
  HIGH: 'bg-amber-100 text-amber-700',
  URGENT: 'bg-red-100 text-red-700',
};
const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  NORMAL: null,
  HIGH: <AlertTriangle size={16} className="text-amber-500" />,
  URGENT: <AlertCircle size={16} className="text-red-500" />,
};
const TARGET_LABELS: Record<string, string> = { ALL: 'Alle', STORE: 'Store', ROLE: 'Rolle' };

export function MessageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: message, isLoading } = useTeamMessage(id);
  const { data: unreadUsers } = useUnreadUsers(id);
  const markRead = useMarkTeamMessageRead();
  const deleteMessage = useDeleteTeamMessage();

  const handleDelete = () => {
    if (!id) return;
    if (!confirm('Nachricht wirklich loeschen?')) return;
    deleteMessage.mutate(id, { onSuccess: () => navigate('/tools/team-push') });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!message) return <div className="p-xl text-body text-kore-mid">Nachricht nicht gefunden.</div>;

  const readCount = message.reads?.length ?? message._count?.reads ?? 0;
  const totalRecipients = message.totalRecipients ?? 0;
  const readRate = totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;
  const unreadCount = unreadUsers?.length ?? Math.max(0, totalRecipients - readCount);

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/team-push" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-sm">
            {PRIORITY_ICONS[message.priority]}
            <h1 className="font-display text-h1 text-kore-ink">{message.title}</h1>
          </div>
          <div className="flex items-center gap-md text-body text-kore-mid mt-xs">
            <span>{message.sender?.name ?? '--'}</span>
            <span className="flex items-center gap-xs"><Clock size={14} /> {formatDate(message.createdAt)}</span>
            <span className="flex items-center gap-xs"><Users size={14} /> {TARGET_LABELS[message.targetType] ?? message.targetType}</span>
          </div>
        </div>
        <span className={`px-sm py-xs text-small font-medium ${PRIORITY_BADGES[message.priority] ?? 'bg-kore-bg text-kore-mid'}`}>
          {PRIORITY_LABELS[message.priority] ?? message.priority}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-sm mb-xl">
        <button
          onClick={() => markRead.mutate(message.id)}
          disabled={markRead.isPending}
          className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
        >
          <Check size={16} /> Als gelesen markieren
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteMessage.isPending}
          className="flex items-center gap-xs px-md py-sm border border-red-200 text-red-600 text-small hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={16} /> Loeschen
        </button>
      </div>

      {/* Urgent Banner */}
      {message.priority === 'URGENT' && (
        <div className="bg-red-50 border border-red-200 p-md mb-xl flex items-center gap-sm">
          <AlertCircle size={18} className="text-red-500" />
          <span className="text-small text-red-700 font-medium">
            Diese Nachricht ist als DRINGEND markiert. Lesebestaetigung erforderlich.
          </span>
        </div>
      )}

      {/* Message Body */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="text-body text-kore-ink whitespace-pre-wrap leading-relaxed">{message.body}</div>
      </div>

      {/* Read Stats */}
      <div className="grid grid-cols-3 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-emerald-600">{readCount}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Gelesen</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-amber-600">{unreadCount}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Nicht gelesen</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-kore-brass">{readRate}%</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Leserate</div>
        </div>
      </div>

      {/* Read Progress Bar */}
      {totalRecipients > 0 && (
        <div className="bg-kore-white border border-kore-border p-md mb-xl">
          <div className="flex items-center justify-between text-small text-kore-mid mb-sm">
            <span>Lesefortschritt</span>
            <span>{readCount} / {totalRecipients}</span>
          </div>
          <div className="h-3 bg-kore-bg rounded overflow-hidden">
            <div
              className={`h-full transition-all ${readRate >= 80 ? 'bg-emerald-500' : readRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${readRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Two columns: Gelesen / Nicht gelesen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Gelesen */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <Eye size={18} className="text-emerald-600" /> Gelesen ({readCount})
          </h2>
          {!message.reads?.length ? (
            <p className="text-body text-kore-mid">Noch niemand hat diese Nachricht gelesen.</p>
          ) : (
            <div className="divide-y divide-kore-border max-h-80 overflow-y-auto">
              {message.reads.map((r: any) => (
                <div key={r.id} className="py-sm flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                      {(r.user?.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="text-body text-kore-ink">{r.user?.name ?? '--'}</span>
                  </div>
                  <span className="text-small text-kore-mid">{formatDate(r.readAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nicht gelesen */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <EyeOff size={18} className="text-amber-600" /> Nicht gelesen ({unreadCount})
          </h2>
          {!unreadUsers?.length ? (
            <p className="text-body text-kore-mid">
              {readCount > 0 && unreadCount === 0
                ? 'Alle haben die Nachricht gelesen.'
                : 'Lade...'}
            </p>
          ) : (
            <div className="divide-y divide-kore-border max-h-80 overflow-y-auto">
              {unreadUsers.map((u: any) => (
                <div key={u.id} className="py-sm flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                    {(u.name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <span className="text-body text-kore-ink">{u.name}</span>
                    <span className="text-small text-kore-mid ml-sm">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
