import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, Send, Eye, Users, AlertCircle, TrendingUp,
} from 'lucide-react';
import { useTeamPushDashboard } from '../../../hooks/useTeamPush';

type PeriodPreset = 'week' | 'month' | 'quarter' | 'year' | 'custom';

const PERIOD_LABELS: Record<PeriodPreset, string> = {
  week: 'Woche',
  month: 'Monat',
  quarter: 'Quartal',
  year: 'Jahr',
  custom: 'Benutzerdefiniert',
};

function getDateRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  switch (preset) {
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return { from: d.toISOString().slice(0, 10), to };
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().slice(0, 10), to };
    }
    default:
      return { from: '', to: '' };
  }
}

export function DashboardPage() {
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const dateRange = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return getDateRange(preset);
  }, [preset, customFrom, customTo]);

  const filters = useMemo(() => ({
    from: dateRange.from || undefined,
    to: dateRange.to || undefined,
  }), [dateRange]);

  const { data: dashboard, isLoading } = useTeamPushDashboard(filters);
  const kpis = dashboard?.kpis;
  const trends = dashboard?.trends ?? [];
  const topSenders = dashboard?.topSenders ?? [];
  const byPriority = dashboard?.byPriority ?? {};
  const byTarget = dashboard?.byTarget ?? {};

  const maxTrendSent = Math.max(...trends.map(t => t.sent), 1);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/team-push" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Team Push Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">Reichweite, Leseraten und Kommunikationsanalysen.</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-end gap-md mb-xl">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Zeitraum</label>
          <div className="flex gap-xs">
            {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map(p => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={`px-md py-xs text-small border transition-colors ${
                  preset === p
                    ? 'bg-kore-ink text-kore-white border-kore-ink'
                    : 'border-kore-border text-kore-mid hover:text-kore-ink'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        {preset === 'custom' && (
          <>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Von</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="border border-kore-border px-md py-sm text-small"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Bis</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="border border-kore-border px-md py-sm text-small"
              />
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard-Daten...</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md mb-2xl">
            <div className="bg-kore-white border border-kore-border p-md text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <Send size={14} className="text-kore-brass" />
                <span className="text-xs text-kore-mid uppercase">Gesendet</span>
              </div>
              <div className="text-2xl font-bold text-kore-ink">{kpis?.totalMessages ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-md text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <Eye size={14} className="text-emerald-600" />
                <span className="text-xs text-kore-mid uppercase">Gelesen</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{kpis?.totalReads ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-md text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <TrendingUp size={14} className="text-blue-600" />
                <span className="text-xs text-kore-mid uppercase">Leserate</span>
              </div>
              <div className={`text-2xl font-bold ${
                (kpis?.avgReadRate ?? 0) >= 70 ? 'text-emerald-600' :
                (kpis?.avgReadRate ?? 0) >= 40 ? 'text-amber-600' : 'text-red-600'
              }`}>{kpis?.avgReadRate ?? 0}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-md text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <Users size={14} className="text-blue-600" />
                <span className="text-xs text-kore-mid uppercase">Empfaenger</span>
              </div>
              <div className="text-2xl font-bold text-kore-ink">{kpis?.totalUsers ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-md text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <AlertCircle size={14} className="text-red-500" />
                <span className="text-xs text-kore-mid uppercase">Dringend</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{kpis?.urgentCount ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-md text-center">
              <div className="flex items-center justify-center gap-xs mb-sm">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-xs text-kore-mid uppercase">Hoch</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">{kpis?.highCount ?? 0}</div>
            </div>
          </div>

          {/* Trend Chart */}
          {trends.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-lg mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Nachrichten-Trend</h2>
              <div className="flex items-end gap-1 h-40">
                {trends.slice(-30).map((t, i) => {
                  const sentH = Math.max((t.sent / maxTrendSent) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end" title={`${t.date}: ${t.sent} gesendet, ${t.reads} gelesen`}>
                      <span className="text-xs font-bold mb-1 text-kore-brass">
                        {t.sent > 0 ? t.sent : ''}
                      </span>
                      <div className="w-full relative flex-1 flex flex-col justify-end">
                        <div
                          className="w-full rounded-t bg-kore-ink"
                          style={{ height: `${sentH}%` }}
                        />
                        {t.reads > 0 && (
                          <div
                            className="w-full rounded-t bg-emerald-500/30 absolute bottom-0"
                            style={{ height: `${Math.max((t.reads / (maxTrendSent * 5)) * 100, 2)}%` }}
                          />
                        )}
                      </div>
                      {trends.length <= 14 && (
                        <div className="text-xs text-kore-mid mt-1">{t.date.slice(5)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-lg mt-md text-xs text-kore-mid">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-kore-ink" /> Gesendet</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500/30" /> Gelesen</span>
              </div>
            </div>
          )}

          {/* Two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl mb-xl">
            {/* Priority Breakdown */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Nach Prioritaet</h2>
              <div className="space-y-md">
                {[
                  { key: 'NORMAL', label: 'Normal', color: 'bg-kore-ink' },
                  { key: 'HIGH', label: 'Hoch', color: 'bg-amber-500' },
                  { key: 'URGENT', label: 'Dringend', color: 'bg-red-500' },
                ].map(p => {
                  const count = byPriority[p.key] ?? 0;
                  const total = kpis?.totalMessages ?? 1;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={p.key} className="flex items-center gap-md">
                      <span className="w-20 text-small text-kore-mid">{p.label}</span>
                      <div className="flex-1 h-4 bg-kore-bg rounded overflow-hidden">
                        <div className={`h-full ${p.color} rounded`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-14 text-small text-right font-medium text-kore-ink">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Breakdown */}
            <div className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Nach Zielgruppe</h2>
              <div className="space-y-md">
                {[
                  { key: 'ALL', label: 'Alle', color: 'bg-blue-500' },
                  { key: 'STORE', label: 'Store', color: 'bg-purple-500' },
                  { key: 'ROLE', label: 'Rolle', color: 'bg-kore-brass' },
                ].map(t => {
                  const count = byTarget[t.key] ?? 0;
                  const total = kpis?.totalMessages ?? 1;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={t.key} className="flex items-center gap-md">
                      <span className="w-20 text-small text-kore-mid">{t.label}</span>
                      <div className="flex-1 h-4 bg-kore-bg rounded overflow-hidden">
                        <div className={`h-full ${t.color} rounded`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-14 text-small text-right font-medium text-kore-ink">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Senders */}
          {topSenders.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-lg mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
                <Users size={18} /> Aktivste Absender
              </h2>
              <div className="space-y-sm">
                {topSenders.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-md p-md bg-kore-bg border border-kore-border">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-kore-bg text-kore-mid'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-kore-ink text-small">{s.name}</div>
                      <div className="text-xs text-kore-mid">
                        <strong>{s.count}</strong> Nachrichten
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-kore-brass">{s.totalReads}</div>
                      <div className="text-xs text-kore-mid">Lesungen</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Read Message */}
          {dashboard?.bestRead && (
            <div className="bg-kore-white border border-kore-border p-lg">
              <h2 className="font-display text-h3 text-kore-ink mb-md">Meistgelesene Nachricht</h2>
              <Link to={`/tools/team-push/messages/${dashboard.bestRead.id}`} className="block hover:opacity-80 transition-opacity">
                <div className="text-body text-kore-ink font-medium">{dashboard.bestRead.title}</div>
                <div className="flex gap-md text-small text-kore-mid mt-sm">
                  <span className="text-emerald-600 font-medium">{dashboard.bestRead.readRate}% Leserate</span>
                  <span>{dashboard.bestRead.reads} Lesungen</span>
                </div>
              </Link>
            </div>
          )}

          {!kpis?.totalMessages && (
            <div className="bg-kore-white border border-kore-border p-2xl text-center text-kore-mid">
              Keine Daten fuer diesen Zeitraum.
            </div>
          )}
        </>
      )}
    </div>
  );
}
