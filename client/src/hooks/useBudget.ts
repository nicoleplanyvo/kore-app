import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useBudgetStores() {
  return useQuery({ queryKey: ['budget', 'stores'], queryFn: () => api<any[]>('/api/tools/budget/stores') });
}

export function useBudgetPeriods(page = 1, storeId?: string) {
  return useQuery({
    queryKey: ['budget', 'periods', page, storeId],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      return api<{ data: any[]; total: number }>(`/api/tools/budget/periods?${params}`);
    },
  });
}

export function useBudgetPeriod(id: string) {
  return useQuery({
    queryKey: ['budget', 'period', id],
    queryFn: () => api<any>(`/api/tools/budget/periods/${id}`),
    enabled: !!id,
  });
}

export function useBudgetSummary(period?: string) {
  return useQuery({
    queryKey: ['budget', 'summary', period],
    queryFn: () => {
      const params = new URLSearchParams();
      if (period) params.set('period', period);
      return api<any>(`/api/tools/budget/summary?${params}`);
    },
  });
}
