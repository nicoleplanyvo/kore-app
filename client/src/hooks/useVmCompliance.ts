import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useVmComplianceStores() {
  return useQuery({ queryKey: ['vmc', 'stores'], queryFn: () => api<any[]>('/api/tools/vm-compliance/stores') });
}

export function useVmComplianceGuidelines() {
  return useQuery({ queryKey: ['vmc', 'guidelines'], queryFn: () => api<any[]>('/api/tools/vm-compliance/guidelines') });
}

export function useVmComplianceChecks(page = 1, storeId?: string, status?: string) {
  return useQuery({
    queryKey: ['vmc', 'checks', page, storeId, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      if (status) params.set('status', status);
      return api<{ data: any[]; total: number }>(`/api/tools/vm-compliance/checks?${params}`);
    },
  });
}

export function useVmComplianceCheck(id?: string) {
  return useQuery({
    queryKey: ['vmc', 'check', id],
    queryFn: () => api<any>(`/api/tools/vm-compliance/checks/${id}`),
    enabled: !!id,
  });
}

export function useSubmitVmCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => apiUpload<any>('/api/tools/vm-compliance/checks', formData),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vmc'] }); },
  });
}

export function useReviewVmCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/vm-compliance/checks/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vmc'] }); },
  });
}

export function useVmComplianceDashboard() {
  return useQuery({
    queryKey: ['vmc', 'dashboard'],
    queryFn: () => api<any>('/api/tools/vm-compliance/dashboard'),
  });
}
