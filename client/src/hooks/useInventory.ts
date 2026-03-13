import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useInventoryStores() {
  return useQuery({ queryKey: ['inventory', 'stores'], queryFn: () => api<any[]>('/api/tools/inventory/stores') });
}

export function useInventoryCounts(page = 1, storeId?: string, status?: string) {
  return useQuery({
    queryKey: ['inventory', 'counts', page, storeId, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      if (status) params.set('status', status);
      return api<{ data: any[]; total: number }>(`/api/tools/inventory/counts?${params}`);
    },
  });
}

export function useInventoryCount(id: string) {
  return useQuery({
    queryKey: ['inventory', 'count', id],
    queryFn: () => api<any>(`/api/tools/inventory/counts/${id}`),
    enabled: !!id,
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: () => api<any>('/api/tools/inventory/summary'),
  });
}
