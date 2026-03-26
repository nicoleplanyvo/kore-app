import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Award } from 'lucide-react';
import { useFrTrackingStores, useFrTrackingStaffPerformance } from '../../../hooks/useFrTracking';

export function StaffPage() {
  const [storeId, setStoreId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data: stores } = useFrTrackingStores();
  const { data: result, isLoading } = useFrTrackingStaffPerformance(storeId || undefined, from || undefined, to || undefined);

  const staff = result?.staffPerformance ?? [];
  const teamAvg = result?.teamAvgConversion ?? 0;

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/fr-tracking" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">Mitarbeiter-Performance</h1>
      <p className="text-body text-kore-mid mb-2xl">Conversion-Rate und Sessions pro Mitarbeiter im Vergleich zum Team-Durchschnitt</p>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-kore-border px-md py-sm text-small" />
      </div>

      {/* Team Average */}
      <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-caption text-kore-mid uppercase tracking-widest">Team-Durchschnitt Conversion</span>
            <div className={`font-display text-h1 mt-sm ${teamAvg >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>{teamAvg.toFixed(1)}%</div>
          </div>
          <Users size={36} className="text-kore-faint" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Mitarbeiterdaten...</div>
      ) : staff.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Users size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Daten</h2>
          <p className="text-body text-kore-mid max-w-md">Es liegen noch keine Mitarbeiter-bezogenen Daten vor.</p>
        </div>
      ) : (
        <div className="space-y-md">
          {staff.map((s: any, i: number) => {
            const aboveAvg = s.conversionRate >= teamAvg;
            return (
              <div key={s.staffId} className="bg-kore-white border border-kore-border p-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-lg">
                    <div className={`w-8 h-8 flex items-center justify-center text-caption font-medium ${i === 0 ? 'bg-kore-brass text-kore-white' : 'bg-kore-bg text-kore-mid'}`}>
                      {i + 1}
                    </div>
                    <div>
                      <span className="text-body font-medium text-kore-ink">{s.staffName}</span>
                      <div className="flex gap-lg mt-xs">
                        <span className="text-small text-kore-mid">{s.sessions} Sessions</span>
                        <span className="text-small text-kore-mid">{s.footfall} Besucher</span>
                        <span className="text-small text-kore-mid">{Number(s.revenue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    <div className="text-right">
                      <div className={`font-display text-h2 ${aboveAvg ? 'text-emerald-600' : 'text-amber-600'}`}>{s.conversionRate.toFixed(1)}%</div>
                      <span className="text-caption text-kore-faint">{aboveAvg ? 'über' : 'unter'} Durchschnitt</span>
                    </div>
                    {i === 0 && <Award size={20} className="text-kore-brass" />}
                  </div>
                </div>
                {/* Comparison bar */}
                <div className="mt-md relative h-3 bg-kore-bg">
                  <div className="absolute top-0 left-0 h-full bg-kore-ink" style={{ width: `${Math.min(100, s.conversionRate * 2)}%` }} />
                  <div className="absolute top-0 h-full w-px bg-red-400" style={{ left: `${Math.min(100, teamAvg * 2)}%` }} title={`Team: ${teamAvg.toFixed(1)}%`} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
