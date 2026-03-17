import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, AlertTriangle, Clock, Target,
  CheckCircle2, XCircle, Users, Building2,
} from 'lucide-react';
import { usePdpStores, usePdpDashboard } from '../../../hooks/usePdpPip';

export function DashboardPage() {
  const { data: stores } = usePdpStores();
  const [storeId, setStoreId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    // Leave storeId empty to show all stores by default
  }, [stores]);

  const { data: dashboard } = usePdpDashboard({
    storeId: storeId || undefined,
    type: typeFilter || undefined,
  });

  const kpis = dashboard?.kpis;
  const upcomingDeadlines = dashboard?.upcomingDeadlines ?? [];
  const needsReview = dashboard?.needsReview ?? [];
  const byStore = dashboard?.byStore ?? [];

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/pdp-pip" className="text-kore-mid hover:text-kore-ink">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> PDP/PIP Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">Uebersicht aller Entwicklungs- und Verbesserungsplaene</p>
        </div>
        <div className="flex items-center gap-sm">
          {stores && stores.length > 1 && (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="border border-kore-border px-md py-sm text-small"
            >
              <option value="">Alle Stores</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-kore-border px-md py-sm text-small"
          >
            <option value="">Alle Typen</option>
            <option value="PDP">PDP</option>
            <option value="PIP">PIP</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-md mb-xl">
          {[
            { label: 'Aktiv', value: kpis.activePlans, color: 'text-blue-600', icon: Target },
            { label: 'Abgeschlossen', value: kpis.completedPlans, color: 'text-emerald-600', icon: CheckCircle2 },
            { label: 'Abgebrochen', value: kpis.cancelledPlans, color: 'text-red-500', icon: XCircle },
            { label: 'PDP', value: kpis.pdpCount, color: 'text-indigo-600', icon: Users },
            { label: 'PIP', value: kpis.pipCount, color: 'text-orange-600', icon: AlertTriangle },
            { label: 'Ueberfaellig', value: kpis.overduePlans, color: kpis.overduePlans > 0 ? 'text-red-600' : 'text-kore-mid', icon: Clock },
          ].map((k, i) => (
            <div key={i} className="bg-kore-white border border-kore-border p-md text-center">
              <k.icon size={18} className={`mx-auto mb-xs ${k.color}`} />
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-kore-mid uppercase mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Goal Stats */}
      {kpis && kpis.totalGoals > 0 && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Ziel-Statistiken</h2>
          <div className="grid grid-cols-3 gap-md mb-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-kore-ink">{kpis.totalGoals}</div>
              <div className="text-xs text-kore-mid uppercase">Ziele gesamt</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{kpis.goalCompletionRate}%</div>
              <div className="text-xs text-kore-mid uppercase">Abschlussquote</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{kpis.avgProgress}%</div>
              <div className="text-xs text-kore-mid uppercase">Durchschn. Fortschritt</div>
            </div>
          </div>
          <div className="w-full bg-kore-bg rounded-full h-4">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
              style={{ width: `${kpis.avgProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
        {/* Upcoming Deadlines */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <Clock size={18} /> Anstehende Fristen
          </h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-body text-kore-mid">Keine anstehenden Fristen.</p>
          ) : (
            <div className="space-y-sm">
              {upcomingDeadlines.map((d: any) => {
                const days = Math.ceil((new Date(d.targetDate).getTime() - Date.now()) / 86400000);
                return (
                  <Link
                    key={d.id}
                    to={`/tools/pdp-pip/plans/${d.id}`}
                    className="block p-sm border border-kore-border hover:border-kore-ink transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-kore-ink text-small">{d.title}</span>
                        <span className="text-xs text-kore-mid ml-sm">{d.userName}</span>
                      </div>
                      <div className="flex items-center gap-sm">
                        <span className={`px-sm py-xs text-xs ${d.type === 'PDP' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                          {d.type}
                        </span>
                        <span className={`text-xs font-medium ${days <= 3 ? 'text-red-600' : days <= 7 ? 'text-amber-600' : 'text-kore-mid'}`}>
                          {days}T
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs Review */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <AlertTriangle size={18} /> Review faellig
          </h2>
          {needsReview.length === 0 ? (
            <p className="text-body text-kore-mid">Alle Plaene aktuell reviewed.</p>
          ) : (
            <div className="space-y-sm">
              {needsReview.slice(0, 10).map((r: any) => (
                <Link
                  key={r.id}
                  to={`/tools/pdp-pip/plans/${r.id}`}
                  className="block p-sm border border-kore-border hover:border-kore-ink transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-kore-ink text-small">{r.title}</span>
                      <span className="text-xs text-kore-mid ml-sm">{r.userName}</span>
                    </div>
                    <div className="flex items-center gap-sm">
                      <span className={`px-sm py-xs text-xs ${r.type === 'PDP' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                        {r.type}
                      </span>
                      <span className="text-xs text-red-500">
                        {r.lastReview ? `Letztes: ${new Date(r.lastReview).toLocaleDateString('de-DE')}` : 'Kein Review'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              {needsReview.length > 10 && (
                <p className="text-xs text-kore-mid text-center">
                  +{needsReview.length - 10} weitere
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Store Comparison */}
      {byStore.length > 1 && (
        <div className="bg-kore-white border border-kore-border p-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <Building2 size={18} /> Store-Vergleich
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="text-left py-sm px-sm text-kore-mid font-medium">Store</th>
                  <th className="text-center py-sm px-sm text-kore-mid font-medium">Gesamt</th>
                  <th className="text-center py-sm px-sm text-kore-mid font-medium">Aktiv</th>
                  <th className="text-center py-sm px-sm text-kore-mid font-medium">Abgeschlossen</th>
                  <th className="text-center py-sm px-sm text-kore-mid font-medium">PDP</th>
                  <th className="text-center py-sm px-sm text-kore-mid font-medium">PIP</th>
                </tr>
              </thead>
              <tbody>
                {byStore.map((s: any) => (
                  <tr key={s.storeId} className="border-b border-kore-border last:border-0">
                    <td className="py-sm px-sm font-medium text-kore-ink">{s.storeName}</td>
                    <td className="py-sm px-sm text-center">{s.total}</td>
                    <td className="py-sm px-sm text-center text-blue-600 font-medium">{s.active}</td>
                    <td className="py-sm px-sm text-center text-emerald-600 font-medium">{s.completed}</td>
                    <td className="py-sm px-sm text-center text-indigo-600">{s.pdp}</td>
                    <td className="py-sm px-sm text-center text-orange-600">{s.pip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!kpis && (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-kore-mid">
          Keine Daten verfuegbar.
        </div>
      )}
    </div>
  );
}
