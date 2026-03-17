import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  ArrowRightLeft,
  Check,
  Clock,
  FileText,
  AlertTriangle,
  TrendingUp,
  Store,
  ChevronRight,
} from 'lucide-react';
import { useHandoverDashboard, useHandoverStores } from '../../../hooks/useHandover';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  ACKNOWLEDGED: 'bg-emerald-100 text-emerald-700',
};

const SHIFT_LABELS: Record<string, string> = {
  'FRUEH_SPAET': 'Frueh \u2192 Spaet',
  'SPAET_NACHT': 'Spaet \u2192 Nacht',
  'NACHT_FRUEH': 'Nacht \u2192 Frueh',
};

export function DashboardPage() {
  const { data: stores } = useHandoverStores();
  const [selectedStore, setSelectedStore] = useState('');

  // Default period: last 30 days
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(thirtyDaysAgo);
  const [toDate, setToDate] = useState(today);

  const { data: dashboard, isLoading } = useHandoverDashboard({
    storeId: selectedStore || undefined,
    from: fromDate,
    to: toDate,
  });

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min.`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} Std. ${mins} Min.` : `${hours} Std.`;
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/handover" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Uebergabe-Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Ueberblick ueber Uebergabe-Compliance und Aktivitaet.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-xl flex-wrap">
        {stores && stores.length > 1 && (
          <div className="flex items-center gap-xs">
            <Store size={16} className="text-kore-mid" />
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-kore-border px-md py-sm text-small bg-kore-white"
            >
              <option value="">Alle Stores</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.city ? ` (${s.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-xs">
          <label className="text-small text-kore-mid">Von:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-kore-border px-md py-sm text-small"
          />
        </div>
        <div className="flex items-center gap-xs">
          <label className="text-small text-kore-mid">Bis:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-kore-border px-md py-sm text-small"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid py-2xl text-center">Lade Dashboard...</div>
      ) : !dashboard ? (
        <div className="text-body text-kore-mid py-2xl text-center">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-xl">
            <KPITile
              icon={FileText}
              label="Gesamt"
              value={dashboard.total}
              color="text-kore-ink"
            />
            <KPITile
              icon={Clock}
              label="Eingereicht"
              value={dashboard.submitted}
              color="text-blue-600"
            />
            <KPITile
              icon={Check}
              label="Bestaetigt"
              value={dashboard.acknowledged}
              color="text-emerald-600"
            />
            <KPITile
              icon={AlertTriangle}
              label="Offen"
              value={dashboard.draft}
              color="text-amber-600"
            />
            <KPITile
              icon={TrendingUp}
              label="Durchschn. Bestaetigungszeit"
              value={formatMinutes(dashboard.avgAckTimeMinutes || 0)}
              color="text-kore-brass"
            />
          </div>

          {/* Compliance bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
            {/* Overall compliance */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-body font-medium text-kore-ink mb-md">
                Bestaetigungs-Quote
              </h3>
              <div className="flex items-end gap-md">
                <span className="font-display text-h1 text-kore-ink">
                  {dashboard.complianceRate}%
                </span>
                <span className="text-small text-kore-mid mb-xs">
                  {dashboard.acknowledged} von {dashboard.total} bestaetigt
                </span>
              </div>
              <div className="mt-md h-3 bg-kore-bg rounded-sm overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${dashboard.complianceRate}%` }}
                />
              </div>
            </div>

            {/* Fast ack rate */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="font-display text-body font-medium text-kore-ink mb-md">
                Schnelle Bestaetigungen (innerhalb 2 Std.)
              </h3>
              <div className="flex items-end gap-md">
                <span className="font-display text-h1 text-kore-ink">
                  {dashboard.fastAckRate}%
                </span>
                <span className="text-small text-kore-mid mb-xs">
                  innerhalb von 2 Stunden bestaetigt
                </span>
              </div>
              <div className="mt-md h-3 bg-kore-bg rounded-sm overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${dashboard.fastAckRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Unacknowledged list */}
          <div className="bg-kore-white border border-kore-border p-lg">
            <h3 className="font-display text-body font-medium text-kore-ink mb-md flex items-center gap-sm">
              <AlertTriangle size={16} className="text-amber-500" />
              Unbestaetigte Uebergaben ({dashboard.unacknowledged?.length ?? 0})
            </h3>

            {!dashboard.unacknowledged?.length ? (
              <p className="text-body text-kore-mid text-center py-lg">
                Alle Uebergaben wurden bestaetigt.
              </p>
            ) : (
              <div className="space-y-sm">
                {dashboard.unacknowledged.map((h: any) => (
                  <Link
                    key={h.id}
                    to={`/tools/handover/${h.id}`}
                    className="flex items-center justify-between p-md border border-kore-border hover:border-kore-brass transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-sm">
                        <span className="font-medium text-kore-ink text-small">
                          {new Date(h.shiftDate).toLocaleDateString('de-DE', {
                            weekday: 'short',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                        {h.shiftType && (
                          <span className="text-small text-kore-brass">
                            {SHIFT_LABELS[h.shiftType] ?? h.shiftType}
                          </span>
                        )}
                        {h.store && (
                          <span className="text-small text-kore-mid">{h.store.name}</span>
                        )}
                      </div>
                      <div className="text-small text-kore-mid mt-xs">
                        {h.fromUser?.name ?? 'Unbekannt'}{' '}
                        <ChevronRight size={12} className="inline" />{' '}
                        {h.toUser?.name ?? 'Nicht zugewiesen'}
                      </div>
                    </div>
                    <div className="flex items-center gap-sm shrink-0">
                      <span className="text-small text-kore-mid">
                        {timeSince(h.createdAt)}
                      </span>
                      <span className={`px-sm py-xs text-small ${STATUS_COLORS['SUBMITTED']}`}>
                        Eingereicht
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
  icon: typeof FileText;
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

function timeSince(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.floor(diffHours / 24);
  return `vor ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
}
