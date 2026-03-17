import { create } from 'zustand';
import type { BudgetState, ManagementRole, ContractType, AssociateLevel, BudgetSettings, AllocationAmounts } from '../hooks/useStoreStandards';
import { defaultState } from '../hooks/useStoreStandards';

interface BudgetStoreState {
  storeId: string;
  scenarioId: string | null;
  scenarioName: string;
  state: BudgetState;
  setStoreId: (id: string) => void;
  setScenarioId: (id: string | null) => void;
  setScenarioName: (name: string) => void;
  loadState: (s: BudgetState) => void;
  resetState: () => void;
  setRevenue: (v: number) => void;
  setSbRatePct: (v: number) => void;
  setMonthlyWeight: (idx: number, v: number) => void;
  distributeEvenly: () => void;
  setSettings: (s: Partial<BudgetSettings>) => void;
  addManagementRole: (r: ManagementRole) => void;
  updateManagementRole: (id: string, r: Partial<ManagementRole>) => void;
  removeManagementRole: (id: string) => void;
  addContractType: (c: ContractType) => void;
  updateContractType: (id: string, c: Partial<ContractType>) => void;
  removeContractType: (id: string) => void;
  setAssociateLevel: (idx: number, l: Partial<AssociateLevel>) => void;
  setAllocation: (a: Partial<AllocationAmounts>) => void;
}

export const useBudgetStore = create<BudgetStoreState>((set) => ({
  storeId: '',
  scenarioId: null,
  scenarioName: 'Neues Szenario',
  state: { ...defaultState, settings: { ...defaultState.settings }, monthlyWeights: [...defaultState.monthlyWeights], managementRoles: [], contractTypes: [], associateLevels: defaultState.associateLevels.map((l) => ({ ...l })), allocation: { ...defaultState.allocation } },
  setStoreId: (id) => set({ storeId: id }),
  setScenarioId: (id) => set({ scenarioId: id }),
  setScenarioName: (name) => set({ scenarioName: name }),
  loadState: (s) => set({ state: s }),
  resetState: () => set({
    scenarioId: null,
    scenarioName: 'Neues Szenario',
    state: { ...defaultState, settings: { ...defaultState.settings }, monthlyWeights: [...defaultState.monthlyWeights], managementRoles: [], contractTypes: [], associateLevels: defaultState.associateLevels.map((l) => ({ ...l })), allocation: { ...defaultState.allocation } },
  }),
  setRevenue: (v) => set((prev) => ({ state: { ...prev.state, revenue: v } })),
  setSbRatePct: (v) => set((prev) => ({ state: { ...prev.state, sbRatePct: v } })),
  setMonthlyWeight: (idx, v) => set((prev) => {
    const w = [...prev.state.monthlyWeights];
    w[idx] = v;
    return { state: { ...prev.state, monthlyWeights: w } };
  }),
  distributeEvenly: () => set((prev) => {
    const even = Array(12).fill(8.33) as number[];
    even[11] = 8.37;
    return { state: { ...prev.state, monthlyWeights: even } };
  }),
  setSettings: (s) => set((prev) => ({ state: { ...prev.state, settings: { ...prev.state.settings, ...s } } })),
  addManagementRole: (r) => set((prev) => ({ state: { ...prev.state, managementRoles: [...prev.state.managementRoles, r] } })),
  updateManagementRole: (id, r) => set((prev) => ({
    state: { ...prev.state, managementRoles: prev.state.managementRoles.map((m) => (m.id === id ? { ...m, ...r } : m)) },
  })),
  removeManagementRole: (id) => set((prev) => ({
    state: { ...prev.state, managementRoles: prev.state.managementRoles.filter((m) => m.id !== id) },
  })),
  addContractType: (c) => set((prev) => ({ state: { ...prev.state, contractTypes: [...prev.state.contractTypes, c] } })),
  updateContractType: (id, c) => set((prev) => ({
    state: { ...prev.state, contractTypes: prev.state.contractTypes.map((t) => (t.id === id ? { ...t, ...c } : t)) },
  })),
  removeContractType: (id) => set((prev) => ({
    state: { ...prev.state, contractTypes: prev.state.contractTypes.filter((t) => t.id !== id) },
  })),
  setAssociateLevel: (idx, l) => set((prev) => {
    const levels = prev.state.associateLevels.map((v, i) => (i === idx ? { ...v, ...l } : v));
    return { state: { ...prev.state, associateLevels: levels } };
  }),
  setAllocation: (a) => set((prev) => ({ state: { ...prev.state, allocation: { ...prev.state.allocation, ...a } } })),
}));
