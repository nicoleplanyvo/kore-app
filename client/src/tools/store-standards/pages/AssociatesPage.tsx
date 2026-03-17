import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserCheck, Plus, Trash2, DollarSign } from 'lucide-react';
import { calcSbBudget, calcTotalManagementCost, calcAssociateBlendedRate, calcAssociateBudget, calcAvailableHoursPerWeek, calcContractTotals } from '../../../hooks/useStoreStandards';
import type { ContractType } from '../../../hooks/useStoreStandards';
import { useBudgetStore } from '../../../stores/budgetStore';

export function AssociatesPage() {
  const { state, addContractType, updateContractType, removeContractType, setAssociateLevel, setAllocation } = useBudgetStore();
  const s = state.settings;
  const [newContract, setNewContract] = useState<Omit<ContractType, 'id'>>({ name: '', count: 0, hoursPerWeek: 0 });

  const sbBudget = calcSbBudget(state.revenue, state.sbRatePct);
  const mgmtCost = calcTotalManagementCost(state.managementRoles, s);
  const assocRate = calcAssociateBlendedRate(state.associateLevels, s);
  const assocBudget = calcAssociateBudget(sbBudget, mgmtCost, state.allocation);
  const weeklyHours = calcAvailableHoursPerWeek(assocBudget, assocRate.fullCost, s.weeksPerYear);
  const annualHours = weeklyHours * s.weeksPerYear;
  const ct = calcContractTotals(state.contractTypes);
  const budgetDiff = weeklyHours - ct.totalBaseHours;

  const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const fmt2 = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const cur = state.settings.currency;

  const handleAddContract = () => {
    if (!newContract.name) return;
    addContractType({ ...newContract, id: crypto.randomUUID() });
    setNewContract({ name: '', count: 0, hoursPerWeek: 0 });
  };

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-lg">
        <ArrowLeft size={14} /> Zurueck zur Uebersicht
      </Link>
      <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm mb-xs">
        <UserCheck size={24} /> Mitarbeiter
      </h1>
      <p className="text-body text-kore-mid mb-2xl">Headcount, Stundensaetze und Kostenverteilung.</p>

      {/* ---- Headcount Section ---- */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Headcount</h2>

      {/* Add Contract Type */}
      <div className="bg-kore-white border border-kore-border p-lg mb-md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md items-end">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Vertragsart</label>
            <input value={newContract.name} onChange={(e) => setNewContract({ ...newContract, name: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" placeholder="z.B. Vollzeit" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Anzahl</label>
            <input type="number" value={newContract.count || ''} onChange={(e) => setNewContract({ ...newContract, count: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Stunden/Woche</label>
            <input type="number" value={newContract.hoursPerWeek || ''} onChange={(e) => setNewContract({ ...newContract, hoursPerWeek: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
          <button onClick={handleAddContract} className="flex items-center justify-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 h-[42px]">
            <Plus size={14} /> Hinzufuegen
          </button>
        </div>
      </div>

      {state.contractTypes.length > 0 && (
        <div className="overflow-x-auto mb-md">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-kore-ink text-kore-white text-small">
                <th className="text-left px-md py-sm">Vertragsart</th>
                <th className="text-right px-md py-sm">Anzahl</th>
                <th className="text-right px-md py-sm">h/Woche</th>
                <th className="text-right px-md py-sm">Gesamt h</th>
                <th className="text-center px-md py-sm">-</th>
              </tr>
            </thead>
            <tbody>
              {state.contractTypes.map((c) => (
                <tr key={c.id} className="border-b border-kore-border hover:bg-gray-50">
                  <td className="px-md py-sm">
                    <input value={c.name} onChange={(e) => updateContractType(c.id, { name: e.target.value })} className="border border-kore-border px-sm py-xs text-body w-full" />
                  </td>
                  <td className="px-md py-sm">
                    <input type="number" value={c.count} onChange={(e) => updateContractType(c.id, { count: Number(e.target.value) })} className="w-16 border border-kore-border px-sm py-xs text-body text-right" />
                  </td>
                  <td className="px-md py-sm">
                    <input type="number" value={c.hoursPerWeek} onChange={(e) => updateContractType(c.id, { hoursPerWeek: Number(e.target.value) })} className="w-16 border border-kore-border px-sm py-xs text-body text-right" />
                  </td>
                  <td className="px-md py-sm text-right text-body">{c.count * c.hoursPerWeek}</td>
                  <td className="px-md py-sm text-center">
                    <button onClick={() => removeContractType(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Headcount KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Gesamtanzahl</div>
          <p className="font-display text-h3 text-kore-ink">{ct.totalHeadcount}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Basis-Stunden/Woche</div>
          <p className="font-display text-h3 text-kore-ink">{ct.totalBaseHours}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">FTE</div>
          <p className="font-display text-h3 text-kore-ink">{ct.fte.toFixed(1)}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Durchschn. h/Person</div>
          <p className="font-display text-h3 text-kore-ink">{ct.avgHours.toFixed(1)}</p>
        </div>
      </div>

      {/* ---- Stundensaetze Section ---- */}
      <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><DollarSign size={18} /> Stundensaetze</h2>
      <div className="bg-kore-white border border-kore-border p-lg mb-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {state.associateLevels.map((l, i) => (
            <div key={i}>
              <h4 className="font-medium text-kore-ink mb-sm">{l.label}</h4>
              <div className="space-y-sm">
                <div>
                  <label className="block text-small text-kore-mid mb-xs">{cur}/h</label>
                  <input type="number" step="0.5" value={l.rate} onChange={(e) => setAssociateLevel(i, { rate: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
                </div>
                <div>
                  <label className="block text-small text-kore-mid mb-xs">Verteilung %</label>
                  <input type="number" step="1" value={l.distribution} onChange={(e) => setAssociateLevel(i, { distribution: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blended Rate KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Mischsatz</div>
          <p className="font-display text-h3 text-kore-ink">{fmt2(assocRate.blended)} {cur}/h</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">+ Zuschlaege</div>
          <p className="font-display text-h3 text-kore-ink">{fmt2(assocRate.withPremiums)} {cur}/h</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Vollkosten/h</div>
          <p className="font-display text-h3 text-kore-brass">{fmt2(assocRate.fullCost)} {cur}/h</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Budget-Stunden/Woche</div>
          <p className="font-display text-h3 text-kore-ink">{weeklyHours.toFixed(1)}</p>
        </div>
      </div>

      {/* ---- Kostenverteilung Section ---- */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Kostenverteilung je Level</h2>
      {state.associateLevels.length > 0 && (
        <div className="overflow-x-auto mb-xl">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-kore-ink text-kore-white text-small">
                <th className="text-left px-md py-sm">Level</th>
                <th className="text-right px-md py-sm">Mix %</th>
                <th className="text-right px-md py-sm">{cur}/h</th>
                <th className="text-right px-md py-sm">Vollkosten/h</th>
                <th className="text-right px-md py-sm">Stunden/Jahr</th>
                <th className="text-right px-md py-sm">Jahreskosten</th>
              </tr>
            </thead>
            <tbody>
              {state.associateLevels.map((l, i) => {
                const totalDist = state.associateLevels.reduce((s2, lv) => s2 + lv.distribution, 0);
                const pct = totalDist > 0 ? l.distribution / totalDist : 0;
                const fullCost = l.rate * s.fxRate * (1 + s.employerPremiumPct / 100);
                const levelHoursYear = annualHours * pct;
                const levelCost = levelHoursYear * fullCost;
                return (
                  <tr key={i} className="border-b border-kore-border hover:bg-gray-50">
                    <td className="px-md py-sm text-body font-medium text-kore-ink">{l.label}</td>
                    <td className="px-md py-sm text-right text-body">{(pct * 100).toFixed(0)}%</td>
                    <td className="px-md py-sm text-right text-body">{fmt2(l.rate)}</td>
                    <td className="px-md py-sm text-right text-body">{fmt2(fullCost)}</td>
                    <td className="px-md py-sm text-right text-body">{fmt(levelHoursYear)}</td>
                    <td className="px-md py-sm text-right text-body font-medium">{fmt(levelCost)} {cur}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Budget vs. Actual */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Budget vs. Soll</h2>
      <div className="bg-kore-white border border-kore-border p-lg">
        <div className="grid grid-cols-3 gap-lg text-center">
          <div>
            <div className="text-small text-kore-mid mb-xs">Budget h/Woche</div>
            <p className="font-display text-h2 text-kore-ink">{weeklyHours.toFixed(1)}</p>
          </div>
          <div>
            <div className="text-small text-kore-mid mb-xs">Basis h/Woche</div>
            <p className="font-display text-h2 text-kore-ink">{ct.totalBaseHours}</p>
          </div>
          <div>
            <div className="text-small text-kore-mid mb-xs">Differenz</div>
            <p className={`font-display text-h2 ${budgetDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {budgetDiff >= 0 ? '+' : ''}{budgetDiff.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
