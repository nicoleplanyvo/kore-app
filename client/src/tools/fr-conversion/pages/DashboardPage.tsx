import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { useFRStores, useFRDashboard } from '../../../hooks/useFrConversion';

const PERIODS = [
  { key: 'today', label: 'Heute' },
  { key: 'yesterday', label: 'Gestern' },
  { key: 'week', label: 'Diese Woche' },
  { key: 'lastweek', label: 'Letzte Woche' },
  { key: 'month', label: 'Dieser Monat' },
  { key: 'lastmonth', label: 'Letzter Monat' },
  { key: 'year', label: 'Dieses Jahr' },
];

function getDateRange(period: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  switch (period) {
    case 'today': return { from: fmt(today), to: fmt(today) };
    case 'yesterday': { const d = new Date(today); d.setDate(d.getDate() - 1); return { from: fmt(d), to: fmt(d) }; }
    case 'week': { const d = new Date(today); d.setDate(today.getDate() - today.getDay() + 1); return { from: fmt(d), to: fmt(today) }; }
    case 'lastweek': { const end = new Date(today); end.setDate(today.getDate() - today.getDay()); const start = new Date(end); start.setDate(end.getDate() - 6); return { from: fmt(start), to: fmt(end) }; }
    case 'month': return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) };
    case 'lastmonth': return { from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)) };
    case 'year': return { from: fmt(new Date(today.getFullYear(), 0, 1)), to: fmt(today) };
    default: return { from: fmt(today), to: fmt(today) };
  }
}

export function DashboardPage() {
  const { data: stores } = useFRStores();
  const [storeId, setStoreId] = useState('');
  const [period, setPeriod] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => { if (stores?.length && !storeId) setStoreId(stores[0].id); }, [stores, storeId]);

  const dateRange = period === 'custom' ? { from: customFrom, to: customTo } : getDateRange(period);
  const { data: dashboard } = useFRDashboard({ storeId, ...dateRange });

  const kpis = dashboard?.kpis;
  const trends = dashboard?.trends || [];
  const staffPerf = dashboard?.staffPerformance || [];
  const peakHours = dashboard?.peakHours || [];

  const maxTrendSessions = Math.max(...(trends.map((t: any) => t.sessions) || [1]), 1);
  const teamAvgConv = staffPerf.length > 0 ? Math.round(staffPerf.reduce((s: number, x: any) => s + x.avgConversion, 0) / staffPerf.length) : 0;

  const exportCSV = () => {
    if (!dashboard?.sessions?.length) return;
    let csv = 'Datum,Uhrzeit,Kabine,Mitarbeiter,Teile rein,Zurueck,Gekauft,Schwund,Conversion,Dauer (Min)\n';
    dashboard.sessions.forEach((s: any) => {
      const d = new Date(s.checkInAt);
      const dur = s.checkOutAt ? Math.round((new Date(s.checkOutAt).getTime() - d.getTime()) / 60000) : 0;
      csv += `${d.toLocaleDateString('de-DE')},${d.toLocaleTimeString('de-DE')},${s.room?.number || ''},${s.staff?.name || ''},${s.itemsIn},${s.itemsReturned ?? ''},${s.itemsPurchased ?? ''},${s.itemsShrinkage ?? ''},${s.conversionRate ?? ''}%,${dur}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `fr-report-${dateRange.from}.csv`;
    a.click();
  };

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/fr-conversion" className="text-kore-mid hover:text-kore-ink"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><BarChart3 size={24} /> Reports</h1>
        </div>
        {stores && stores.length > 1 && (
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small">
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <button onClick={exportCSV} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
          <Download size={14} /> CSV
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-sm mb-md">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-md py-sm text-small border ${period === p.key ? 'bg-kore-ink text-kore-white border-kore-ink' : 'border-kore-border text-kore-mid hover:text-kore-ink'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-sm mb-lg">
        <input type="date" value={dateRange.from} onChange={e => { setPeriod('custom'); setCustomFrom(e.target.value); }} className="border border-kore-border px-md py-sm text-small" />
        <span className="text-kore-mid">–</span>
        <input type="date" value={dateRange.to} onChange={e => { setPeriod('custom'); setCustomTo(e.target.value); }} className="border border-kore-border px-md py-sm text-small" />
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-md mb-xl">
          {[
            { label: 'Sessions', value: kpis.total, color: 'text-blue-600' },
            { label: 'Conversion', value: kpis.avgConversion + '%', color: 'text-purple-600' },
            { label: 'Dauer', value: kpis.avgDuration + 'm', color: 'text-green-600' },
            { label: 'Verkauft', value: kpis.totalSold, color: 'text-amber-600' },
            { label: 'Verkauft/Sess', value: kpis.avgSoldPerSession, color: 'text-kore-brass' },
            { label: 'Kein Kauf', value: kpis.noSales, color: 'text-red-500' },
            { label: 'Schwund', value: kpis.totalShrinkage, color: 'text-red-600' },
          ].map((k, i) => (
            <div key={i} className="bg-kore-white border border-kore-border p-md text-center">
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-kore-mid uppercase mt-1">{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Conversion Trend */}
      {trends.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Conversion Trend</h2>
          <div className="flex items-end gap-1 h-40">
            {trends.slice(-14).map((t: any, i: number) => {
              const convH = Math.max((t.avgConversion / 100) * 100, 4);
              const sessH = Math.max((t.sessions / maxTrendSessions) * 80, 4);
              const isLast = i === Math.min(trends.length, 14) - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end" title={`${t.date}: ${t.avgConversion}% (${t.sessions} Sess.)`}>
                  <span className="text-xs font-bold mb-1" style={{ color: isLast ? '#16a34a' : '#7c3aed' }}>
                    {t.avgConversion > 0 ? t.avgConversion + '%' : ''}
                  </span>
                  <div className="w-full relative flex-1 flex flex-col justify-end">
                    <div className="w-full rounded-t" style={{ height: `${convH}%`, background: isLast ? '#16a34a' : '#7c3aed' }} />
                    <div className="w-full rounded-t opacity-20 absolute bottom-0" style={{ height: `${sessH}%`, background: '#3b82f6' }} />
                  </div>
                  <div className="text-xs text-kore-mid mt-1">{t.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-lg mt-md text-xs text-kore-mid">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: '#7c3aed' }} /> Conversion %</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200" /> Sessions</span>
          </div>
        </div>
      )}

      {/* Peak Hours */}
      {peakHours.some((c: number) => c > 0) && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="text-small font-bold text-kore-mid uppercase mb-md">Peak Times</h2>
          <div className="flex items-end gap-1 h-28">
            {peakHours.slice(9, 23).map((count: number, i: number) => {
              const max = Math.max(...peakHours.slice(9, 23), 1);
              const h = Math.max((count / max) * 100, 4);
              const isPeak = count === max && count > 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className={`w-full rounded-t ${isPeak ? 'bg-green-500' : count > max * 0.6 ? 'bg-blue-500' : 'bg-blue-200'}`} style={{ height: `${h}%` }} />
                  <div className="text-xs text-kore-mid mt-1">{(i + 9).toString().padStart(2, '0')}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Performance */}
      {staffPerf.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-lg">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Mitarbeiter Performance</h2>
          <div className="space-y-sm">
            {staffPerf.map((st: any, i: number) => {
              const crClass = st.avgConversion >= 50 ? 'text-green-600' : st.avgConversion >= 35 ? 'text-blue-600' : st.avgConversion >= 20 ? 'text-amber-600' : 'text-red-600';
              const barColor = st.avgConversion >= 50 ? '#16a34a' : st.avgConversion >= 35 ? '#3b82f6' : st.avgConversion >= 20 ? '#f59e0b' : '#ef4444';
              const diff = st.avgConversion - teamAvgConv;
              return (
                <div key={st.id} className="flex items-center gap-md p-md bg-kore-bg border border-kore-border">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-kore-bg text-kore-mid'}`}>
                    {i + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                    {st.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-kore-ink text-small">{st.name}</div>
                    <div className="flex gap-md text-xs text-kore-mid">
                      <span><strong>{st.sessions}</strong> Sess.</span>
                      <span><strong>{st.totalPurchased}</strong> verkauft</span>
                      {st.totalShrinkage > 0 && <span className="text-red-500"><strong>{st.totalShrinkage}</strong> Schwund</span>}
                    </div>
                    <div className="h-2 bg-kore-bg rounded mt-1 relative">
                      <div className="h-full rounded" style={{ width: `${st.avgConversion}%`, background: barColor }} />
                      <div className="absolute top-0 w-0.5 h-full bg-kore-mid" style={{ left: `${teamAvgConv}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${crClass}`}>{st.avgConversion}%</div>
                    <div className={`text-xs font-bold flex items-center gap-1 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {diff >= 0 ? '+' : ''}{diff}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center text-xs text-kore-mid mt-md pt-md border-t border-kore-border">
            Team-Durchschnitt: {teamAvgConv}%
          </div>
        </div>
      )}

      {!kpis && (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-kore-mid">
          Keine Daten für diesen Zeitraum.
        </div>
      )}
    </div>
  );
}
