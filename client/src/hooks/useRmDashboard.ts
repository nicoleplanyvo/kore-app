import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ───────────────────────────────────────────

export interface RmStore {
  id: string;
  name: string;
  city: string | null;
  region?: { id: string; name: string } | null;
}

export interface RmSummary {
  storeCount: number;
  period: { from?: string; to?: string; days: number };
  kpi: {
    totalRevenue: number;
    totalTransactions: number;
    totalFootfall: number;
    totalUnitsSold: number;
    avgConversionRate: number;
    avgTicket: number;
    revenueChange: number;
    transactionChange: number;
    footfallChange: number;
  };
  operational: {
    openMaintenance: number;
    openStockCallouts: number;
    pendingOrders: number;
    openLossIncidents: number;
    trainingCompletionRate: number;
  };
}

export interface RmRankingEntry {
  storeId: string;
  storeName: string;
  city: string | null;
  revenue: number;
  transactions: number;
  footfall: number;
  unitsSold: number;
  conversionRate: number;
  avgTicket: number;
  sortValue: number;
  rank: number;
  status: 'green' | 'yellow' | 'red';
}

export interface RmAlert {
  type: 'MAINTENANCE' | 'STOCK' | 'LOSS';
  severity: string;
  title: string;
  storeId: string;
  store: string;
  status: string;
  createdAt: string;
}

export interface RmTrend {
  week: string;
  revenue: number;
  transactions: number;
  footfall: number;
  unitsSold: number;
  conversionRate: number;
  avgTicket: number;
}

export interface RmStoreDetail {
  store: { id: string; name: string; city: string | null; address: string | null; region?: { id: string; name: string } | null };
  period: { from?: string; to?: string };
  kpi: {
    totalRevenue: number;
    totalTransactions: number;
    totalFootfall: number;
    totalUnitsSold: number;
    conversionRate: number;
    avgTicket: number;
  };
  dailyTrend: { date: string; revenue: number; transactions: number; footfall: number }[];
  operational: {
    openMaintenance: any[];
    openStock: any[];
    lossIncidents: any[];
    trainingRate: number;
    forecastAccuracy: number | null;
  };
  recentForecasts: any[];
}

export interface RmExportRow {
  store: string;
  date: string;
  revenue: number;
  transactions: number;
  footfall: number;
  unitsSold: number;
}

// ── Hooks ───────────────────────────────────────────

export function useRmStores() {
  return useQuery<RmStore[]>({
    queryKey: ['rm-dashboard', 'stores'],
    queryFn: () => api<RmStore[]>('/api/tools/rm-dashboard/stores'),
  });
}

export function useRmSummary(params?: { period?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery<RmSummary>({
    queryKey: ['rm-dashboard', 'summary', params],
    queryFn: () => api<RmSummary>(`/api/tools/rm-dashboard/summary?${sp}`),
  });
}

export function useRmRanking(params?: { period?: string; from?: string; to?: string; kpi?: string }) {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  if (params?.kpi) sp.set('kpi', params.kpi);
  return useQuery<RmRankingEntry[]>({
    queryKey: ['rm-dashboard', 'ranking', params],
    queryFn: () => api<RmRankingEntry[]>(`/api/tools/rm-dashboard/ranking?${sp}`),
  });
}

export function useRmAlerts() {
  return useQuery<RmAlert[]>({
    queryKey: ['rm-dashboard', 'alerts'],
    queryFn: () => api<RmAlert[]>('/api/tools/rm-dashboard/alerts'),
  });
}

export function useRmTrends(params?: { weeks?: number }) {
  const sp = new URLSearchParams();
  if (params?.weeks) sp.set('weeks', String(params.weeks));
  return useQuery<RmTrend[]>({
    queryKey: ['rm-dashboard', 'trends', params],
    queryFn: () => api<RmTrend[]>(`/api/tools/rm-dashboard/trends?${sp}`),
  });
}

export function useRmStoreDetail(storeId?: string, params?: { period?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery<RmStoreDetail>({
    queryKey: ['rm-dashboard', 'store', storeId, params],
    queryFn: () => api<RmStoreDetail>(`/api/tools/rm-dashboard/store/${storeId}?${sp}`),
    enabled: !!storeId,
  });
}

export function useRmExport(params?: { period?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery<RmExportRow[]>({
    queryKey: ['rm-dashboard', 'export', params],
    queryFn: () => api<RmExportRow[]>(`/api/tools/rm-dashboard/export?${sp}`),
    enabled: false, // Only fetch on demand
  });
}
