import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Plus,
  TrendingUp,
  BookOpen,
  BarChart3,
  Zap,
  AlertTriangle,
  Briefcase,
  Users,
} from 'lucide-react';
import {
  useWellbeingStores,
  useWellbeingSummary,
} from '../../../hooks/useWellbeing';

const MOOD_LABELS = ['', 'Schlecht', 'Maessig', 'Ok', 'Gut', 'Sehr gut'];

function scoreColor(val: number, inverted?: boolean): string {
  if (inverted) {
    if (val > 3) return 'text-red-600';
    if (val > 2) return 'text-amber-600';
    return 'text-emerald-600';
  }
  if (val >= 4) return 'text-emerald-600';
  if (val >= 3) return 'text-amber-600';
  return 'text-red-600';
}

export function OverviewPage() {
  const { data: stores } = useWellbeingStores();
  const [selectedStore, setSelectedStore] = useState<string>('');

  const storeId = selectedStore || undefined;
  const { data: summary, isLoading } = useWellbeingSummary({ storeId });

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Heart size={24} /> Wellbeing
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Team-Wohlbefinden im Blick behalten.
          </p>
        </div>
        <div className="flex gap-sm">
          <Link
            to="/tools/wellbeing/resources"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <BookOpen size={16} /> Ressourcen
          </Link>
          <Link
            to="/tools/wellbeing/trends"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <TrendingUp size={16} /> Trends
          </Link>
          <Link
            to="/tools/wellbeing/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link
            to="/tools/wellbeing/checkin"
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Check-In
          </Link>
        </div>
      </div>

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <div className="mb-xl">
          <label className="block text-small text-kore-mid mb-xs">Store</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="border border-kore-border px-md py-sm text-body min-w-[200px]"
          >
            <option value="">Alle Stores</option>
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.city ? ` (${s.city})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Zusammenfassung...</div>
      ) : !summary || summary.totalCheckIns === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <Heart size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Check-In-Daten vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Starten Sie den ersten Stimmungs-Check-In fuer Ihr Team.
          </p>
          <Link
            to="/tools/wellbeing/checkin"
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Ersten Check-In starten
          </Link>
        </div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <Heart size={16} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Stimmung</span>
              </div>
              <div className={`font-display text-h1 mb-xs ${summary.avgMood ? scoreColor(summary.avgMood) : 'text-kore-mid'}`}>
                {summary.avgMood ? summary.avgMood.toFixed(1) : '--'}
              </div>
              {summary.avgMood && (
                <div className="text-small text-kore-mid">{MOOD_LABELS[Math.round(summary.avgMood)] ?? ''}</div>
              )}
            </div>

            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <Zap size={16} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Energie</span>
              </div>
              <div className={`font-display text-h1 ${summary.avgEnergy ? scoreColor(summary.avgEnergy) : 'text-kore-mid'}`}>
                {summary.avgEnergy ? summary.avgEnergy.toFixed(1) : '--'}
              </div>
            </div>

            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <AlertTriangle size={16} className="text-red-500" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Stress</span>
              </div>
              <div className={`font-display text-h1 ${summary.avgStress ? scoreColor(summary.avgStress, true) : 'text-kore-mid'}`}>
                {summary.avgStress ? summary.avgStress.toFixed(1) : '--'}
              </div>
            </div>

            <div className="bg-kore-white border border-kore-border p-lg text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <Briefcase size={16} className="text-amber-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Workload</span>
              </div>
              <div className={`font-display text-h1 ${summary.avgWorkload ? scoreColor(summary.avgWorkload) : 'text-kore-mid'}`}>
                {summary.avgWorkload ? summary.avgWorkload.toFixed(1) : '--'}
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-display text-h3 text-kore-ink">Zusammenfassung</h2>
              <span className="text-small text-kore-mid">{summary.totalCheckIns} Check-Ins</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md text-small">
              <div>
                <span className="text-kore-mid">Zeitraum:</span>
                <span className="text-kore-ink ml-sm">
                  {summary.periodStart ? new Date(summary.periodStart).toLocaleDateString('de-DE') : '--'} –{' '}
                  {summary.periodEnd ? new Date(summary.periodEnd).toLocaleDateString('de-DE') : '--'}
                </span>
              </div>
              <div className="flex items-center gap-xs">
                <Users size={14} className="text-kore-mid" />
                <span className="text-kore-mid">Teilnehmer:</span>
                <span className="text-kore-ink">{summary.uniqueUsers ?? 0}</span>
              </div>
              {summary.criticalAlerts > 0 && (
                <div className="flex items-center gap-xs col-span-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="text-red-600 font-medium">
                    {summary.criticalAlerts} kritische Meldung{summary.criticalAlerts !== 1 ? 'en' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
