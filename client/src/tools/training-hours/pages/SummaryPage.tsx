import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, BarChart3 } from 'lucide-react';
import { useTrainingStores, useTrainingSummary } from '../../../hooks/useTrainingHours';

const CATEGORY_LABELS: Record<string, string> = { PRODUCT: 'Produkt', SALES: 'Verkauf', SERVICE: 'Service', COMPLIANCE: 'Compliance', ONBOARDING: 'Onboarding', OTHER: 'Sonstiges' };
const CATEGORY_COLORS: Record<string, string> = { PRODUCT: 'bg-blue-500', SALES: 'bg-emerald-500', SERVICE: 'bg-violet-500', COMPLIANCE: 'bg-amber-500', ONBOARDING: 'bg-cyan-500', OTHER: 'bg-kore-mid' };

export function SummaryPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useTrainingStores();
  const { data: summary, isLoading } = useTrainingSummary(storeId || undefined);

  const totalHours = summary ? Math.round(summary.totalMinutes / 60 * 10) / 10 : 0;
  const maxMinutes = summary?.byCategory?.length ? Math.max(...summary.byCategory.map((c: any) => c.minutes)) : 1;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/training-hours" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Zusammenfassung</h1>
          <p className="text-body text-kore-mid mt-xs">Training Hours Auswertung</p>
        </div>
      </div>

      <div className="mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !summary ? (
        <div className="text-body text-kore-mid">Keine Daten verfügbar.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-lg mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="text-small text-kore-mid mb-xs">Gesamt Stunden</div>
              <div className="text-h2 font-display text-kore-ink flex items-center gap-sm"><Clock size={20} /> {totalHours}h</div>
              <div className="text-small text-kore-mid mt-xs">{summary.totalMinutes} Minuten</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="text-small text-kore-mid mb-xs">Einträge</div>
              <div className="text-h2 font-display text-kore-ink flex items-center gap-sm"><BarChart3 size={20} /> {summary.totalLogs}</div>
            </div>
          </div>

          <h2 className="font-display text-h3 text-kore-ink mb-md">Verteilung nach Kategorie</h2>
          <div className="space-y-md">
            {(summary.byCategory ?? []).map((cat: any) => (
              <div key={cat.category} className="bg-kore-white border border-kore-border p-md">
                <div className="flex items-center justify-between mb-sm">
                  <span className="font-medium text-kore-ink">{CATEGORY_LABELS[cat.category] ?? cat.category}</span>
                  <div className="flex gap-lg text-small text-kore-mid">
                    <span>{Math.round(cat.minutes / 60 * 10) / 10}h</span>
                    <span>{cat.count} Einträge</span>
                  </div>
                </div>
                <div className="w-full bg-kore-bg rounded-full h-3">
                  <div className={`${CATEGORY_COLORS[cat.category] ?? 'bg-kore-mid'} h-3 rounded-full transition-all`} style={{ width: `${Math.round(cat.minutes / maxMinutes * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
