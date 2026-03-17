import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Plus, Users, Target, Clock, Medal, User, Store, Filter } from 'lucide-react';
import { useChallenges } from '../../../hooks/useChallenges';

const STATUS_DOT: Record<string, string> = { DRAFT: 'bg-kore-mid', ACTIVE: 'bg-emerald-500', COMPLETED: 'bg-blue-500', CANCELLED: 'bg-red-500' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Beendet', CANCELLED: 'Abgebrochen' };
const TYPE_LABELS: Record<string, string> = { INDIVIDUAL: 'Einzel', TEAM: 'Team', STORE: 'Store-vs-Store' };
const TYPE_ICONS: Record<string, typeof User> = { INDIVIDUAL: User, TEAM: Users, STORE: Store };
const MODE_LABELS: Record<string, string> = { KPI: 'KPI-basiert', VOTING: 'Voting / Kreativ' };

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const { data, isLoading } = useChallenges({ page, status: status || undefined, type: type || undefined });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const getDaysRemaining = (endDate: string) => {
    const ms = new Date(endDate + 'T23:59:59').getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Challenges</h1>
          <p className="text-body text-kore-mid mt-xs">Wettbewerbe und Gamification fuer Ihr Team</p>
        </div>
        <Link to="/tools/challenges/dashboard" className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small text-kore-ink hover:bg-kore-bg transition-colors">
          <Medal size={16} /> Dashboard
        </Link>
        <Link to="/tools/challenges/create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
          <Plus size={16} /> Neue Challenge
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-md mb-xl flex-wrap items-center">
        <Filter size={16} className="text-kore-mid" />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="DRAFT">Entwurf</option>
          <option value="COMPLETED">Beendet</option>
          <option value="CANCELLED">Abgebrochen</option>
        </select>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Typen</option>
          <option value="INDIVIDUAL">Einzel</option>
          <option value="TEAM">Team</option>
          <option value="STORE">Store-vs-Store</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Challenges...</div>
      ) : !data?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Trophy size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Challenges</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erstellen Sie Ihre erste Challenge, um Motivation und Wettbewerb im Team zu foerdern.</p>
          <Link to="/tools/challenges/create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Challenge erstellen
          </Link>
        </div>
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {data.data.map((ch: any) => {
              const TypeIcon = TYPE_ICONS[ch.type] ?? User;
              const days = ch.status === 'ACTIVE' ? getDaysRemaining(ch.endDate) : null;
              const myPos = ch.myParticipation;
              return (
                <Link
                  key={ch.id}
                  to={`/tools/challenges/${ch.id}`}
                  className="bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors flex flex-col"
                >
                  {/* Status + Type badge row */}
                  <div className="flex items-center justify-between mb-md">
                    <div className="flex items-center gap-xs">
                      <div className={`w-2 h-2 rounded-full ${STATUS_DOT[ch.status] ?? 'bg-kore-mid'}`} />
                      <span className="text-caption text-kore-mid uppercase tracking-widest">{STATUS_LABELS[ch.status] ?? ch.status}</span>
                    </div>
                    <span className="text-caption text-kore-mid flex items-center gap-xs uppercase tracking-widest">
                      <TypeIcon size={12} /> {TYPE_LABELS[ch.type] ?? ch.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-h3 text-kore-ink mb-sm">{ch.title}</h3>
                  {ch.description && <p className="text-small text-kore-mid mb-md line-clamp-2 flex-1">{ch.description}</p>}

                  {/* Meta */}
                  <div className="space-y-sm mt-auto">
                    {ch.metric && (
                      <div className="flex items-center gap-xs text-small text-kore-mid">
                        <Target size={12} /> {ch.metric}{ch.targetValue ? ` (Ziel: ${ch.targetValue})` : ''}
                      </div>
                    )}
                    <div className="flex items-center gap-xs text-small text-kore-mid">
                      <span className="text-caption uppercase tracking-widest">{MODE_LABELS[ch.mode] ?? ch.mode}</span>
                    </div>
                    <div className="flex items-center justify-between text-small text-kore-mid">
                      <span className="flex items-center gap-xs"><Users size={12} /> {ch._count?.participants ?? 0} Teilnehmer</span>
                      {days !== null && (
                        <span className="flex items-center gap-xs"><Clock size={12} /> {days} {days === 1 ? 'Tag' : 'Tage'}</span>
                      )}
                    </div>
                    <div className="text-caption text-kore-faint">
                      {formatDate(ch.startDate)} – {formatDate(ch.endDate)}
                    </div>

                    {/* My position */}
                    {myPos && (
                      <div className="border-t border-kore-border pt-sm mt-sm">
                        <span className="text-small font-medium text-kore-ink">
                          Meine Position: #{myPos.rank ?? '–'} ({myPos.currentValue ?? 0}{ch.targetValue ? ` / ${ch.targetValue}` : ''})
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {data.total > data.pageSize && (
            <div className="flex gap-sm mt-xl items-center justify-center">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Zurueck</button>
              <span className="px-md py-sm text-small text-kore-mid">Seite {data.page} / {Math.ceil(data.total / data.pageSize)}</span>
              <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
