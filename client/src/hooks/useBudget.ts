import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useBudgetStores() {
  return useQuery({ queryKey: ['budget', 'stores'], queryFn: () => api<any[]>('/api/tools/budget/stores') });
}

export function useBudgetTargets(storeId?: string, period?: string) {
  return useQuery({
    queryKey: ['budget', 'targets', storeId, period],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (period) params.set('period', period);
      return api<any[]>(`/api/tools/budget/targets?${params}`);
    },
  });
}

export function useCreateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/budget/targets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

export function useImportTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/budget/targets/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

export function useBudgetActuals(storeId?: string, from?: string, to?: string, granularity?: string) {
  return useQuery({
    queryKey: ['budget', 'actuals', storeId, from, to, granularity],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (granularity) params.set('granularity', granularity);
      return api<any[]>(`/api/tools/budget/actuals?${params}`);
    },
    enabled: !!storeId,
  });
}

export function useCreateActual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/budget/actuals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

export function useUpdateActual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/budget/actuals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budget'] }); },
  });
}

export function useBudgetForecast(storeId?: string, month?: string) {
  return useQuery({
    queryKey: ['budget', 'forecast', storeId, month],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (month) params.set('month', month);
      return api<any>(`/api/tools/budget/forecast?${params}`);
    },
    enabled: !!storeId,
  });
}

export function useBudgetDashboard(month?: string) {
  return useQuery({
    queryKey: ['budget', 'dashboard', month],
    queryFn: () => {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      return api<any>(`/api/tools/budget/dashboard?${params}`);
    },
  });
}
