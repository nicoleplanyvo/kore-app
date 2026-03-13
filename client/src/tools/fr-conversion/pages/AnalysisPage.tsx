import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { useConversionAnalysis } from '../../../hooks/useFrConversion';

export function AnalysisPage() {
  const [filters, setFilters] = useState({ storeId: '', from: '', to: '' });
  const { data: analysis, isLoading } = useConversionAnalysis(filters.storeId || filters.from || filters.to ? filters : undefined);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/fr-conversion" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><BarChart3 size={24} /> Conversion-Analyse</h1>
          <p className="text-body text-kore-mid mt-xs">Detaillierte Analyse der Conversion-Performance.</p>
        </div>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-3 gap-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Store-ID</label>
            <input value={filters.storeId} onChange={e => setFilters({ ...filters, storeId: e.target.value })} placeholder="Optional" className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Von</label>
            <input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Bis</label>
            <input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Analyse...</div>
      ) : !analysis ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Analysedaten vorhanden. Filter anpassen oder Daten erfassen.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
          {[
            { label: 'Ø Conversion', value: `${analysis.avgConversion?.toFixed(1) ?? '—'}%` },
            { label: 'Ø Warenkorb', value: `${analysis.avgBasket?.toFixed(2) ?? '—'} €` },
            { label: 'Gesamt-Footfall', value: analysis.totalFootfall?.toLocaleString('de-DE') ?? '—' },
            { label: 'Gesamt-Revenue', value: `${analysis.totalRevenue?.toLocaleString('de-DE') ?? '—'} €` },
            { label: 'Transaktionen', value: analysis.totalTransactions?.toLocaleString('de-DE') ?? '—' },
            { label: 'Tage', value: analysis.days ?? '—' },
            { label: 'Beste Conversion', value: `${analysis.bestConversion?.toFixed(1) ?? '—'}%` },
            { label: 'Peak-Hour', value: analysis.peakHour ?? '—' },
          ].map((s, i) => (
            <div key={i} className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">{s.label}</span>
              <span className="font-display text-h2 text-kore-ink">{s.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
