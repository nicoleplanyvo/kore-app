import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useLossStores() {
  return useQuery({ queryKey: ['loss', 'stores'], queryFn: () => api<any[]>('/api/tools/loss-prevention/stores') });
}

export function useLossIncidents(page = 1, storeId?: string, status?: string, category?: string) {
  return useQuery({
    queryKey: ['loss', 'incidents', page, storeId, status, category],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      return api<{ data: any[]; total: number }>(`/api/tools/loss-prevention/incidents?${params}`);
    },
  });
}

export function useLossIncident(id: string) {
  return useQuery({
    queryKey: ['loss', 'incident', id],
    queryFn: () => api<any>(`/api/tools/loss-prevention/incidents/${id}`),
    enabled: !!id,
  });
}

export function useLossSummary() {
  return useQuery({
    queryKey: ['loss', 'summary'],
    queryFn: () => api<any>('/api/tools/loss-prevention/summary'),
  });
}
