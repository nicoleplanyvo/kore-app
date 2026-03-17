import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Store,
  FileText,
  Award,
} from 'lucide-react';
import { useOnboardingStores, useOnboardingDashboard } from '../../../hooks/useOnboarding';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function DashboardPage() {
  const { data: stores } = useOnboardingStores();
  const [selectedStore, setSelectedStore] = useState('');
  const storeId = selectedStore || undefined;

  const { data: dashboard, isLoading } = useOnboardingDashboard({ storeId });

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/onboarding"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Onboarding Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Statistiken, Fortschritt und Mentor-Uebersicht
          </p>
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

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard-Daten...</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-lg mb-2xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <Users size={14} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">
                  Gesamt
                </span>
              </div>
              <div className="font-display text-h2 text-kore-ink">
                {dashboard?.kpis?.total ?? 0}
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <Clock size={14} className="text-emerald-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">Aktiv</span>
              </div>
              <div className="font-display text-h2 text-emerald-600">
                {dashboard?.kpis?.active ?? 0}
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <CheckCircle size={14} className="text-blue-600" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">
                  Fertig
                </span>
              </div>
              <div className="font-display text-h2 text-blue-600">
                {dashboard?.kpis?.completed ?? 0}
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <XCircle size={14} className="text-red-500" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">
                  Abgebr.
                </span>
              </div>
              <div className="font-display text-h2 text-red-500">
                {dashboard?.kpis?.cancelled ?? 0}
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <BarChart3 size={14} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">
                  Fortschritt
                </span>
              </div>
              <div className="font-display text-h2 text-kore-ink">
                {dashboard?.kpis?.avgProgress ?? 0}%
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <Award size={14} className="text-kore-brass" />
                <span className="text-caption text-kore-mid uppercase tracking-widest">
                  Dauer
                </span>
              </div>
              <div className="font-display text-h2 text-kore-ink">
                {dashboard?.kpis?.avgCompletionDays ?? 0}
              </div>
              <span className="text-small text-kore-mid">Tage Durchschn.</span>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-xl">
            {/* By Store */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <Store size={18} /> Nach Store
              </h2>
              {dashboard?.byStore?.length ? (
                <div className="space-y-md">
                  {dashboard.byStore.map((s: any) => (
                    <div key={s.storeId} className="flex items-center gap-md">
                      <span className="flex-1 text-small text-kore-ink truncate">
                        {s.storeName}
                      </span>
                      <span className="text-small text-emerald-600 w-16 text-right">
                        {s.active} aktiv
                      </span>
                      <span className="text-small text-blue-600 w-16 text-right">
                        {s.completed} fertig
                      </span>
                      <span className="text-small text-kore-mid w-12 text-right">{s.total}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
              )}
            </div>

            {/* By Template */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <FileText size={18} /> Nach Template
              </h2>
              {dashboard?.byTemplate?.length ? (
                <div className="space-y-md">
                  {dashboard.byTemplate.map((t: any) => (
                    <div key={t.templateId} className="flex items-center gap-md">
                      <span className="flex-1 text-small text-kore-ink truncate">
                        {t.templateName}
                      </span>
                      <span className="text-small text-emerald-600 w-16 text-right">
                        {t.active} aktiv
                      </span>
                      <span className="text-small text-blue-600 w-16 text-right">
                        {t.completed} fertig
                      </span>
                      <span className="text-small text-kore-mid w-12 text-right">{t.total}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
              )}
            </div>
          </div>

          {/* Mentor overview */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
              <Users size={18} /> Buddy / Mentor Uebersicht
            </h2>
            {dashboard?.byMentor?.length ? (
              <div className="space-y-sm">
                {dashboard.byMentor.map((m: any) => (
                  <div key={m.mentorId} className="flex items-center gap-md">
                    <span className="flex-1 text-small text-kore-ink">{m.mentorName}</span>
                    <div className="w-32 bg-kore-bg h-3 relative">
                      <div
                        className="h-full bg-kore-brass"
                        style={{
                          width: `${m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-small text-kore-mid w-24 text-right">
                      {m.completed} / {m.assigned} fertig
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-small text-kore-mid">Keine Mentoren zugewiesen.</p>
            )}
          </div>

          {/* Recent completions */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
              <CheckCircle size={18} /> Zuletzt abgeschlossen
            </h2>
            {dashboard?.recentCompletions?.length ? (
              <div className="space-y-sm">
                {dashboard.recentCompletions.map((c: any) => (
                  <Link
                    key={c.id}
                    to={`/tools/onboarding/journeys/${c.id}`}
                    className="flex items-center gap-md hover:bg-kore-bg p-sm -mx-sm transition-colors"
                  >
                    <CheckCircle size={14} className="text-blue-500 flex-shrink-0" />
                    <span className="text-small text-kore-ink font-medium flex-1">
                      {c.userName}
                    </span>
                    <span className="text-small text-kore-mid">{c.templateName}</span>
                    <span className="text-small text-kore-mid">{c.storeName}</span>
                    <span className="text-small text-kore-mid">
                      {c.completedAt
                        ? new Date(c.completedAt).toLocaleDateString('de-DE')
                        : '--'}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-small text-kore-mid">Noch keine abgeschlossenen Einarbeitungen.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
