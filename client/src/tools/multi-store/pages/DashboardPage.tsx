import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Store,
  CircleDot,
} from 'lucide-react';
import { useMultiStoreDashboard } from '../../../hooks/useMultiStore';

/* eslint-disable @typescript-eslint/no-explicit-any */

const TYPE_LABELS: Record<string, string> = {
  TODO: 'To-Do',
  CHECKLIST: 'Checkliste',
  CAMPAIGN: 'Kampagne',
  SURVEY: 'Umfrage',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-kore-bg',
  MEDIUM: 'bg-blue-100',
  HIGH: 'bg-amber-100',
  URGENT: 'bg-red-100',
};

export function DashboardPage() {
  const { data: dashboard, isLoading } = useMultiStoreDashboard();

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/multi-store" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Multi-Store Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Compliance-Uebersicht, Trends und Problemstores.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid py-2xl text-center">Lade Dashboard...</div>
      ) : !dashboard ? (
        <div className="text-body text-kore-mid py-2xl text-center">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-md mb-xl">
            <KPITile
              icon={ClipboardList}
              label="Gesamt"
              value={dashboard.kpis.totalTasks}
              color="text-kore-ink"
            />
            <KPITile
              icon={CircleDot}
              label="Offen"
              value={dashboard.kpis.openTasks}
              color="text-blue-600"
            />
            <KPITile
              icon={Clock}
              label="In Bearbeitung"
              value={dashboard.kpis.inProgressTasks}
              color="text-amber-600"
            />
            <KPITile
              icon={CheckCircle2}
              label="Erledigt"
              value={dashboard.kpis.completedTasks}
              color="text-emerald-600"
            />
            <KPITile
              icon={AlertTriangle}
              label="Ueberfaellig"
              value={dashboard.kpis.overdueTasks}
              color="text-red-600"
            />
            <KPITile
              icon={TrendingUp}
              label="Compliance"
              value={`${dashboard.kpis.complianceRate}%`}
              color="text-kore-brass"
            />
            <KPITile
              icon={Clock}
              label="Durchschn. Reaktion"
              value={`${dashboard.kpis.avgResponseTimeHours}h`}
              color="text-kore-ink"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-xl">
            {/* Overall compliance */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-body font-medium text-kore-ink mb-md">
                Gesamt-Compliance
              </h3>
              <div className="flex items-end gap-md">
                <span className="font-display text-h1 text-kore-ink">
                  {dashboard.kpis.complianceRate}%
                </span>
                <span className="text-small text-kore-mid mb-xs">
                  aller Store-Aufgaben erledigt
                </span>
              </div>
              <div className="mt-md h-3 bg-kore-bg rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    dashboard.kpis.complianceRate >= 80 ? 'bg-emerald-500' :
                    dashboard.kpis.complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${dashboard.kpis.complianceRate}%` }}
                />
              </div>
            </div>

            {/* By type */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-body font-medium text-kore-ink mb-md">
                Nach Aufgabentyp
              </h3>
              <div className="space-y-sm">
                {Object.entries(dashboard.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-small text-kore-mid">{TYPE_LABELS[type] ?? type}</span>
                    <span className="font-medium text-kore-ink">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg mb-xl">
            {/* By priority */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-body font-medium text-kore-ink mb-md">
                Nach Prioritaet
              </h3>
              <div className="space-y-sm">
                {Object.entries(dashboard.byPriority).map(([prio, count]) => (
                  <div key={prio} className="flex items-center gap-md">
                    <div className={`w-3 h-3 rounded-sm ${PRIORITY_COLORS[prio] ?? 'bg-kore-bg'}`} />
                    <span className="text-small text-kore-mid flex-1">{PRIORITY_LABELS[prio] ?? prio}</span>
                    <span className="font-medium text-kore-ink">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trends */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-body font-medium text-kore-ink mb-md">
                Wochen-Trend (letzte 4 Wochen)
              </h3>
              {dashboard.trends.length === 0 ? (
                <p className="text-small text-kore-mid">Keine Trend-Daten vorhanden.</p>
              ) : (
                <div className="space-y-sm">
                  {dashboard.trends.map((t) => (
                    <div key={t.week} className="flex items-center gap-md">
                      <span className="text-small text-kore-mid w-16">{t.week}</span>
                      <div className="flex-1 flex items-center gap-sm">
                        <div className="flex-1 h-2 bg-kore-bg rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-blue-400"
                            style={{ width: `${Math.min(100, t.created * 10)}%` }}
                          />
                        </div>
                        <span className="text-small text-blue-600 w-8">{t.created}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-sm">
                        <div className="flex-1 h-2 bg-kore-bg rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${Math.min(100, t.completed * 10)}%` }}
                          />
                        </div>
                        <span className="text-small text-emerald-600 w-8">{t.completed}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-md text-small text-kore-mid pt-sm border-t border-kore-border">
                    <span className="flex items-center gap-xs"><span className="w-3 h-2 bg-blue-400 rounded-sm" /> Erstellt</span>
                    <span className="flex items-center gap-xs"><span className="w-3 h-2 bg-emerald-400 rounded-sm" /> Erledigt</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Store compliance */}
          <div className="bg-kore-white border border-kore-border p-lg mb-lg">
            <h3 className="font-display text-body font-medium text-kore-ink mb-md flex items-center gap-sm">
              <Store size={16} /> Store-Compliance
            </h3>
            {dashboard.storeCompliance.length === 0 ? (
              <p className="text-small text-kore-mid text-center py-lg">Keine Store-Daten vorhanden.</p>
            ) : (
              <div className="space-y-sm">
                {dashboard.storeCompliance.map((store) => (
                  <div key={store.storeId} className="flex items-center gap-md">
                    <span className="text-small text-kore-ink font-medium w-40 truncate">{store.storeName}</span>
                    <div className="flex-1 h-3 bg-kore-bg rounded-sm overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          store.rate >= 80 ? 'bg-emerald-500' :
                          store.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${store.rate}%` }}
                      />
                    </div>
                    <span className={`text-small font-medium w-12 text-right ${
                      store.rate >= 80 ? 'text-emerald-600' :
                      store.rate >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {store.rate}%
                    </span>
                    <span className="text-small text-kore-mid w-20 text-right">
                      {store.completed}/{store.total}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Problem stores */}
          {dashboard.problemStores.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-lg">
              <h3 className="font-display text-body font-medium text-red-700 mb-md flex items-center gap-sm">
                <AlertTriangle size={16} /> Problemstores (Compliance unter 50%)
              </h3>
              <div className="space-y-sm">
                {dashboard.problemStores.map((store) => (
                  <div key={store.storeId} className="flex items-center justify-between bg-kore-white p-md border border-red-200">
                    <span className="font-medium text-kore-ink">{store.storeName}</span>
                    <div className="flex items-center gap-md">
                      <span className="text-small text-kore-mid">{store.completed} von {store.total} erledigt</span>
                      <span className="text-small font-medium text-red-600">{store.rate}%</span>
                    </div>
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

function KPITile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-kore-white border border-kore-border p-md">
      <div className="flex items-center gap-xs mb-sm">
        <Icon size={16} className={color} />
        <span className="text-small text-kore-mid">{label}</span>
      </div>
      <div className={`font-display text-h2 ${color}`}>{value}</div>
    </div>
  );
}
