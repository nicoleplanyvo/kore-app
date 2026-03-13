import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, Plus, Save } from 'lucide-react';
import { useConversionGoals, useUpsertConversionGoal, useConversionTrends } from '../../../hooks/useFrConversion';

export function OverviewPage() {
  const { data: goals, isLoading: goalsLoading } = useConversionGoals();
  const { data: trends } = useConversionTrends();
  const upsert = useUpsertConversionGoal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ storeId: '', period: '', targetConversion: '', targetAvgBasket: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(
      { ...form, targetConversion: Number(form.targetConversion), targetAvgBasket: Number(form.targetAvgBasket) },
      { onSuccess: () => { setShowForm(false); setForm({ storeId: '', period: '', targetConversion: '', targetAvgBasket: '' }); } },
    );
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><TrendingUp size={24} /> FR Conversion</h1>
          <p className="text-body text-kore-mid mt-xs">Conversion-Ziele verwalten und Performance analysieren.</p>
        </div>
        <div className="flex gap-sm">
          <Link to="/tools/fr-conversion/analysis" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Analyse</Link>
          <Link to="/tools/fr-conversion/comparison" className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Vergleich</Link>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={16} /> Ziel setzen
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Store-ID</label>
              <input value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Periode (z.B. 2026-Q1)</label>
              <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Ziel-Conversion (%)</label>
              <input type="number" step="0.1" value={form.targetConversion} onChange={e => setForm({ ...form, targetConversion: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Ziel Ø Warenkorb (€)</label>
              <input type="number" step="0.01" value={form.targetAvgBasket} onChange={e => setForm({ ...form, targetAvgBasket: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <button type="submit" disabled={upsert.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Save size={14} /> {upsert.isPending ? 'Speichern...' : 'Ziel speichern'}
          </button>
        </form>
      )}

      {/* Conversion Goals */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Conversion-Ziele</h2>
      {goalsLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !goals?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid mb-xl">Noch keine Conversion-Ziele definiert.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
          {goals.map((g: any) => (
            <div key={g.id} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-sm mb-sm">
                <Target size={16} className="text-kore-mid" />
                <span className="font-medium text-kore-ink">{g.store?.name ?? g.storeId}</span>
                <span className="text-small text-kore-mid">· {g.period}</span>
              </div>
              <div className="grid grid-cols-2 gap-md text-small">
                <div>
                  <span className="text-kore-mid">Ziel-Conversion</span>
                  <p className="text-kore-ink font-medium">{g.targetConversion}%</p>
                </div>
                <div>
                  <span className="text-kore-mid">Ziel Ø Warenkorb</span>
                  <p className="text-kore-ink font-medium">{g.targetAvgBasket?.toFixed(2)} €</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trends */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Trends</h2>
      {!trends?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Trend-Daten vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {trends.map((t: any, i: number) => (
            <div key={i} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
              <div>
                <span className="font-medium text-kore-ink">KW {t.week ?? i + 1}</span>
                <span className="text-small text-kore-mid ml-sm">{t.storeName ?? ''}</span>
              </div>
              <div className="flex gap-lg text-small">
                <div className="text-center">
                  <span className="text-kore-mid block">Conversion</span>
                  <span className="text-kore-ink font-medium">{t.conversionRate?.toFixed(1) ?? '—'}%</span>
                </div>
                <div className="text-center">
                  <span className="text-kore-mid block">Ø Warenkorb</span>
                  <span className="text-kore-ink font-medium">{t.avgBasket?.toFixed(2) ?? '—'} €</span>
                </div>
                <div className="text-center">
                  <span className="text-kore-mid block">Footfall</span>
                  <span className="text-kore-ink font-medium">{t.totalFootfall ?? '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
