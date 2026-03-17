import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  UserPlus,
  FileText,
  BarChart3,
  Plus,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  useOnboardingStores,
  useOnboardingDashboard,
  useOnboardingJourneys,
} from '../../../hooks/useOnboarding';

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-emerald-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};
const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'Aktiv',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

export function OverviewPage() {
  const { data: stores } = useOnboardingStores();
  const [selectedStore, setSelectedStore] = useState('');
  const storeId = selectedStore || undefined;

  const { data: dashboard, isLoading: dashLoading } = useOnboardingDashboard({ storeId });
  const { data: journeys, isLoading: jLoading } = useOnboardingJourneys({
    storeId,
    status: 'IN_PROGRESS',
    pageSize: 5,
  });

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div className="flex items-center gap-md">
          <Link to="/tools" className="text-kore-mid hover:text-kore-ink transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-display text-h1 text-kore-ink">Onboarding</h1>
            <p className="text-body text-kore-mid mt-xs">
              Neue Mitarbeiter systematisch einarbeiten, Fortschritt verfolgen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/onboarding/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link
            to="/tools/onboarding/journeys"
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Alle Journeys
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
                {s.name}
                {s.city ? ` (${s.city})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Tiles */}
      {dashLoading ? (
        <div className="text-body text-kore-mid mb-xl">Lade...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <Users size={16} className="text-kore-brass" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt</span>
            </div>
            <div className="font-display text-h1 text-kore-ink">{dashboard?.kpis?.total ?? 0}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <Clock size={16} className="text-emerald-600" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Aktiv</span>
            </div>
            <div className="font-display text-h1 text-emerald-600">
              {dashboard?.kpis?.active ?? 0}
            </div>
            <span className="text-small text-kore-mid">
              {dashboard?.kpis?.avgProgress ?? 0}% Durchschn.
            </span>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <CheckCircle size={16} className="text-blue-600" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">
                Abgeschlossen
              </span>
            </div>
            <div className="font-display text-h1 text-blue-600">
              {dashboard?.kpis?.completed ?? 0}
            </div>
            <span className="text-small text-kore-mid">
              {dashboard?.kpis?.avgCompletionDays ?? 0} Tage Durchschn.
            </span>
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <XCircle size={16} className="text-red-500" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">
                Abgebrochen
              </span>
            </div>
            <div className="font-display text-h1 text-red-500">
              {dashboard?.kpis?.cancelled ?? 0}
            </div>
          </div>
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-2xl">
        <Link
          to="/tools/onboarding/templates"
          className="bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors"
        >
          <FileText size={20} className="text-kore-brass mb-sm" />
          <h3 className="font-medium text-kore-ink mb-xs">Templates</h3>
          <p className="text-small text-kore-mid">
            Einarbeitungsplaene erstellen und verwalten
          </p>
        </Link>
        <Link
          to="/tools/onboarding/journeys"
          className="bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors"
        >
          <UserPlus size={20} className="text-kore-brass mb-sm" />
          <h3 className="font-medium text-kore-ink mb-xs">Journeys</h3>
          <p className="text-small text-kore-mid">
            Aktive & abgeschlossene Einarbeitungen einsehen
          </p>
        </Link>
        <Link
          to="/tools/onboarding/dashboard"
          className="bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors"
        >
          <BarChart3 size={20} className="text-kore-brass mb-sm" />
          <h3 className="font-medium text-kore-ink mb-xs">Dashboard</h3>
          <p className="text-small text-kore-mid">
            Statistiken, Mentor-Uebersicht und Store-Vergleich
          </p>
        </Link>
      </div>

      {/* Active journeys */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Aktive Einarbeitungen</h2>
      {jLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !journeys?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <UserPlus size={36} className="text-kore-faint mx-auto mb-md" />
          <p className="text-body text-kore-mid">Keine aktiven Journeys vorhanden.</p>
          <Link
            to="/tools/onboarding/journeys"
            className="inline-flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 mt-md"
          >
            <Plus size={14} /> Neue Journey starten
          </Link>
        </div>
      ) : (
        <div className="space-y-sm">
          {journeys.data.map((j: any) => (
            <Link
              key={j.id}
              to={`/tools/onboarding/journeys/${j.id}`}
              className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors"
            >
              <div className="flex items-center justify-between mb-sm">
                <span className="font-medium text-kore-ink flex items-center gap-xs">
                  <UserPlus size={14} /> {j.user?.name ?? 'Unbekannt'}
                </span>
                <div className="flex items-center gap-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${STATUS_COLORS[j.status] ?? 'bg-kore-mid'}`}
                  />
                  <span className="text-small text-kore-mid">
                    {STATUS_LABELS[j.status] ?? j.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-lg text-small text-kore-mid mb-sm">
                <span>{j.template?.name ?? '--'}</span>
                {j.store && <span>{j.store.name}</span>}
                {j.mentor && <span>Buddy: {j.mentor.name}</span>}
              </div>
              {/* Progress bar */}
              <div className="w-full bg-kore-bg h-2">
                <div
                  className="bg-emerald-500 h-2 transition-all"
                  style={{ width: `${j.progressPct ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-xs text-small text-kore-mid">
                <span>
                  {j.completedSteps ?? 0} / {j.totalSteps ?? 0} Schritte
                </span>
                <span>{j.progressPct ?? 0}%</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
