import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { useFrTrackingStores, useFrTrackingAnalysis } from '../../../hooks/useFrTracking';

export function AnalysisPage() {
  const [storeId, setStoreId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: stores } = useFrTrackingStores();
  const { data: analysis, isLoading } = useFrTrackingAnalysis(storeId || undefined, from || undefined, to || undefined);

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/fr-tracking" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurueck
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">FR Analyse</h1>
      <p className="text-body text-kore-mid mb-2xl">Conversion-Trends, Peak-Hours und detaillierte Auswertungen</p>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Analyse...</div>
      ) : !analysis ? (
        <div className="text-body text-kore-mid">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Footfall</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(analysis.summary.totalFootfall).toLocaleString('de-DE')}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Transaktionen</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(analysis.summary.totalTransactions).toLocaleString('de-DE')}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Conversion</span>
              <div className={`font-display text-h2 mt-sm ${analysis.summary.avgConversion >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {analysis.summary.avgConversion.toFixed(1)}%
              </div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Tage</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{analysis.summary.dayCount}</div>
            </div>
          </div>

          {/* Conversion Trend */}
          {(analysis.conversionTrend ?? []).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><TrendingUp size={18} /> Conversion-Trend</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-kore-border">
                      <th className="text-left py-sm text-kore-mid font-medium">Datum</th>
                      <th className="text-right py-sm text-kore-mid font-medium">Footfall</th>
                      <th className="text-right py-sm text-kore-mid font-medium">Transaktionen</th>
                      <th className="text-right py-sm text-kore-mid font-medium">Conversion</th>
                      <th className="text-right py-sm text-kore-mid font-medium">Umsatz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analysis.conversionTrend as any[]).slice(-21).map((d: any) => (
                      <tr key={d.date} className="border-b border-kore-border last:border-0">
                        <td className="py-sm text-kore-ink">{new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                        <td className="py-sm text-right text-kore-ink">{d.footfall}</td>
                        <td className="py-sm text-right text-kore-ink">{d.transactions}</td>
                        <td className={`py-sm text-right font-medium ${d.conversionRate >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>{d.conversionRate.toFixed(1)}%</td>
                        <td className="py-sm text-right text-kore-ink">{Number(d.revenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Peak Hours Heatmap */}
          {(analysis.heatmap ?? []).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Clock size={18} /> Peak-Hours</h2>
              <div className="grid grid-cols-12 gap-xs">
                {(analysis.heatmap as any[]).map((h: any) => {
                  const maxFF = Math.max(...(analysis.heatmap as any[]).map((x: any) => x.avgFootfall), 1);
                  const intensity = h.avgFootfall / maxFF;
                  return (
                    <div key={h.hour} className="text-center">
                      <div
                        className="w-full aspect-square flex items-center justify-center text-caption"
                        style={{ backgroundColor: `rgba(158, 132, 96, ${0.1 + intensity * 0.8})`, color: intensity > 0.5 ? '#fff' : '#1a1a1a' }}
                      >
                        {h.avgFootfall}
                      </div>
                      <div className="text-caption text-kore-faint mt-xs">{h.hour}h</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-lg grid grid-cols-12 gap-xs">
                {(analysis.heatmap as any[]).map((h: any) => (
                  <div key={`conv-${h.hour}`} className="text-center">
                    <span className="text-caption text-kore-mid">{h.avgConversion.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <p className="text-caption text-kore-faint mt-sm">Oben: Ø Footfall, Unten: Ø Conversion-Rate</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
