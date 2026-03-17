import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, BarChart3, LayoutDashboard, TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import {
  useBudgetStores,
  useBudgetForecast,
  useCreateActual,
} from '../../../hooks/useBudget';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtEur(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function AmpelDot({ ampel }: { ampel: string }) {
  const colors: Record<string, string> = {
    gruen: 'bg-emerald-500',
    gelb: 'bg-amber-500',
    rot: 'bg-red-500',
  };
  return <span className={`inline-block w-3 h-3 rounded-full ${colors[ampel] ?? 'bg-gray-300'}`} />;
}

export function OverviewPage() {
  const { data: stores } = useBudgetStores();
  const [storeId, setStoreId] = useState('');
  const [month, setMonth] = useState(currentMonth());

  // Auto-select first store
  const effectiveStoreId = storeId || (stores && stores.length > 0 ? stores[0].id : '');
  const { data: forecast, isLoading } = useBudgetForecast(effectiveStoreId || undefined, month);

  // Quick-entry form
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const createActual = useCreateActual();

  const handleQuickEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStoreId || !amount) return;
    createActual.mutate(
      { storeId: effectiveStoreId, date: todayStr(), amount: parseFloat(amount), description: desc || undefined },
      { onSuccess: () => { setAmount(''); setDesc(''); } },
    );
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Wallet size={24} /> Umsatzplan-Tracking
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Soll vs Ist mit Hochrechnung und Zielerreichung
          </p>
        </div>
        <div className="flex gap-sm">
          <Link
            to="/tools/budget/detail"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <BarChart3 size={14} /> Detail
          </Link>
          <Link
            to="/tools/budget/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <LayoutDashboard size={14} /> Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-xl">
        <select
          value={effectiveStoreId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          {(stores ?? []).map((s: { id: string; name: string }) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        />
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : !forecast ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Target size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Kein Umsatzplan vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erfassen Sie zuerst ein Soll-Ziel fuer diesen Monat in der Detailansicht.
          </p>
          <Link
            to="/tools/budget/detail"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <BarChart3 size={16} /> Zur Detailansicht
          </Link>
        </div>
      ) : (
        <>
          {/* Alerts */}
          {forecast.alerts && forecast.alerts.length > 0 && (
            <div className="space-y-sm mb-xl">
              {forecast.alerts.map((alert: { type: string; message: string }, i: number) => (
                <div
                  key={i}
                  className={`flex items-center gap-sm p-md border ${
                    alert.type === 'danger'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : alert.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {alert.type === 'danger' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                  <span className="text-small">{alert.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Soll</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{fmtEur(forecast.targetRevenue)}</div>
              {forecast.minTarget > 0 && (
                <span className="text-small text-kore-faint">Min: {fmtEur(forecast.minTarget)}</span>
              )}
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ist</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{fmtEur(forecast.totalActual)}</div>
              <span className="text-small text-kore-faint">{forecast.daysWithData} von {forecast.totalDays} Tagen</span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Hochrechnung</span>
              <div className="font-display text-h2 text-kore-ink mt-sm flex items-center gap-sm">
                <TrendingUp size={18} className="text-kore-mid" />
                {fmtEur(forecast.projection)}
              </div>
              <span className="text-small text-kore-faint">
                {forecast.dailyAvg > 0 ? `${fmtEur(forecast.dailyAvg)}/Tag` : '-'}
              </span>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Zielerreichung</span>
              <div className="font-display text-h2 text-kore-ink mt-sm flex items-center gap-sm">
                <AmpelDot ampel={forecast.ampel} />
                {forecast.achievementPercent}%
              </div>
              <span className="text-small text-kore-faint">
                Prognose: {forecast.projectedAchievement}%
              </span>
            </div>
          </div>

          {/* Progress Bar — Soll vs Ist */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <div className="flex items-center justify-between mb-md">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Fortschritt</span>
              <span className="text-small text-kore-mid">
                Tag {forecast.elapsedDays} / {forecast.totalDays}
              </span>
            </div>
            {/* Target bar */}
            <div className="relative w-full bg-kore-bg h-6 mb-sm">
              {/* Expected progress marker */}
              <div
                className="absolute top-0 h-full border-r-2 border-dashed border-kore-mid z-10"
                style={{ left: `${Math.min(100, (forecast.elapsedDays / forecast.totalDays) * 100)}%` }}
              />
              {/* Actual progress */}
              <div
                className={`h-full transition-all ${
                  forecast.ampel === 'rot' ? 'bg-red-500' : forecast.ampel === 'gelb' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, forecast.achievementPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-small text-kore-mid">
              <span>0</span>
              {forecast.minTarget > 0 && (
                <span className="text-amber-600">Min: {fmtEur(forecast.minTarget)}</span>
              )}
              <span>{fmtEur(forecast.targetRevenue)}</span>
            </div>
          </div>

          {/* Weekly Overview */}
          {forecast.weeklyData && forecast.weeklyData.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Wochen-Ueberblick</h2>
              <div className="space-y-md">
                {forecast.weeklyData.map((w: { week: number; soll: number; ist: number }) => {
                  const pct = w.soll > 0 ? Math.min(100, (w.ist / w.soll) * 100) : 0;
                  return (
                    <div key={w.week} className="flex items-center gap-lg">
                      <span className="text-small text-kore-ink w-16">KW {w.week}</span>
                      <div className="flex-1 bg-kore-bg h-4 relative">
                        <div
                          className={`h-full ${pct >= 95 ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-small text-kore-mid w-28 text-right">
                        {fmtEur(w.ist)} / {fmtEur(w.soll)}
                      </span>
                      <span className="text-small font-medium w-12 text-right">
                        {Math.round(pct)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Entry */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Tagesumsatz erfassen</h2>
            <form onSubmit={handleQuickEntry} className="flex flex-wrap items-end gap-md">
              <div>
                <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Datum</label>
                <input
                  type="date"
                  value={todayStr()}
                  disabled
                  className="border border-kore-border px-md py-sm text-small bg-kore-bg text-kore-mid"
                />
              </div>
              <div>
                <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Umsatz (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  className="border border-kore-border px-md py-sm text-small bg-kore-white w-36"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Beschreibung</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional"
                  className="border border-kore-border px-md py-sm text-small bg-kore-white w-full"
                />
              </div>
              <button
                type="submit"
                disabled={createActual.isPending}
                className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
              >
                {createActual.isPending ? 'Speichern...' : 'Erfassen'}
              </button>
            </form>
            {createActual.isError && (
              <p className="text-small text-red-600 mt-sm">{(createActual.error as Error).message}</p>
            )}
            {createActual.isSuccess && (
              <p className="text-small text-emerald-600 mt-sm">Tagesumsatz gespeichert.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
