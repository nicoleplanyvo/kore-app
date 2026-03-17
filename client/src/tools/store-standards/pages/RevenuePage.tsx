import { Link } from 'react-router-dom';
import { ArrowLeft, DollarSign, Percent } from 'lucide-react';
import { calcSbBudget } from '../../../hooks/useStoreStandards';
import { useBudgetStore } from '../../../stores/budgetStore';

export function RevenuePage() {
  const { state, setRevenue, setSbRatePct } = useBudgetStore();
  const sbBudget = calcSbBudget(state.revenue, state.sbRatePct);
  const monthlyBudget = sbBudget / 12;
  const weeklyBudget = sbBudget / state.settings.weeksPerYear;
  const dailyBudget = weeklyBudget / 6;

  const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const fmtCur = (v: number) => `${state.settings.currency} ${fmt(v)}`;

  const utilPct = state.revenue > 0 ? (state.sbRatePct) : 0;

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-lg">
        <ArrowLeft size={14} /> Zurueck zur Uebersicht
      </Link>
      <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm mb-xs">
        <DollarSign size={24} /> Umsatz & Budget
      </h1>
      <p className="text-body text-kore-mid mb-2xl">Jahresumsatz und S&B-Zielrate definieren.</p>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="block text-small text-kore-mid mb-xs">Jahresumsatz ({state.settings.currency})</label>
          <input type="number" value={state.revenue || ''} onChange={(e) => setRevenue(Number(e.target.value))} placeholder="z.B. 3000000" className="w-full border border-kore-border px-md py-sm text-body text-right" />
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="block text-small text-kore-mid mb-xs">S&B-Zielrate (%)</label>
          <input type="number" step="0.1" value={state.sbRatePct || ''} onChange={(e) => setSbRatePct(Number(e.target.value))} placeholder="z.B. 18" className="w-full border border-kore-border px-md py-sm text-body text-right" />
        </div>
      </div>

      {/* Calculated KPIs */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Berechnete Budgets</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="text-small opacity-75 mb-xs">S&B Budget (Jahr)</div>
          <p className="font-display text-h2">{fmtCur(sbBudget)}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Monatsbudget</div>
          <p className="font-display text-h3 text-kore-ink">{fmtCur(monthlyBudget)}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Wochenbudget</div>
          <p className="font-display text-h3 text-kore-ink">{fmtCur(weeklyBudget)}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="text-small text-kore-mid mb-xs">Tagesbudget</div>
          <p className="font-display text-h3 text-kore-ink">{fmtCur(dailyBudget)}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Percent size={18} /> Budget-Auslastung</h2>
      <div className="bg-kore-white border border-kore-border p-lg">
        <div className="flex justify-between text-small text-kore-mid mb-xs">
          <span>S&B-Rate</span>
          <span>{utilPct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded">
          <div className="h-3 rounded transition-all" style={{ width: `${Math.min(utilPct * 3, 100)}%`, backgroundColor: utilPct > 22 ? '#dc2626' : '#9E8460' }} />
        </div>
        <p className="text-small text-kore-mid mt-xs">Branchenstandard: 15-22%</p>
      </div>
    </div>
  );
}
