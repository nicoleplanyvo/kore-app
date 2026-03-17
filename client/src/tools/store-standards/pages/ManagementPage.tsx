import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Trash2 } from 'lucide-react';
import { calcSbBudget, calcManagementCost, calcTotalManagementCost } from '../../../hooks/useStoreStandards';
import type { ManagementRole } from '../../../hooks/useStoreStandards';
import { useBudgetStore } from '../../../stores/budgetStore';

export function ManagementPage() {
  const { state, addManagementRole, updateManagementRole, removeManagementRole } = useBudgetStore();
  const s = state.settings;
  const [newRole, setNewRole] = useState<Omit<ManagementRole, 'id'>>({ role: '', baseSalary: 0, hoursPerWeek: 40 });

  const sbBudget = calcSbBudget(state.revenue, state.sbRatePct);
  const totalMgmt = calcTotalManagementCost(state.managementRoles, s);
  const mgmtPct = sbBudget > 0 ? (totalMgmt / sbBudget) * 100 : 0;

  const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const fmt2 = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 2 });
  const cur = state.settings.currency;

  const handleAdd = () => {
    if (!newRole.role) return;
    addManagementRole({ ...newRole, id: crypto.randomUUID() });
    setNewRole({ role: '', baseSalary: 0, hoursPerWeek: 40 });
  };

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-lg">
        <ArrowLeft size={14} /> Zurueck zur Uebersicht
      </Link>
      <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm mb-xs">
        <Users size={24} /> Management
      </h1>
      <p className="text-body text-kore-mid mb-2xl">Management-Rollen und deren Kosten definieren.</p>

      {/* Budget Progress */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="flex justify-between text-small text-kore-mid mb-xs">
          <span>Management-Kosten vs. S&B Budget</span>
          <span>{fmt(totalMgmt)} / {fmt(sbBudget)} {cur} ({mgmtPct.toFixed(1)}%)</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded">
          <div className="h-3 rounded transition-all" style={{ width: `${Math.min(mgmtPct, 100)}%`, backgroundColor: mgmtPct > 60 ? '#dc2626' : '#9E8460' }} />
        </div>
      </div>

      {/* Add Role */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <h3 className="font-display text-h3 text-kore-ink mb-md">Rolle hinzufuegen</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md items-end">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Rolle</label>
            <input value={newRole.role} onChange={(e) => setNewRole({ ...newRole, role: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" placeholder="z.B. Store Manager" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Grundgehalt ({cur}/Jahr)</label>
            <input type="number" value={newRole.baseSalary || ''} onChange={(e) => setNewRole({ ...newRole, baseSalary: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Stunden/Woche</label>
            <input type="number" value={newRole.hoursPerWeek || ''} onChange={(e) => setNewRole({ ...newRole, hoursPerWeek: Number(e.target.value) })} className="w-full border border-kore-border px-md py-sm text-body text-right" />
          </div>
          <button onClick={handleAdd} className="flex items-center justify-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 h-[42px]">
            <Plus size={14} /> Hinzufuegen
          </button>
        </div>
      </div>

      {/* Roles Table */}
      {state.managementRoles.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Management-Rollen definiert.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-kore-ink text-kore-white text-small">
                <th className="text-left px-md py-sm">Rolle</th>
                <th className="text-right px-md py-sm">Grundgehalt</th>
                <th className="text-right px-md py-sm">h/Woche</th>
                <th className="text-right px-md py-sm">{cur}/h</th>
                <th className="text-right px-md py-sm">So-Zuschlag</th>
                <th className="text-right px-md py-sm">Feiertag</th>
                <th className="text-right px-md py-sm">Gesamt {cur}</th>
                {s.fxRate !== 1 && <th className="text-right px-md py-sm">Konvertiert</th>}
                <th className="text-right px-md py-sm">+Arbeitgeber</th>
                <th className="text-center px-md py-sm">-</th>
              </tr>
            </thead>
            <tbody>
              {state.managementRoles.map((r) => {
                const c = calcManagementCost(r, s);
                return (
                  <tr key={r.id} className="border-b border-kore-border hover:bg-gray-50">
                    <td className="px-md py-sm">
                      <input value={r.role} onChange={(e) => updateManagementRole(r.id, { role: e.target.value })} className="border border-kore-border px-sm py-xs text-body w-full" />
                    </td>
                    <td className="px-md py-sm">
                      <input type="number" value={r.baseSalary} onChange={(e) => updateManagementRole(r.id, { baseSalary: Number(e.target.value) })} className="w-24 border border-kore-border px-sm py-xs text-body text-right" />
                    </td>
                    <td className="px-md py-sm">
                      <input type="number" value={r.hoursPerWeek} onChange={(e) => updateManagementRole(r.id, { hoursPerWeek: Number(e.target.value) })} className="w-16 border border-kore-border px-sm py-xs text-body text-right" />
                    </td>
                    <td className="px-md py-sm text-right text-body">{fmt2(c.hourlyRate)}</td>
                    <td className="px-md py-sm text-right text-body">{fmt(c.sundayCost)}</td>
                    <td className="px-md py-sm text-right text-body">{fmt(c.holidayCost)}</td>
                    <td className="px-md py-sm text-right text-body font-medium">{fmt(c.totalLocal)}</td>
                    {s.fxRate !== 1 && <td className="px-md py-sm text-right text-body">{fmt(c.totalConverted)}</td>}
                    <td className="px-md py-sm text-right text-body font-medium text-kore-brass">{fmt(c.totalWithEmployer)}</td>
                    <td className="px-md py-sm text-center">
                      <button onClick={() => removeManagementRole(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-medium border-t-2 border-kore-ink">
                <td className="px-md py-sm" colSpan={s.fxRate !== 1 ? 8 : 7}>Gesamt Management</td>
                <td className="px-md py-sm text-right text-kore-brass">{fmt(totalMgmt)} {cur}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
