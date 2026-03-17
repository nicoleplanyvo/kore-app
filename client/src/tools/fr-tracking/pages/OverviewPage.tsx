import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, Activity } from 'lucide-react';
import { useFrTrackingStores, useFrTrackingSessions, useFrTrackingDashboard } from '../../../hooks/useFrTracking';

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);
  const { data: stores } = useFrTrackingStores();
  const { data: dashboard } = useFrTrackingDashboard();
  const { data: sessionsResult, isLoading } = useFrTrackingSessions(page, storeId || undefined);
  const sessions = sessionsResult?.data ?? [];
  const total = sessionsResult?.total ?? 0;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">FR Tracking</h1>
          <p className="text-body text-kore-mid mt-xs">Fitting-Room-Analyse: Conversion, Trends und Mitarbeiter-Performance</p>
        </div>
        <div className="flex gap-md">
          <Link to="analysis" className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            <TrendingUp size={16} /> Analyse
          </Link>
          <Link to="staff" className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            <Users size={16} /> Mitarbeiter
          </Link>
          <Link to="dashboard" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <BarChart3 size={16} /> Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Tiles */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Sessions heute</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.today?.footfall ?? 0}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Conversion heute</span>
            <div className={`font-display text-h1 mt-sm ${(dashboard.today?.conversion ?? 0) >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {(dashboard.today?.conversion ?? 0).toFixed(1)}%
            </div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest flex items-center gap-xs"><Activity size={14} /> Ø Conversion (30T)</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{(dashboard.period?.avgConversion ?? 0).toFixed(1)}%</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Umsatz (30T)</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{Number(dashboard.period?.totalRevenue ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      )}

      {/* Filters & Sessions Table */}
      <div className="flex gap-md mb-xl flex-wrap">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span className="text-small text-kore-mid self-center">{total} Sessions</span>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : sessions.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <BarChart3 size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Sessions</h2>
          <p className="text-body text-kore-mid max-w-md">Sobald Daten erfasst werden, erscheinen hier die Fitting-Room-Sessions.</p>
        </div>
      ) : (
        <>
          <div className="bg-kore-white border border-kore-border overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="text-left px-lg py-md text-kore-mid font-medium">Datum</th>
                  <th className="text-left px-lg py-md text-kore-mid font-medium">Store</th>
                  <th className="text-right px-lg py-md text-kore-mid font-medium">Stunde</th>
                  <th className="text-right px-lg py-md text-kore-mid font-medium">Footfall</th>
                  <th className="text-right px-lg py-md text-kore-mid font-medium">Transaktionen</th>
                  <th className="text-right px-lg py-md text-kore-mid font-medium">Conversion</th>
                  <th className="text-right px-lg py-md text-kore-mid font-medium">Umsatz</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr key={s.id} className="border-b border-kore-border last:border-0 hover:bg-kore-bg transition-colors">
                    <td className="px-lg py-md text-kore-ink">{new Date(s.date).toLocaleDateString('de-DE')}</td>
                    <td className="px-lg py-md text-kore-ink">{s.store?.name || '-'}</td>
                    <td className="px-lg py-md text-right text-kore-mid">{s.hour !== null ? `${s.hour}:00` : 'Tag'}</td>
                    <td className="px-lg py-md text-right text-kore-ink">{s.footfall}</td>
                    <td className="px-lg py-md text-right text-kore-ink">{s.transactions}</td>
                    <td className={`px-lg py-md text-right font-medium ${(s.conversionRate ?? 0) >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {(s.conversionRate ?? 0).toFixed(1)}%
                    </td>
                    <td className="px-lg py-md text-right text-kore-ink">{Number(s.revenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 30 && (
            <div className="flex justify-center gap-md mt-xl">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-md py-sm border border-kore-border text-small disabled:opacity-40 hover:bg-kore-bg transition-colors">Zurueck</button>
              <span className="text-small text-kore-mid self-center">Seite {page} von {Math.ceil(total / 30)}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * 30 >= total} className="px-md py-sm border border-kore-border text-small disabled:opacity-40 hover:bg-kore-bg transition-colors">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
