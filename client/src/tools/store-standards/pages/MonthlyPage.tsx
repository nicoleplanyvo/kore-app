import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, BarChart3, Scale } from 'lucide-react';
import { calcSbBudget, calcAssociateBlendedRate, calcMonthlyDistribution, MONTH_NAMES } from '../../../hooks/useStoreStandards';
import { useBudgetStore } from '../../../stores/budgetStore';

export function MonthlyPage() {
  const { state, setMonthlyWeight, distributeEvenly } = useBudgetStore();
  const sbBudget = calcSbBudget(state.revenue, state.sbRatePct);
  const assocRate = calcAssociateBlendedRate(state.associateLevels, state.settings);
  const monthly = calcMonthlyDistribution(state.revenue, state.sbRatePct, state.monthlyWeights, state.settings.weeksPerYear, assocRate.fullCost);

  const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const fmtCur = (v: number) => `${state.settings.currency} ${fmt(v)}`;
  const avgWeight = 100 / 12;
  const maxBudget = Math.max(...monthly.map((m) => m.sbBudget), 1);
  const totalWeight = state.monthlyWeights.reduce((s, w) => s + w, 0);

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-lg">
        <ArrowLeft size={14} /> Zurueck zur Uebersicht
      </Link>
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Calendar size={24} /> Monatsverteilung</h1>
          <p className="text-body text-kore-mid mt-xs">Gewichtung der 12 Monate fuer Budget-Verteilung.</p>
        </div>
        <button onClick={distributeEvenly} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
          <Scale size={16} /> Gleichmaessig verteilen
        </button>
      </div>

      {/* Weight Total Warning */}
      {Math.abs(totalWeight - 100) > 0.5 && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-md mb-lg text-small">
          Summe der Gewichte: {totalWeight.toFixed(2)}% (Ziel: 100%)
        </div>
      )}

      {/* Bar Chart */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><BarChart3 size={18} /> Visualisierung</h2>
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="flex items-end gap-xs h-40">
          {monthly.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-xs">
              <div className="w-full rounded-t transition-all" style={{ height: `${(m.sbBudget / maxBudget) * 100}%`, backgroundColor: '#9E8460', minHeight: 4 }} />
              <span className="text-xs text-kore-mid">{MONTH_NAMES[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-kore-ink text-kore-white text-small">
              <th className="text-left px-md py-sm">Monat</th>
              <th className="text-right px-md py-sm">Gewicht %</th>
              <th className="text-right px-md py-sm">Umsatz</th>
              <th className="text-right px-md py-sm">S&B Budget</th>
              <th className="text-right px-md py-sm">Stunden/Woche</th>
              <th className="text-right px-md py-sm">Abweichung</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m, i) => {
              const dev = m.weight - avgWeight;
              return (
                <tr key={i} className="border-b border-kore-border hover:bg-gray-50">
                  <td className="px-md py-sm text-body font-medium text-kore-ink">{MONTH_NAMES[i]}</td>
                  <td className="px-md py-sm text-right">
                    <input type="number" step="0.01" value={state.monthlyWeights[i]} onChange={(e) => setMonthlyWeight(i, Number(e.target.value))} className="w-20 border border-kore-border px-sm py-xs text-small text-right" />
                  </td>
                  <td className="px-md py-sm text-right text-body text-kore-ink">{fmtCur(m.revenue)}</td>
                  <td className="px-md py-sm text-right text-body text-kore-ink">{fmtCur(m.sbBudget)}</td>
                  <td className="px-md py-sm text-right text-body text-kore-ink">{m.weeklyHours.toFixed(1)}</td>
                  <td className="px-md py-sm text-right text-small">
                    <span className={dev > 0 ? 'text-green-600' : dev < 0 ? 'text-red-600' : 'text-kore-mid'}>
                      {dev > 0 ? '+' : ''}{dev.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-medium text-kore-ink border-t-2 border-kore-ink">
              <td className="px-md py-sm">Gesamt</td>
              <td className="px-md py-sm text-right">{totalWeight.toFixed(2)}%</td>
              <td className="px-md py-sm text-right">{fmtCur(state.revenue)}</td>
              <td className="px-md py-sm text-right">{fmtCur(sbBudget)}</td>
              <td className="px-md py-sm text-right">-</td>
              <td className="px-md py-sm text-right">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
