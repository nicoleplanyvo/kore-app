import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { useAppraisalDashboard, useAppraisalStores } from '../../../hooks/useAppraisals';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Entwurf',
  SELF_REVIEW: 'Selbsteinschaetzung',
  MANAGER_REVIEW: 'Durchgefuehrt',
  COMPLETED: 'Abgeschlossen',
};

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useAppraisalStores();
  const { data: dashboard, isLoading } = useAppraisalDashboard(storeId || undefined);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/appraisals" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">Beurteilungs-KPIs, Durchschnittsbewertungen und Trends</p>
        </div>
        <select
          value={storeId}
          onChange={e => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Stores</option>
          {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!dashboard ? (
        <div className="bg-kore-white border border-kore-border p-3xl text-center text-body text-kore-mid">Keine Daten vorhanden.</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-2xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{dashboard.total}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Abgeschlossen</span>
              <div className="font-display text-h2 text-emerald-600 mt-sm">{dashboard.completed}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ausstehend</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{dashboard.pending + dashboard.selfReview + dashboard.managerReview}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ueberfaellig</span>
              <div className={`font-display text-h2 mt-sm ${dashboard.overdue > 0 ? 'text-red-600' : 'text-kore-ink'}`}>{dashboard.overdue}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Score</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{dashboard.avgScore ? `${dashboard.avgScore}/5` : '--'}</div>
            </div>
          </div>

          {/* Category Averages (bar chart) */}
          {dashboard.categoryAverages?.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <TrendingUp size={18} /> Durchschnittsbewertung nach Kategorie
              </h2>
              <div className="space-y-md">
                {dashboard.categoryAverages.map((cat: any) => (
                  <div key={cat.name} className="flex items-center gap-lg">
                    <span className="text-small text-kore-ink w-32 truncate">{cat.name}</span>
                    <div className="flex-1 bg-kore-bg h-6 relative">
                      <div
                        className="bg-kore-ink h-full flex items-center justify-end pr-sm transition-all"
                        style={{ width: `${(cat.average / 5) * 100}%` }}
                      >
                        <span className="text-caption text-kore-white font-medium">{cat.average}</span>
                      </div>
                    </div>
                    <span className="text-small text-kore-faint w-12 text-right">{cat.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trend over Cycles */}
          {dashboard.trends?.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <TrendingUp size={18} /> Trend ueber Zyklen
              </h2>
              <div className="space-y-md">
                {dashboard.trends.map((t: any) => (
                  <div key={t.cycle} className="flex items-center gap-lg">
                    <span className="text-small text-kore-ink w-40 truncate">{t.cycle}</span>
                    <div className="flex-1 bg-kore-bg h-6 relative">
                      <div
                        className="bg-kore-brass h-full flex items-center justify-end pr-sm transition-all"
                        style={{ width: `${(t.average / 5) * 100}%` }}
                      >
                        <span className="text-caption text-kore-white font-medium">{t.average}</span>
                      </div>
                    </div>
                    <span className="text-small text-kore-faint w-12 text-right">{t.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Due Soon */}
          {dashboard.dueSoon?.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <AlertTriangle size={18} /> Faellige Beurteilungen (naechste 7 Tage)
              </h2>
              <div className="space-y-sm">
                {dashboard.dueSoon.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/tools/appraisals/appraisals/${item.id}`}
                    className="flex items-center justify-between p-md border border-kore-border hover:border-kore-ink transition-colors"
                  >
                    <span className="text-body text-kore-ink">{item.employeeName}</span>
                    <div className="flex items-center gap-md">
                      {item.storeName && <span className="text-small text-kore-mid">{item.storeName}</span>}
                      <span className="text-small text-amber-600">{STATUS_LABELS[item.status] ?? item.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Store Comparison (Regional) */}
          {dashboard.storeComparison?.length > 1 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <Users size={18} /> Store-Vergleich
              </h2>
              <div className="space-y-md">
                {dashboard.storeComparison.map((s: any, idx: number) => (
                  <div key={s.store} className="flex items-center gap-lg">
                    <span className="text-small text-kore-faint w-6">{idx + 1}.</span>
                    <span className="text-small text-kore-ink w-40 truncate">{s.store}</span>
                    <div className="flex-1 bg-kore-bg h-6 relative">
                      <div
                        className="bg-kore-ink h-full flex items-center justify-end pr-sm transition-all"
                        style={{ width: `${(s.average / 5) * 100}%` }}
                      >
                        <span className="text-caption text-kore-white font-medium">{s.average}</span>
                      </div>
                    </div>
                    <span className="text-small text-kore-faint w-12 text-right">{s.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
