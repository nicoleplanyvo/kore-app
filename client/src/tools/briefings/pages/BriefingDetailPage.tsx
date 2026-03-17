import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Star, FileText, CheckCircle, Users, UserCheck, UserX } from 'lucide-react';
import { useBriefing, useMarkBriefingRead, useBriefingUsers } from '../../../hooks/useBriefings';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MORNING: <Sun size={20} className="text-amber-500" />,
  EVENING: <Moon size={20} className="text-indigo-500" />,
  SPECIAL: <Star size={20} className="text-emerald-500" />,
};
const TYPE_LABELS: Record<string, string> = { MORNING: 'Morgen-Briefing', EVENING: 'Abend-Briefing', SPECIAL: 'Sonder-Briefing' };

export function BriefingDetailPage() {
  const { id } = useParams();
  const { data: briefing, isLoading } = useBriefing(id);
  const { data: allUsers } = useBriefingUsers();
  const markRead = useMarkBriefingRead();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!briefing) return <div className="p-xl text-body text-kore-mid">Briefing nicht gefunden.</div>;

  const sections: Array<{ title: string; content: string; sortOrder: number }> = Array.isArray(briefing.sections) ? briefing.sections : [];
  const acks = briefing.acknowledgments ?? [];
  const ackUserIds = new Set(acks.map((a: any) => a.userId));

  // Users who haven't read
  const storeUsers = allUsers ?? [];
  const unreadUsers = storeUsers.filter((u: any) => !ackUserIds.has(u.id));

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/briefings" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-sm">
            {TYPE_ICONS[briefing.type] ?? <FileText size={20} className="text-kore-mid" />}
            <h1 className="font-display text-h1 text-kore-ink">{briefing.title}</h1>
          </div>
          <p className="text-body text-kore-mid mt-xs">
            {TYPE_LABELS[briefing.type] ?? briefing.type} &middot; {new Date(briefing.date + 'T00:00:00').toLocaleDateString('de-DE')} &middot; {briefing.creator?.name ?? '—'}
            {briefing.store && <> &middot; {briefing.store.name}</>}
          </p>
        </div>
        <button
          onClick={() => markRead.mutate(briefing.id)}
          disabled={markRead.isPending}
          className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
        >
          <CheckCircle size={16} /> {markRead.isPending ? 'Wird bestaetigt...' : 'Gelesen bestaetigen'}
        </button>
      </div>

      {/* Read rate bar */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-small text-kore-mid uppercase tracking-widest">Lesequote</span>
          <span className="font-display text-h3 text-kore-ink">{briefing.readRate ?? 0}%</span>
        </div>
        <div className="w-full bg-kore-bg h-3">
          <div className="h-full bg-kore-brass transition-all" style={{ width: `${Math.min(100, briefing.readRate ?? 0)}%` }} />
        </div>
        <div className="flex items-center gap-lg mt-sm text-small text-kore-mid">
          <span>{acks.length} von {briefing.userCount ?? '?'} gelesen</span>
        </div>
      </div>

      {/* Sections */}
      {sections.length > 0 ? (
        <div className="space-y-md mb-xl">
          {sections
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((sec, idx) => (
              <div key={idx} className="bg-kore-white border border-kore-border p-lg">
                <h2 className="font-display text-h3 text-kore-ink mb-sm">{sec.title}</h2>
                <div className="text-body text-kore-ink whitespace-pre-wrap">{sec.content}</div>
              </div>
            ))}
        </div>
      ) : briefing.content ? (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <div className="text-body text-kore-ink whitespace-pre-wrap">{briefing.content}</div>
        </div>
      ) : null}

      {/* Read status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        {/* Who read */}
        <div>
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <UserCheck size={18} className="text-emerald-600" /> Gelesen ({acks.length})
          </h2>
          {acks.length === 0 ? (
            <p className="text-body text-kore-mid">Noch keine Bestaetigungen.</p>
          ) : (
            <div className="bg-kore-white border border-kore-border divide-y divide-kore-border">
              {acks.map((a: any) => (
                <div key={a.id} className="p-md flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    <Users size={14} className="text-kore-mid" />
                    <span className="text-body text-kore-ink">{a.user?.name ?? '—'}</span>
                  </div>
                  <span className="text-small text-kore-mid">{new Date(a.readAt).toLocaleString('de-DE')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Who hasn't read */}
        <div>
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <UserX size={18} className="text-red-500" /> Nicht gelesen ({unreadUsers.length})
          </h2>
          {unreadUsers.length === 0 ? (
            <p className="text-body text-kore-mid">Alle haben gelesen.</p>
          ) : (
            <div className="bg-kore-white border border-kore-border divide-y divide-kore-border">
              {unreadUsers.map((u: any) => (
                <div key={u.id} className="p-md flex items-center gap-sm">
                  <Users size={14} className="text-kore-mid" />
                  <span className="text-body text-kore-ink">{u.name}</span>
                  <span className="text-caption text-kore-faint ml-auto">{u.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
