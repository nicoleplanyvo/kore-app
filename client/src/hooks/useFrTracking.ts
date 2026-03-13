import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useFrStores() {
  return useQuery({ queryKey: ['fr', 'stores'], queryFn: () => api<any[]>('/api/tools/fr-tracking/stores') });
}

export function useFrEntries(page = 1, storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['fr', 'entries', page, storeId, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '30' });
      if (storeId) params.set('storeId', storeId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<{ data: any[]; total: number }>(`/api/tools/fr-tracking/entries?${params}`);
    },
  });
}

export function useUpsertFrEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/fr-tracking/entries', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr'] }); },
  });
}

export function useFrSummary(storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['fr', 'summary', storeId, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<any>(`/api/tools/fr-tracking/summary?${params}`);
    },
  });
}

export function useFrHourly(storeId?: string, date?: string) {
  return useQuery({
    queryKey: ['fr', 'hourly', storeId, date],
    queryFn: () => api<any[]>(`/api/tools/fr-tracking/hourly?storeId=${storeId}&date=${date}`),
    enabled: !!storeId && !!date,
  });
}

export function useFrTrends(storeId?: string, days = 30) {
  return useQuery({
    queryKey: ['fr', 'trends', storeId, days],
    queryFn: () => {
      const params = new URLSearchParams({ days: String(days) });
      if (storeId) params.set('storeId', storeId);
      return api<any[]>(`/api/tools/fr-tracking/trends?${params}`);
    },
  });
}
