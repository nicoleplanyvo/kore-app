import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Target, Users, Clock, Send, ThumbsUp, User, Store, Trash2, Play, Square } from 'lucide-react';
import { useChallenge, useJoinChallenge, useUpdateChallenge, useDeleteChallenge, useSubmitEntry, useChallengeVote } from '../../../hooks/useChallenges';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Beendet', CANCELLED: 'Abgebrochen' };
const TYPE_LABELS: Record<string, string> = { INDIVIDUAL: 'Einzel', TEAM: 'Team', STORE: 'Store-vs-Store' };
const MODE_LABELS: Record<string, string> = { KPI: 'KPI-basiert', VOTING: 'Voting / Kreativ' };
const REWARD_LABELS: Record<string, string> = { HONOUR: 'Ehre', PRIZE: 'Preis', POINTS: 'Punkte', BADGE: 'Badge' };
const PODIUM_STYLES = [
  'bg-amber-50 border-amber-300 text-amber-800',
  'bg-gray-50 border-gray-300 text-gray-700',
  'bg-orange-50 border-orange-300 text-orange-700',
];
const PODIUM_LABELS = ['1. Platz', '2. Platz', '3. Platz'];

export function ChallengeDetailPage() {
  const { id } = useParams();
  const { data: challenge, isLoading } = useChallenge(id);
  const joinChallenge = useJoinChallenge();
  const updateChallenge = useUpdateChallenge();
  const deleteChallenge = useDeleteChallenge();
  const submitEntry = useSubmitEntry();
  const castVote = useChallengeVote();

  const [entryValue, setEntryValue] = useState('');
  const [entryNote, setEntryNote] = useState('');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!challenge) return <div className="p-xl text-body text-kore-mid">Challenge nicht gefunden.</div>;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isActive = challenge.status === 'ACTIVE';
  const isCompleted = challenge.status === 'COMPLETED';
  const isDraft = challenge.status === 'DRAFT';
  const isKpi = challenge.mode === 'KPI';
  const isVoting = challenge.mode === 'VOTING';
  const isParticipant = !!challenge.myPosition;

  const handleJoin = () => joinChallenge.mutate({ challengeId: challenge.id });
  const handleActivate = () => updateChallenge.mutate({ id: challenge.id, status: 'ACTIVE' });
  const handleComplete = () => updateChallenge.mutate({ id: challenge.id, status: 'COMPLETED' });
  const handleDelete = () => {
    if (confirm('Challenge wirklich loeschen?')) deleteChallenge.mutate(challenge.id);
  };
  const handleSubmitEntry = () => {
    const val = Number(entryValue);
    if (!val) return;
    submitEntry.mutate({ challengeId: challenge.id, value: val, note: entryNote || undefined }, {
      onSuccess: () => { setEntryValue(''); setEntryNote(''); },
    });
  };
  const handleVote = (targetUserId: string) => {
    castVote.mutate({ challengeId: challenge.id, targetUserId });
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/challenges" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">{challenge.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {STATUS_LABELS[challenge.status] ?? challenge.status} · {TYPE_LABELS[challenge.type] ?? challenge.type} · {MODE_LABELS[challenge.mode] ?? challenge.mode}
          </p>
        </div>
      </div>

      {/* Description */}
      {challenge.description && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <p className="text-body text-kore-ink whitespace-pre-wrap">{challenge.description}</p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        {challenge.metric && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Metrik</span>
            <div className="font-display text-h3 text-kore-ink mt-sm flex items-center gap-xs"><Target size={16} /> {challenge.metric}</div>
          </div>
        )}
        {challenge.targetValue != null && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Zielwert</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{challenge.targetValue}</div>
          </div>
        )}
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Teilnehmer</span>
          <div className="font-display text-h2 text-kore-ink mt-sm flex items-center gap-xs"><Users size={18} /> {challenge._count?.participants ?? 0}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Verbleibend</span>
          <div className="font-display text-h2 text-kore-ink mt-sm flex items-center gap-xs">
            <Clock size={18} /> {challenge.daysRemaining} {challenge.daysRemaining === 1 ? 'Tag' : 'Tage'}
          </div>
        </div>
      </div>

      {/* Time + Reward info */}
      <div className="flex flex-wrap gap-lg mb-lg text-small text-kore-mid">
        <span>Zeitraum: {formatDate(challenge.startDate)} – {formatDate(challenge.endDate)}</span>
        {challenge.recurring && challenge.recurring !== 'NONE' && <span>Wiederkehrend: {challenge.recurring}</span>}
        {challenge.reward && <span>Belohnung: {challenge.reward}</span>}
        {challenge.rewardType && <span>Art: {REWARD_LABELS[challenge.rewardType] ?? challenge.rewardType}</span>}
        {challenge.anonymized && <span>Anonymisiert</span>}
        {challenge.creator && <span>Erstellt von: {challenge.creator.name}</span>}
      </div>

      {/* Action buttons */}
      <div className="flex gap-sm mb-xl flex-wrap">
        {isActive && !isParticipant && (
          <button onClick={handleJoin} disabled={joinChallenge.isPending} className="px-lg py-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50 flex items-center gap-xs">
            <Users size={14} /> Teilnehmen
          </button>
        )}
        {isDraft && (
          <button onClick={handleActivate} disabled={updateChallenge.isPending} className="px-lg py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50 flex items-center gap-xs">
            <Play size={14} /> Aktivieren
          </button>
        )}
        {isActive && (
          <button onClick={handleComplete} disabled={updateChallenge.isPending} className="px-lg py-sm bg-blue-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50 flex items-center gap-xs">
            <Square size={14} /> Beenden
          </button>
        )}
        {(isDraft || isCompleted) && (
          <button onClick={handleDelete} disabled={deleteChallenge.isPending} className="px-lg py-sm border border-red-300 text-red-600 text-small hover:bg-red-50 disabled:opacity-50 flex items-center gap-xs">
            <Trash2 size={14} /> Loeschen
          </button>
        )}
      </div>

      {/* My Position highlight */}
      {isParticipant && challenge.myPosition && (
        <div className="bg-kore-white border-2 border-kore-brass p-lg mb-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-caption text-kore-mid uppercase tracking-widest">Meine Position</span>
              <div className="font-display text-h2 text-kore-ink mt-xs">Platz #{challenge.myPosition.rank ?? '–'}</div>
            </div>
            <div className="text-right">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Mein Wert</span>
              <div className="font-display text-h2 text-kore-ink mt-xs">
                {challenge.myPosition.currentValue}{challenge.targetValue ? ` / ${challenge.targetValue}` : ''}
              </div>
            </div>
          </div>
          {challenge.targetValue && challenge.targetValue > 0 && (
            <div className="mt-md">
              <div className="w-full bg-kore-bg h-3">
                <div className="bg-kore-brass h-3 transition-all" style={{ width: `${Math.min(100, (challenge.myPosition.currentValue / challenge.targetValue) * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Entry (KPI mode, active, participant) */}
      {isActive && isParticipant && isKpi && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-display text-h3 text-kore-ink mb-md">Ergebnis einreichen</h3>
          <div className="flex gap-md flex-wrap">
            <input
              type="number"
              placeholder="Wert"
              value={entryValue}
              onChange={(e) => setEntryValue(e.target.value)}
              className="border border-kore-border px-md py-sm text-small w-32"
            />
            <input
              placeholder="Notiz (optional)"
              value={entryNote}
              onChange={(e) => setEntryNote(e.target.value)}
              className="border border-kore-border px-md py-sm text-small flex-1 min-w-[200px]"
            />
            <button
              onClick={handleSubmitEntry}
              disabled={!entryValue || submitEntry.isPending}
              className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass transition-colors disabled:opacity-50 flex items-center gap-xs"
            >
              <Send size={14} /> Einreichen
            </button>
          </div>
        </div>
      )}

      {/* Podium (Top 3) */}
      {challenge.leaderboard?.length >= 3 && (
        <div className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Trophy size={20} /> Podium</h2>
          <div className="grid grid-cols-3 gap-md">
            {/* Show 2nd, 1st, 3rd for visual podium effect */}
            {[1, 0, 2].map((idx) => {
              const p = challenge.leaderboard[idx];
              if (!p) return null;
              return (
                <div key={p.userId} className={`border-2 p-lg text-center ${PODIUM_STYLES[idx] ?? 'border-kore-border bg-kore-white'} ${idx === 0 ? 'md:-mt-4' : ''}`}>
                  <div className="font-display text-h2 mb-xs">{PODIUM_LABELS[idx]}</div>
                  <div className="font-medium text-kore-ink">{p.userName}</div>
                  {p.storeName && <div className="text-caption text-kore-mid">{p.storeName}</div>}
                  <div className="font-display text-h3 mt-sm">{p.currentValue}{isVoting ? ' Stimmen' : ''}</div>
                  {p.isMe && <div className="text-caption text-kore-brass font-medium mt-xs uppercase tracking-widest">(Du)</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Medal size={20} /> Leaderboard</h2>
      {!challenge.leaderboard?.length ? (
        <p className="text-body text-kore-mid">Noch keine Teilnehmer.</p>
      ) : (
        <div className="space-y-sm">
          {challenge.leaderboard.map((p: any) => {
            const pct = challenge.targetValue && challenge.targetValue > 0 ? Math.min(100, Math.round((p.currentValue / challenge.targetValue) * 100)) : null;
            return (
              <div key={p.userId} className={`bg-kore-white border p-md flex items-center gap-md ${p.isMe ? 'border-kore-brass border-2' : 'border-kore-border'}`}>
                <div className={`w-10 h-10 flex items-center justify-center text-small font-bold ${
                  p.rank === 1 ? 'bg-amber-100 text-amber-700' :
                  p.rank === 2 ? 'bg-gray-100 text-gray-600' :
                  p.rank === 3 ? 'bg-orange-100 text-orange-700' :
                  'bg-kore-bg text-kore-mid'
                }`}>
                  {p.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-xs">
                    <span className="font-medium text-kore-ink flex items-center gap-xs">
                      {p.userName} {p.isMe && <span className="text-caption text-kore-brass">(Du)</span>}
                    </span>
                    <span className="text-small text-kore-mid">
                      {p.currentValue}{challenge.targetValue ? ` / ${challenge.targetValue}` : ''}
                      {isVoting ? ' Stimmen' : ''}
                    </span>
                  </div>
                  {pct !== null && (
                    <div className="w-full bg-kore-bg h-2">
                      <div className={`h-2 transition-all ${p.isMe ? 'bg-kore-brass' : 'bg-kore-ink'}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
                {p.storeName && <span className="text-small text-kore-mid flex items-center gap-xs"><Store size={12} /> {p.storeName}</span>}
                {/* Vote button for VOTING mode */}
                {isVoting && isActive && isParticipant && !p.isMe && (
                  <button
                    onClick={() => handleVote(p.userId)}
                    disabled={castVote.isPending}
                    className={`px-md py-sm text-small flex items-center gap-xs transition-colors ${
                      challenge.myVote === p.userId
                        ? 'bg-kore-brass text-kore-white'
                        : 'border border-kore-border text-kore-mid hover:border-kore-ink hover:text-kore-ink'
                    }`}
                  >
                    <ThumbsUp size={14} /> {challenge.myVote === p.userId ? 'Gewaehlt' : 'Abstimmen'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Entries (KPI mode) */}
      {isKpi && challenge.entries?.length > 0 && (
        <div className="mt-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Letzte Einreichungen</h2>
          <div className="space-y-sm">
            {challenge.entries.slice(0, 20).map((e: any) => (
              <div key={e.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                <div>
                  <span className="font-medium text-kore-ink">{challenge.anonymized ? 'Anonym' : (e.user?.name ?? 'Unbekannt')}</span>
                  {e.note && <span className="text-small text-kore-mid ml-md">{e.note}</span>}
                </div>
                <div className="text-right">
                  <span className="font-medium text-kore-ink">+{e.value}</span>
                  <span className="text-caption text-kore-faint ml-md">{new Date(e.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
