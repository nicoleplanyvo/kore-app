import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface BudgetStore { id: string; name: string; city: string | null; }
export interface BudgetScenarioMeta { id: string; storeId: string; name: string; createdBy: string; createdAt: string; updatedAt: string; }
export interface BudgetScenarioFull extends BudgetScenarioMeta { data: BudgetState; }

/* ---- Scenario state types ---- */

export interface ManagementRole {
  id: string;
  role: string;
  baseSalary: number;
  hoursPerWeek: number;
}

export interface ContractType {
  id: string;
  name: string;
  count: number;
  hoursPerWeek: number;
}

export interface AssociateLevel {
  label: string;
  rate: number;
  distribution: number; // percent
}

export interface BudgetSettings {
  currency: string;
  fxRate: number;
  employerPremiumPct: number;
  holidayPayPct: number;
  weeksPerYear: number;
  sundaysManagement: number;
  publicHolidays: number;
  sundayPremiumPct: number;
  hoursPerSunday: number;
  holidayStaffingPct: number;
  hoursPerHoliday: number;
}

export interface AllocationAmounts {
  support: number;
  merit: number;
  uniform: number;
}

export interface BudgetState {
  revenue: number;
  sbRatePct: number;
  monthlyWeights: number[];
  settings: BudgetSettings;
  managementRoles: ManagementRole[];
  contractTypes: ContractType[];
  associateLevels: AssociateLevel[];
  allocation: AllocationAmounts;
}

/* ---- Default state ---- */

export const defaultSettings: BudgetSettings = {
  currency: '\u20AC',
  fxRate: 1,
  employerPremiumPct: 21,
  holidayPayPct: 0,
  weeksPerYear: 52,
  sundaysManagement: 6,
  publicHolidays: 10,
  sundayPremiumPct: 50,
  hoursPerSunday: 5,
  holidayStaffingPct: 50,
  hoursPerHoliday: 8,
};

export const defaultState: BudgetState = {
  revenue: 0,
  sbRatePct: 18,
  monthlyWeights: [8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.37],
  settings: { ...defaultSettings },
  managementRoles: [],
  contractTypes: [],
  associateLevels: [
    { label: 'Junior', rate: 12, distribution: 50 },
    { label: 'Senior', rate: 15, distribution: 35 },
    { label: 'Lead', rate: 18, distribution: 15 },
  ],
  allocation: { support: 0, merit: 0, uniform: 0 },
};

/* ---- Hooks ---- */

export function useBudgetStores() {
  return useQuery<BudgetStore[]>({ queryKey: ['budget', 'stores'], queryFn: () => api('/api/tools/store-standards/stores') });
}

export function useBudgetScenarios(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery<BudgetScenarioMeta[]>({
    queryKey: ['budget', 'scenarios', storeId],
    queryFn: () => api(`/api/tools/store-standards/scenarios?${sp}`),
    enabled: !!storeId,
  });
}

export function useBudgetScenario(id?: string) {
  return useQuery<BudgetScenarioFull>({
    queryKey: ['budget', 'scenario', id],
    queryFn: () => api(`/api/tools/store-standards/scenarios/${id}`),
    enabled: !!id,
  });
}

export function useSaveScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { storeId: string; name: string; data: BudgetState }) =>
      api<BudgetScenarioFull>('/api/tools/store-standards/scenarios', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

export function useUpdateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; data?: BudgetState }) =>
      api<BudgetScenarioFull>(`/api/tools/store-standards/scenarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

export function useDeleteScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/tools/store-standards/scenarios/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

/* ---- Calculation helpers ---- */

export function calcSbBudget(revenue: number, sbRatePct: number) {
  return revenue * (sbRatePct / 100);
}

export function calcManagementCost(role: ManagementRole, s: BudgetSettings) {
  const annualBase = role.baseSalary;
  const hourlyRate = role.hoursPerWeek > 0 ? annualBase / (role.hoursPerWeek * s.weeksPerYear) : 0;
  const sundayCost = hourlyRate * (s.sundayPremiumPct / 100) * s.hoursPerSunday * s.sundaysManagement;
  const holidayCost = hourlyRate * (s.holidayStaffingPct / 100) * s.hoursPerHoliday * s.publicHolidays;
  const totalLocal = annualBase + sundayCost + holidayCost;
  const totalConverted = totalLocal * s.fxRate;
  const totalWithEmployer = totalConverted * (1 + s.employerPremiumPct / 100);
  return { hourlyRate, sundayCost, holidayCost, totalLocal, totalConverted, totalWithEmployer };
}

export function calcTotalManagementCost(roles: ManagementRole[], s: BudgetSettings) {
  return roles.reduce((sum, r) => sum + calcManagementCost(r, s).totalWithEmployer, 0);
}

export function calcAssociateBlendedRate(levels: AssociateLevel[], s: BudgetSettings) {
  const totalDist = levels.reduce((sum, l) => sum + l.distribution, 0);
  if (totalDist === 0) return { blended: 0, withPremiums: 0, fullCost: 0 };
  const blended = levels.reduce((sum, l) => sum + l.rate * (l.distribution / totalDist), 0);
  const withPremiums = blended * s.fxRate;
  const fullCost = withPremiums * (1 + s.employerPremiumPct / 100);
  return { blended, withPremiums, fullCost };
}

export function calcAssociateBudget(sbBudget: number, managementCost: number, alloc: AllocationAmounts) {
  return sbBudget - managementCost - alloc.support - alloc.merit - alloc.uniform;
}

export function calcAvailableHoursPerWeek(assocBudget: number, fullCostPerHour: number, weeksPerYear: number) {
  if (fullCostPerHour <= 0 || weeksPerYear <= 0) return 0;
  return assocBudget / fullCostPerHour / weeksPerYear;
}

export function calcContractTotals(types: ContractType[]) {
  const totalHeadcount = types.reduce((s, t) => s + t.count, 0);
  const totalBaseHours = types.reduce((s, t) => s + t.count * t.hoursPerWeek, 0);
  const fte = totalBaseHours / 40;
  const avgHours = totalHeadcount > 0 ? totalBaseHours / totalHeadcount : 0;
  return { totalHeadcount, totalBaseHours, fte, avgHours };
}

export function calcMonthlyDistribution(revenue: number, sbRatePct: number, weights: number[], weeksPerYear: number, fullCostPerHour: number) {
  return weights.map((w) => {
    const monthRevenue = revenue * (w / 100);
    const monthSbBudget = monthRevenue * (sbRatePct / 100);
    const weeksInMonth = weeksPerYear / 12;
    const weeklyHours = fullCostPerHour > 0 ? monthSbBudget / fullCostPerHour / weeksInMonth : 0;
    return { weight: w, revenue: monthRevenue, sbBudget: monthSbBudget, weeklyHours };
  });
}

export const MONTH_NAMES = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
