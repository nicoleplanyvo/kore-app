import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Target, Users } from 'lucide-react';
import { useChallenge, useJoinChallenge, useUpdateChallenge } from '../../../hooks/useChallenges';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Beendet', CANCELLED: 'Abgebrochen' };
const TYPE_LABELS: Record<string, string> = { INDIVIDUAL: 'Einzeln', TEAM: 'Team', STORE: 'Store' };

export function ChallengeDetailPage() {
  const { id } = useParams();
  const { data: challenge, isLoading } = useChallenge(id);
  const joinChallenge = useJoinChallenge();
  const updateChallenge = useUpdateChallenge();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!challenge) return <div className="p-xl text-body text-kore-mid">Challenge nicht gefunden.</div>;

  const handleActivate = () => updateChallenge.mutate({ id: challenge.id, status: 'ACTIVE' });
  const handleComplete = () => updateChallenge.mutate({ id: challenge.id, status: 'COMPLETED' });

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/challenges" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Trophy size={24} /> {challenge.title}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {STATUS_LABELS[challenge.status] ?? challenge.status} · {TYPE_LABELS[challenge.type] ?? challenge.type}
          </p>
        </div>
      </div>

      {challenge.description && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <p className="text-body text-kore-ink">{challenge.description}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        {challenge.metric && (
          <div className="bg-kore-white border border-kore-border p-md">
            <div className="text-small text-kore-mid mb-xs">Metrik</div>
            <div className="font-medium text-kore-ink flex items-center gap-xs"><Target size={14} /> {challenge.metric}</div>
          </div>
        )}
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Zielwert</div>
          <div className="font-medium text-kore-ink">{challenge.targetValue}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Teilnehmer</div>
          <div className="font-medium text-kore-ink flex items-center gap-xs"><Users size={14} /> {challenge.participants?.length ?? 0}</div>
        </div>
        {challenge.reward && (
          <div className="bg-kore-white border border-kore-border p-md">
            <div className="text-small text-kore-mid mb-xs">Belohnung</div>
            <div className="font-medium text-kore-ink">🏆 {challenge.reward}</div>
          </div>
        )}
      </div>

      {challenge.startDate && challenge.endDate && (
        <div className="text-small text-kore-mid mb-lg">
          Zeitraum: {new Date(challenge.startDate).toLocaleDateString('de-DE')} – {new Date(challenge.endDate).toLocaleDateString('de-DE')}
        </div>
      )}

      <div className="flex gap-sm mb-xl flex-wrap">
        {challenge.status === 'DRAFT' && (
          <button onClick={handleActivate} disabled={updateChallenge.isPending} className="px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">Aktivieren</button>
        )}
        {challenge.status === 'ACTIVE' && (
          <button onClick={handleComplete} disabled={updateChallenge.isPending} className="px-md py-sm bg-blue-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">Beenden</button>
        )}
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
        <Medal size={20} /> Leaderboard
      </h2>
      {!challenge.participants?.length ? (
        <p className="text-body text-kore-mid">Noch keine Teilnehmer.</p>
      ) : (
        <div className="space-y-sm">
          {challenge.participants.map((p: any, i: number) => {
            const pct = challenge.targetValue > 0 ? Math.min(100, Math.round(p.currentValue / challenge.targetValue * 100)) : 0;
            return (
              <div key={p.id} className="bg-kore-white border border-kore-border p-md flex items-center gap-md">
                <div className={`w-8 h-8 flex items-center justify-center text-small font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-kore-bg text-kore-mid'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-xs">
                    <span className="font-medium text-kore-ink">{p.user?.name ?? 'Unbekannt'}</span>
                    <span className="text-small text-kore-mid">{p.currentValue} / {challenge.targetValue}</span>
                  </div>
                  <div className="w-full bg-kore-bg rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {p.store && <span className="text-small text-kore-mid">{p.store.name}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
