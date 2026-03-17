import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { useFloorStores, useFloorDashboard } from '../../../hooks/useFloor';

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');
  const [days, setDays] = useState(7);
  const { data: stores } = useFloorStores();
  const { data: dashboard, isLoading } = useFloorDashboard(storeId || undefined, days);

  const live = dashboard?.live;
  const peakHours = dashboard?.peakHours ?? [];
  const dailyTrend = dashboard?.dailyTrend ?? [];
  const zoneUtilization = dashboard?.zoneUtilization ?? [];

  // Max-Werte fuer Balkenberechnung
  const maxPeakCustomers = Math.max(1, ...peakHours.map((p: any) => p.avgCustomers));
  const maxDailyCustomers = Math.max(1, ...dailyTrend.map((d: any) => d.avgCustomers));

  return (
    <div className="p-xl max-w-6xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/live-floor" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Live-Statistik, Tagesrueckblick und Trend-Analyse</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-md mb-xl items-center">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white min-w-[200px]"
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value={1}>Heute</option>
          <option value={7}>Letzte 7 Tage</option>
          <option value={14}>Letzte 14 Tage</option>
          <option value={30}>Letzte 30 Tage</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Dashboard...</div>
      ) : !dashboard ? (
        <div className="text-body text-kore-mid">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* Live-KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-lg mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm text-kore-mid mb-sm">
                <Users size={16} />
                <span className="text-caption uppercase tracking-widest">MA aktiv</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{live?.totalStaff ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm text-kore-mid mb-sm">
                <TrendingUp size={16} />
                <span className="text-caption uppercase tracking-widest">Kunden aktuell</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{live?.totalCustomers ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm text-kore-mid mb-sm">
                <BarChart3 size={16} />
                <span className="text-caption uppercase tracking-widest">Zonen aktiv</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">{live?.activeZones ?? 0} <span className="text-h3 text-kore-faint">/ {live?.totalZones ?? 0}</span></div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <div className="flex items-center gap-sm text-kore-mid mb-sm">
                <Clock size={16} />
                <span className="text-caption uppercase tracking-widest">Kunden/MA Ratio</span>
              </div>
              <div className="font-display text-h1 text-kore-ink">
                {live && live.totalStaff > 0 ? (live.totalCustomers / live.totalStaff).toFixed(1) : '0'}
              </div>
            </div>
          </div>

          {/* Peak Hours */}
          {peakHours.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Stosstunden-Analyse</h2>
              <div className="space-y-sm">
                {peakHours.slice(0, 12).map((p: any) => (
                  <div key={p.hour} className="flex items-center gap-md">
                    <span className="text-small text-kore-ink w-16 font-medium">{String(p.hour).padStart(2, '0')}:00</span>
                    <div className="flex-1 flex gap-sm items-center">
                      <div className="flex-1 bg-kore-bg h-5 relative">
                        <div
                          className="bg-kore-ink h-full transition-all"
                          style={{ width: `${(p.avgCustomers / maxPeakCustomers) * 100}%` }}
                        />
                        <span className="absolute inset-y-0 left-2 flex items-center text-small text-kore-white mix-blend-difference">
                          {p.avgCustomers} Kunden
                        </span>
                      </div>
                    </div>
                    <span className="text-small text-kore-mid w-20 text-right">{p.avgStaff} MA</span>
                    <span className="text-small text-kore-faint w-16 text-right">
                      {p.avgStaff > 0 ? (p.avgCustomers / p.avgStaff).toFixed(1) : '-'} Ratio
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tagestrend */}
          {dailyTrend.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Tagestrend</h2>
              <div className="space-y-sm">
                {dailyTrend.map((d: any) => {
                  const dateObj = new Date(d.date + 'T00:00:00');
                  const label = dateObj.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
                  return (
                    <div key={d.date} className="flex items-center gap-md">
                      <span className="text-small text-kore-ink w-24">{label}</span>
                      <div className="flex-1 bg-kore-bg h-5 relative">
                        <div
                          className="bg-kore-brass h-full transition-all"
                          style={{ width: `${(d.avgCustomers / maxDailyCustomers) * 100}%` }}
                        />
                        <span className="absolute inset-y-0 left-2 flex items-center text-small text-kore-white mix-blend-difference">
                          {d.avgCustomers} Kunden
                        </span>
                      </div>
                      <span className="text-small text-kore-mid w-20 text-right">{d.avgStaff} MA</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Zonenauslastung */}
          {zoneUtilization.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Zonenauslastung</h2>
              <div className="space-y-md">
                {zoneUtilization.map((z: any) => (
                  <div key={z.zoneId} className="flex items-center gap-md">
                    <span className="text-small text-kore-ink w-32 font-medium truncate">{z.zoneName}</span>
                    <div className="flex-1 bg-kore-bg h-4 relative">
                      <div
                        className={`h-full transition-all ${z.utilization > 80 ? 'bg-emerald-500' : z.utilization > 40 ? 'bg-kore-brass' : 'bg-red-400'}`}
                        style={{ width: `${z.utilization}%` }}
                      />
                    </div>
                    <span className="text-small text-kore-mid w-16 text-right">{z.utilization}%</span>
                    <span className="text-small text-kore-faint w-24 text-right">
                      {z.staffCount}/{z.maxStaff} MA | {z.customerCount} K
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {peakHours.length === 0 && dailyTrend.length === 0 && (
            <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
              <BarChart3 size={48} className="text-kore-faint mb-lg" />
              <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine historischen Daten</h2>
              <p className="text-body text-kore-mid max-w-md">
                Sobald Kundenfrequenzen erfasst werden, erscheinen hier Stosstunden-Analysen und Tagestrends.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
