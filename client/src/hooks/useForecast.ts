import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types ───────────────────────────────────────────

interface ForecastStore {
  id: string;
  name: string;
  city: string | null;
}

interface ForecastUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ForecastEntry {
  id: string;
  tenantId: string;
  storeId: string;
  period: string;
  forecastType: string;
  forecastValue: number;
  actualValue: number | null;
  confidence: number | null;
  method: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  store?: ForecastStore;
  deviation: number | null;
  accuracy: number | null;
}

interface ForecastListResponse {
  data: ForecastEntry[];
  total: number;
  page: number;
  pageSize: number;
}

interface ForecastDashboard {
  totalForecasts: number;
  withActuals: number;
  avgAccuracy: number;
  bestStore: { name: string; accuracy: number };
  worstStore: { name: string; accuracy: number };
  trendData: { period: string; forecast: number; actual: number; count: number }[];
  accuracyByUser: { userId: string; userName: string; avgAccuracy: number; count: number }[];
}

interface ForecastAccuracyReport {
  forecasts: any[];
  byStore: { storeId: string; storeName: string; avgAccuracy: number; count: number }[];
  averageAccuracy: number;
}

interface ForecastFilters {
  storeId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

interface DashboardFilters {
  storeId?: string;
  from?: string;
  to?: string;
}

// ─── Hooks ───────────────────────────────────────────

export function useForecastStores() {
  return useQuery<ForecastStore[]>({
    queryKey: ['forecast', 'stores'],
    queryFn: () => api<ForecastStore[]>('/api/tools/forecast/stores'),
  });
}

export function useForecastUsers(storeId?: string) {
  return useQuery<ForecastUser[]>({
    queryKey: ['forecast', 'users', storeId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      return api<ForecastUser[]>(`/api/tools/forecast/users?${params}`);
    },
  });
}

export function useForecasts(filters: ForecastFilters = {}) {
  const { storeId, type, from, to, page = 1, pageSize = 20 } = filters;
  return useQuery<ForecastListResponse>({
    queryKey: ['forecast', 'list', storeId, type, from, to, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (storeId) params.set('storeId', storeId);
      if (type) params.set('forecastType', type);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<ForecastListResponse>(`/api/tools/forecast?${params}`);
    },
  });
}

export function useForecast(id?: string) {
  return useQuery<ForecastEntry>({
    queryKey: ['forecast', 'detail', id],
    queryFn: () => api<ForecastEntry>(`/api/tools/forecast/${id}`),
    enabled: !!id,
  });
}

export function useCreateForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      storeId: string;
      period: string;
      forecastType: string;
      forecastValue: number;
      confidence?: number;
      method?: string;
      notes?: string;
    }) =>
      api<ForecastEntry>('/api/tools/forecast', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forecast'] });
    },
  });
}

export function useUpdateForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; forecastValue?: number; actualValue?: number; confidence?: number; notes?: string }) =>
      api<ForecastEntry>(`/api/tools/forecast/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forecast'] });
    },
  });
}

export function useDeleteForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ success: boolean }>(`/api/tools/forecast/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forecast'] });
    },
  });
}

export function useForecastDashboard(filters: DashboardFilters = {}) {
  const { storeId, from, to } = filters;
  return useQuery<ForecastDashboard>({
    queryKey: ['forecast', 'dashboard', storeId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<ForecastDashboard>(`/api/tools/forecast/dashboard?${params}`);
    },
  });
}

export function useForecastAccuracy(filters: DashboardFilters = {}) {
  const { storeId, from, to } = filters;
  return useQuery<ForecastAccuracyReport>({
    queryKey: ['forecast', 'accuracy', storeId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<ForecastAccuracyReport>(`/api/tools/forecast/reports/accuracy?${params}`);
    },
  });
}
