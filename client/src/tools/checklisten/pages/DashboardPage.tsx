import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';
import { useChecklistDashboard, useChecklistStores } from '../../../hooks/useChecklist';

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useChecklistStores();
  const { data: dashboard, isLoading } = useChecklistDashboard(storeId || undefined);

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/checklisten" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-brass transition-colors mb-lg">
        <ArrowLeft size={14} />
        Zurueck
      </Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Tagesfortschritt, ueberfaellige Checklisten und Historie</p>
        </div>

        {stores && stores.length > 1 && (
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="border border-kore-border px-lg py-md text-small bg-kore-white min-w-[200px]"
          >
            <option value="">Alle Stores</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard...</div>
      ) : dashboard ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            {/* Today's Rate */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Heute erledigt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.today.rate}%</div>
              <p className="text-small text-kore-mid mt-xs">{dashboard.today.completed} von {dashboard.today.total}</p>
            </div>

            {/* Overdue */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ueberfaellig</span>
              <div className={`font-display text-h1 mt-sm ${dashboard.overdue.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {dashboard.overdue.length}
              </div>
              <p className="text-small text-kore-mid mt-xs">Offene Checklisten</p>
            </div>

            {/* This Month */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Diesen Monat</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.thisMonth.completed}</div>
              <p className="text-small text-kore-mid mt-xs">von {dashboard.thisMonth.total} abgeschlossen</p>
            </div>

            {/* Avg Completion */}
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Erfuellungsgrad</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.avgCompletionRate}%</div>
              <p className="text-small text-kore-mid mt-xs">Alle Checklisten</p>
            </div>
          </div>

          {/* Overdue List */}
          {dashboard.overdue.length > 0 && (
            <div className="bg-kore-white border border-red-200 p-xl mb-xl">
              <div className="flex items-center gap-sm mb-lg">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="font-display text-h3 text-kore-ink">Ueberfaellige Checklisten</h2>
              </div>
              <div className="space-y-sm">
                {dashboard.overdue.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/tools/checklisten/checklists/${item.id}`}
                    className="flex items-center justify-between p-md hover:bg-red-50 transition-colors"
                  >
                    <div>
                      <span className="text-body text-kore-ink">{item.template}</span>
                      <span className="text-small text-kore-mid ml-md">{item.store}</span>
                    </div>
                    <span className="text-small text-red-600">{item.dueDate}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent History */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <div className="flex items-center gap-sm mb-lg">
              <Calendar size={18} className="text-kore-brass" />
              <h2 className="font-display text-h3 text-kore-ink">Letzte Aktivitaeten</h2>
            </div>

            {dashboard.recentHistory.length > 0 ? (
              <div className="space-y-sm">
                {dashboard.recentHistory.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/tools/checklisten/checklists/${item.id}`}
                    className="flex items-center justify-between p-md hover:bg-kore-bg transition-colors"
                  >
                    <div className="flex items-center gap-md">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <div>
                        <span className="text-body text-kore-ink">{item.template}</span>
                        <span className="text-small text-kore-mid ml-md">{item.store}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-small text-kore-mid">
                        {item.completedAt ? new Date(item.completedAt).toLocaleDateString('de-DE') : '-'}
                      </span>
                      <span className="text-small text-kore-faint ml-md">{item.completionRate}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-small text-kore-mid">Noch keine abgeschlossenen Checklisten.</p>
            )}
          </div>
        </>
      ) : (
        <div className="text-body text-kore-mid">Keine Daten verfuegbar.</div>
      )}
    </div>
  );
}
