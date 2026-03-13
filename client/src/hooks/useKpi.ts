import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useKpiStores() {
  return useQuery({ queryKey: ['kpi', 'stores'], queryFn: () => api<any[]>('/api/tools/kpi/stores') });
}

export function useKpiEntries(page = 1, storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['kpi', 'entries', page, storeId, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '30' });
      if (storeId) params.set('storeId', storeId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<{ data: any[]; total: number }>(`/api/tools/kpi/entries?${params}`);
    },
  });
}

export function useKpiSummary(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['kpi', 'summary', dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<any>(`/api/tools/kpi/summary?${params}`);
    },
  });
}

export function useKpiTrends(storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['kpi', 'trends', storeId, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<any[]>(`/api/tools/kpi/trends?${params}`);
    },
  });
}
