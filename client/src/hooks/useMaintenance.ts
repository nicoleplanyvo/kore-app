import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useMaintenanceStores() {
  return useQuery({ queryKey: ['maint', 'stores'], queryFn: () => api<any[]>('/api/tools/maintenance/stores') });
}

export function useMaintenanceRequests(page = 1, storeId?: string, status?: string, category?: string, priority?: string) {
  return useQuery({
    queryKey: ['maint', 'requests', page, storeId, status, category, priority],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (priority) params.set('priority', priority);
      return api<{ data: any[]; total: number }>(`/api/tools/maintenance/requests?${params}`);
    },
  });
}

export function useMaintenanceRequest(id?: string) {
  return useQuery({
    queryKey: ['maint', 'request', id],
    queryFn: () => api<any>(`/api/tools/maintenance/requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/maintenance/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maint'] }); },
  });
}

export function useUpdateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/maintenance/requests/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maint'] }); },
  });
}

export function useMaintenanceSummary(storeId?: string) {
  return useQuery({
    queryKey: ['maint', 'summary', storeId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      return api<any>(`/api/tools/maintenance/summary?${params}`);
    },
  });
}
