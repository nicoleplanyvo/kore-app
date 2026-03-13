import { Link } from 'react-router-dom';
import { Heart, Plus, TrendingUp, BookOpen } from 'lucide-react';
import { useWellbeingSummary } from '../../../hooks/useWellbeing';

const MOOD_EMOJI = ['', '😞', '😐', '🙂', '😊', '🤩'];
const MOOD_LABELS = ['', 'Schlecht', 'Mäßig', 'Ok', 'Gut', 'Sehr gut'];

export function OverviewPage() {
  const { data: summary, isLoading } = useWellbeingSummary();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Heart size={24} /> Wellbeing</h1>
          <p className="text-body text-kore-mid mt-xs">Team-Wohlbefinden im Blick behalten.</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/wellbeing/resources" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <BookOpen size={16} /> Ressourcen
          </Link>
          <Link to="/tools/wellbeing/trends" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <TrendingUp size={16} /> Trends
          </Link>
          <Link to="/tools/wellbeing/checkin" className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={16} /> Check-In
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Zusammenfassung...</div>
      ) : !summary ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Check-In-Daten vorhanden.</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-md mb-xl">
            {[
              { label: 'Stimmung', value: summary.avgMood, emoji: true },
              { label: 'Energie', value: summary.avgEnergy, emoji: false },
              { label: 'Stress', value: summary.avgStress, emoji: false, inverted: true },
              { label: 'Workload', value: summary.avgWorkload, emoji: false },
            ].map(item => {
              const val = item.value ? Number(item.value) : 0;
              const rounded = Math.round(val);
              return (
                <div key={item.label} className="bg-kore-white border border-kore-border p-lg text-center">
                  {item.emoji && rounded > 0 ? (
                    <div className="text-3xl mb-sm">{MOOD_EMOJI[rounded]}</div>
                  ) : (
                    <div className={`font-display text-h1 mb-sm ${item.inverted ? (val > 3 ? 'text-red-500' : val > 2 ? 'text-amber-500' : 'text-emerald-500') : (val >= 4 ? 'text-emerald-500' : val >= 3 ? 'text-amber-500' : 'text-red-500')}`}>
                      {val > 0 ? val.toFixed(1) : '—'}
                    </div>
                  )}
                  <div className="text-small text-kore-mid">{item.label}</div>
                  {item.emoji && rounded > 0 && <div className="text-small text-kore-mid">{MOOD_LABELS[rounded]} ({val.toFixed(1)})</div>}
                </div>
              );
            })}
          </div>

          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-h3 text-kore-ink">Zusammenfassung</h2>
              <span className="text-small text-kore-mid">{summary.totalCheckIns ?? 0} Check-Ins</span>
            </div>
            <div className="grid grid-cols-2 gap-md text-small">
              <div>
                <span className="text-kore-mid">Zeitraum:</span>
                <span className="text-kore-ink ml-sm">{summary.periodStart ? new Date(summary.periodStart).toLocaleDateString('de-DE') : '—'} – {summary.periodEnd ? new Date(summary.periodEnd).toLocaleDateString('de-DE') : '—'}</span>
              </div>
              <div>
                <span className="text-kore-mid">Teilnehmer:</span>
                <span className="text-kore-ink ml-sm">{summary.uniqueUsers ?? 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
