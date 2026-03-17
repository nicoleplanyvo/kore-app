import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, DollarSign, Clock, Percent, ChevronRight, Save, Trash2, FolderOpen, Plus, Store } from 'lucide-react';
import { useBudgetStores, useBudgetScenarios, useBudgetScenario, useSaveScenario, useUpdateScenario, useDeleteScenario, calcSbBudget, calcTotalManagementCost, calcAssociateBlendedRate, calcAssociateBudget, calcAvailableHoursPerWeek } from '../../../hooks/useStoreStandards';
import { useBudgetStore } from '../../../stores/budgetStore';

export function OverviewPage() {
  const { storeId, setStoreId, scenarioId, setScenarioId, scenarioName, setScenarioName, state, loadState, resetState } = useBudgetStore();
  const { data: stores } = useBudgetStores();
  const { data: scenarios } = useBudgetScenarios(storeId);
  const { data: loaded } = useBudgetScenario(scenarioId ?? undefined);
  const saveMut = useSaveScenario();
  const updateMut = useUpdateScenario();
  const deleteMut = useDeleteScenario();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Auto-select first store
  useEffect(() => {
    if (!storeId && stores?.length) setStoreId(stores[0].id);
  }, [stores, storeId, setStoreId]);

  // Load scenario data when fetched
  useEffect(() => {
    if (loaded?.data) {
      loadState(loaded.data);
      setScenarioName(loaded.name);
    }
  }, [loaded, loadState, setScenarioName]);

  const sbBudget = calcSbBudget(state.revenue, state.sbRatePct);
  const mgmtCost = calcTotalManagementCost(state.managementRoles, state.settings);
  const assocRate = calcAssociateBlendedRate(state.associateLevels, state.settings);
  const assocBudget = calcAssociateBudget(sbBudget, mgmtCost, state.allocation);
  const weeklyHours = calcAvailableHoursPerWeek(assocBudget, assocRate.fullCost, state.settings.weeksPerYear);

  const fmt = (v: number) => v.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  const fmtCur = (v: number) => `${state.settings.currency} ${fmt(v)}`;

  const handleSave = () => {
    if (!storeId) return;
    if (scenarioId) {
      updateMut.mutate({ id: scenarioId, name: scenarioName, data: state });
    } else {
      saveMut.mutate({ storeId, name: scenarioName, data: state }, {
        onSuccess: (d) => { setScenarioId(d.id); },
      });
    }
    setSaveDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Szenario wirklich loeschen?')) return;
    deleteMut.mutate(id, {
      onSuccess: () => { if (scenarioId === id) resetState(); },
    });
  };

  const tabs = [
    { to: '/tools/store-standards/revenue', label: 'Umsatz & Budget', icon: DollarSign },
    { to: '/tools/store-standards/monthly', label: 'Monatsverteilung', icon: Clock },
    { to: '/tools/store-standards/settings', label: 'Einstellungen', icon: Calculator },
    { to: '/tools/store-standards/management', label: 'Management', icon: Store },
    { to: '/tools/store-standards/associates', label: 'Mitarbeiter', icon: Calculator },
    { to: '/tools/store-standards/summary', label: 'Zusammenfassung', icon: ChevronRight },
  ];

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Calculator size={24} /> Personalkosten-Planer
          </h1>
          <p className="text-body text-kore-mid mt-xs">Budget-Simulation und Personalkosten-Planung.</p>
        </div>
        <div className="flex gap-sm">
          <button onClick={() => setSaveDialogOpen(true)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Save size={16} /> Speichern
          </button>
          <button onClick={resetState} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <Plus size={16} /> Neu
          </button>
        </div>
      </div>

      {/* Save Dialog */}
      {saveDialogOpen && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <h3 className="font-display text-h3 text-kore-ink">Szenario speichern</h3>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Szenario-Name</label>
            <input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div className="flex gap-sm">
            <button onClick={handleSave} disabled={saveMut.isPending || updateMut.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
              <Save size={14} /> {saveMut.isPending || updateMut.isPending ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={() => setSaveDialogOpen(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Store Selector + Scenario Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Store</label>
          <select value={storeId} onChange={(e) => { setStoreId(e.target.value); resetState(); }} className="w-full border border-kore-border px-md py-sm text-body bg-kore-white">
            {stores?.map((s) => <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Szenario laden</label>
          <select value={scenarioId ?? ''} onChange={(e) => { const v = e.target.value; if (v) setScenarioId(v); else resetState(); }} className="w-full border border-kore-border px-md py-sm text-body bg-kore-white">
            <option value="">-- Neues Szenario --</option>
            {scenarios?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><DollarSign size={14} /> Jahresumsatz</div>
          <p className="font-display text-h2">{fmtCur(state.revenue)}</p>
        </div>
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><DollarSign size={14} /> S&B Budget</div>
          <p className="font-display text-h2">{fmtCur(sbBudget)}</p>
        </div>
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><Percent size={14} /> S&B Rate</div>
          <p className="font-display text-h2">{state.sbRatePct.toFixed(1)}%</p>
        </div>
        <div className="bg-kore-ink text-kore-white p-lg">
          <div className="flex items-center gap-xs text-small opacity-75 mb-xs"><Clock size={14} /> Stunden/Woche</div>
          <p className="font-display text-h2">{weeklyHours.toFixed(1)}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <h2 className="font-display text-h3 text-kore-ink mb-md">Bereiche</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        {tabs.map((t) => (
          <Link key={t.to} to={t.to} className="flex items-center justify-between bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
            <div className="flex items-center gap-sm">
              <t.icon size={18} className="text-kore-brass" />
              <span className="font-medium text-kore-ink">{t.label}</span>
            </div>
            <ChevronRight size={16} className="text-kore-mid" />
          </Link>
        ))}
      </div>

      {/* Saved Scenarios */}
      {scenarios && scenarios.length > 0 && (
        <>
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><FolderOpen size={18} /> Gespeicherte Szenarien</h2>
          <div className="space-y-sm">
            {scenarios.map((s) => (
              <div key={s.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                <div>
                  <span className="font-medium text-kore-ink">{s.name}</span>
                  <span className="text-small text-kore-mid ml-sm">{new Date(s.updatedAt).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex gap-sm">
                  <button onClick={() => setScenarioId(s.id)} className="px-sm py-xs text-small text-kore-brass hover:underline">Laden</button>
                  <button onClick={() => handleDelete(s.id)} className="px-sm py-xs text-small text-red-500 hover:underline"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
