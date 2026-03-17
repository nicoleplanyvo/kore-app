import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Users, TrendingUp, Award, Crown } from 'lucide-react';
import { useChallengeDashboard } from '../../../hooks/useChallenges';

const PODIUM_STYLES = [
  'bg-amber-50 border-amber-200 text-amber-800',
  'bg-gray-50 border-gray-200 text-gray-700',
  'bg-orange-50 border-orange-200 text-orange-700',
];

export function DashboardPage() {
  const { data, isLoading } = useChallengeDashboard();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;
  if (!data) return <div className="p-xl text-body text-kore-mid">Dashboard nicht verfuegbar.</div>;

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/challenges" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Challenge Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Ueberblick ueber alle Wettbewerbe und Ihre Erfolge</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Aktive Challenges</span>
          <div className="font-display text-h1 text-kore-ink mt-sm flex items-center gap-sm">
            <Trophy size={24} className="text-kore-brass" /> {data.activeChallenges}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Beteiligungsrate</span>
          <div className="font-display text-h1 text-kore-ink mt-sm flex items-center gap-sm">
            <Users size={24} className="text-kore-brass" /> {data.participationRate}%
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Meine Siege</span>
          <div className="font-display text-h1 text-kore-ink mt-sm flex items-center gap-sm">
            <Crown size={24} className="text-kore-brass" /> {data.myWins}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Meine Badges</span>
          <div className="font-display text-h1 text-kore-ink mt-sm flex items-center gap-sm">
            <Award size={24} className="text-kore-brass" /> {data.myBadges}
          </div>
        </div>
      </div>

      {/* Completed Challenges with Winners */}
      <h2 className="font-display text-h2 text-kore-ink mb-lg flex items-center gap-sm">
        <Medal size={22} /> Vergangene Challenges
      </h2>

      {!data.completedChallenges?.length ? (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <TrendingUp size={40} className="text-kore-faint mx-auto mb-md" />
          <p className="text-body text-kore-mid">Noch keine abgeschlossenen Challenges.</p>
        </div>
      ) : (
        <div className="space-y-lg">
          {data.completedChallenges.map((ch: any) => (
            <Link
              key={ch.id}
              to={`/tools/challenges/${ch.id}`}
              className="block bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors"
            >
              <div className="flex items-center justify-between mb-md">
                <h3 className="font-display text-h3 text-kore-ink">{ch.title}</h3>
                <div className="flex items-center gap-lg text-small text-kore-mid">
                  <span>{ch.type === 'INDIVIDUAL' ? 'Einzel' : ch.type === 'TEAM' ? 'Team' : 'Store'}</span>
                  <span>{ch.participantCount} Teilnehmer</span>
                </div>
              </div>

              {/* Winners */}
              {ch.winners?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                  {ch.winners.map((w: any, i: number) => (
                    <div key={i} className={`border p-md flex items-center gap-md ${PODIUM_STYLES[i] ?? 'border-kore-border'}`}>
                      <div className={`w-8 h-8 flex items-center justify-center font-bold text-small ${
                        i === 0 ? 'bg-amber-200 text-amber-800' :
                        i === 1 ? 'bg-gray-200 text-gray-700' :
                        'bg-orange-200 text-orange-700'
                      }`}>
                        {w.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-kore-ink truncate">{w.userName}</div>
                        {w.storeName && <div className="text-caption text-kore-mid">{w.storeName}</div>}
                      </div>
                      <div className="text-small font-medium">{w.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
