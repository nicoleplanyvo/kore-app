import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, DollarSign, Clock, Users, Calendar } from 'lucide-react';
import { calcSbBudget, calcManagementCost, calcTotalManagementCost, calcAssociateBlendedRate, calcAssociateBudget, calcAvailableHoursPerWeek, calcContractTotals, calcMonthlyDistribution, MONTH_NAMES } from '../../../hooks/useStoreStandards';
import { useBudgetStore } from '../../../stores/budgetStore';

export function SummaryPage() {
  const { state } = useBudgetStore();
  const s = state.settings;

  const sbBudget = calcSbBudget(state.revenue, state.sbRatePct);
  const mgmtCost = calcTotalManagementCost(state.managementRoles, s);
  const assocRate = calcAssociateBlendedRate(state.associateLevels, s);
  const assocBudget = calcAssociateBudget(sbBudget, mgmtCost, state.allocation);
  const weeklyHours = calcAvailableHoursPerWeek(assocBudget, assocRate.fullCost, s.weeksPerYear);
  const annualHours = weeklyHours * s.weeksPerYear;
  const ct = calcContractTotals(state.contractTypes);
  const totalAnnualCostAssoc = assocRate.fullCost > 0 ? assocBudget : 0;
  const totalUsed = mgmtCost + state.allocation.support + state.allocation.merit + state.allocation.uniform + Math.max(totalAnnualCostAssoc, 0);
  const overUnder = sbBudget - totalUsed;
  const monthly = calcMonthlyDistribution(state.revenue, state.sbRatePct, state.monthlyWeights, s.weeksPerYear, assocRate.fullCost);
  const productivity = annualHours > 0 ? state.revenue / annualHours : 0;

  const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const cur = s.currency;

  const budgetItems = [
    { label: 'Management', value: mgmtCost, pct: sbBudget > 0 ? (mgmtCost / sbBudget) * 100 : 0 },
    { label: 'Support', value: state.allocation.support, pct: sbBudget > 0 ? (state.allocation.support / sbBudget) * 100 : 0 },
    { label: 'Merit', value: state.allocation.merit, pct: sbBudget > 0 ? (state.allocation.merit / sbBudget) * 100 : 0 },
    { label: 'Uniform', value: state.allocation.uniform, pct: sbBudget > 0 ? (state.allocation.uniform / sbBudget) * 100 : 0 },
    { label: 'Mitarbeiter', value: assocBudget, pct: sbBudget > 0 ? (assocBudget / sbBudget) * 100 : 0 },
  ];

  const handlePrint = () => { window.print(); };

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-lg print:hidden">
        <ArrowLeft size={14} /> Zurueck zur Uebersicht
      </Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <FileText size={24} /> Zusammenfassung
          </h1>
          <p className="text-body text-kore-mid mt-xs">Gesamtuebersicht aller Budget-Parameter.</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 print:hidden">
          <FileText size={16} /> PDF / Drucken
        </button>
      </div>

      {/* Over/Under Alert */}
      {state.revenue > 0 && (
        <div className={`flex items-center gap-sm p-md mb-xl border ${overUnder >= 0 ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {overUnder >= 0 ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-body font-medium">
            {overUnder >= 0 ? `Unter Budget: ${fmt(overUnder)} ${cur} verbleibend` : `Ueber Budget: ${fmt(Math.abs(overUnder))} ${cur} Ueberschreitung`}
          </span>
        </div>
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><DollarSign size={14} /> Jahresumsatz</div>
          <p className="font-display text-h2">{fmt(state.revenue)} {cur}</p>
        </div>
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><DollarSign size={14} /> S&B Budget</div>
          <p className="font-display text-h2">{fmt(sbBudget)} {cur}</p>
        </div>
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><Clock size={14} /> Stunden/Woche</div>
          <p className="font-display text-h2">{weeklyHours.toFixed(1)}</p>
        </div>
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><DollarSign size={14} /> Produktivitaet</div>
          <p className="font-display text-h2">{fmt(productivity)} {cur}/h</p>
        </div>
      </div>

      {/* Management Structure */}
      {state.managementRoles.length > 0 && (
        <>
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Users size={18} /> Management-Struktur</h2>
          <div className="overflow-x-auto mb-xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-kore-ink text-kore-white text-small">
                  <th className="text-left px-md py-sm">Rolle</th>
                  <th className="text-right px-md py-sm">Grundgehalt</th>
                  <th className="text-right px-md py-sm">h/Woche</th>
                  <th className="text-right px-md py-sm">Gesamtkosten</th>
                </tr>
              </thead>
              <tbody>
                {state.managementRoles.map((r) => {
                  const c = calcManagementCost(r, s);
                  return (
                    <tr key={r.id} className="border-b border-kore-border">
                      <td className="px-md py-sm text-body text-kore-ink">{r.role}</td>
                      <td className="px-md py-sm text-right text-body">{fmt(r.baseSalary)} {cur}</td>
                      <td className="px-md py-sm text-right text-body">{r.hoursPerWeek}</td>
                      <td className="px-md py-sm text-right text-body font-medium">{fmt(c.totalWithEmployer)} {cur}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium border-t-2 border-kore-ink">
                  <td className="px-md py-sm" colSpan={3}>Gesamt</td>
                  <td className="px-md py-sm text-right">{fmt(mgmtCost)} {cur}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Budget Breakdown */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Budget-Aufschluesselung</h2>
      <div className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
        {budgetItems.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-small text-kore-mid mb-xs">
              <span>{item.label}</span>
              <span>{fmt(item.value)} {cur} ({item.pct.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded">
              <div className="h-2 rounded transition-all" style={{ width: `${Math.min(Math.max(item.pct, 0), 100)}%`, backgroundColor: '#9E8460' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Allocation Inputs */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Sonstige Zuweisungen</h2>
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Support ({cur})</label>
            <input type="number" value={state.allocation.support || ''} onChange={(e) => useBudgetStore.getState().setAllocation({ support: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Merit ({cur})</label>
            <input type="number" value={state.allocation.merit || ''} onChange={(e) => useBudgetStore.getState().setAllocation({ merit: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Uniform ({cur})</label>
            <input type="number" value={state.allocation.uniform || ''} onChange={(e) => useBudgetStore.getState().setAllocation({ uniform: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Calendar size={18} /> Monatsuebersicht</h2>
      <div className="overflow-x-auto mb-xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-kore-ink text-kore-white text-small">
              <th className="text-left px-md py-sm">Monat</th>
              <th className="text-right px-md py-sm">Gewicht</th>
              <th className="text-right px-md py-sm">Umsatz</th>
              <th className="text-right px-md py-sm">S&B Budget</th>
              <th className="text-right px-md py-sm">h/Woche</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((m, i) => (
              <tr key={i} className="border-b border-kore-border">
                <td className="px-md py-sm text-body text-kore-ink">{MONTH_NAMES[i]}</td>
                <td className="px-md py-sm text-right text-body">{m.weight.toFixed(2)}%</td>
                <td className="px-md py-sm text-right text-body">{fmt(m.revenue)} {cur}</td>
                <td className="px-md py-sm text-right text-body">{fmt(m.sbBudget)} {cur}</td>
                <td className="px-md py-sm text-right text-body">{m.weeklyHours.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Team Structure */}
      {state.contractTypes.length > 0 && (
        <>
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Users size={18} /> Team-Struktur</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-kore-ink text-kore-white text-small">
                  <th className="text-left px-md py-sm">Vertragsart</th>
                  <th className="text-right px-md py-sm">Anzahl</th>
                  <th className="text-right px-md py-sm">h/Woche</th>
                  <th className="text-right px-md py-sm">Gesamt h</th>
                </tr>
              </thead>
              <tbody>
                {state.contractTypes.map((c) => (
                  <tr key={c.id} className="border-b border-kore-border">
                    <td className="px-md py-sm text-body text-kore-ink">{c.name}</td>
                    <td className="px-md py-sm text-right text-body">{c.count}</td>
                    <td className="px-md py-sm text-right text-body">{c.hoursPerWeek}</td>
                    <td className="px-md py-sm text-right text-body">{c.count * c.hoursPerWeek}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium border-t-2 border-kore-ink">
                  <td className="px-md py-sm">Gesamt</td>
                  <td className="px-md py-sm text-right">{ct.totalHeadcount}</td>
                  <td className="px-md py-sm text-right">-</td>
                  <td className="px-md py-sm text-right">{ct.totalBaseHours}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
