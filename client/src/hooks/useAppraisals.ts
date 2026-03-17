import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useAppraisalStores() {
  return useQuery({ queryKey: ['appraisals', 'stores'], queryFn: () => api<any[]>('/api/tools/appraisals/stores') });
}

export function useAppraisalUsers(storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  return useQuery({
    queryKey: ['appraisals', 'users', storeId],
    queryFn: () => api<any[]>(`/api/tools/appraisals/users${params}`),
  });
}

export function useAppraisalCategories() {
  return useQuery({ queryKey: ['appraisals', 'categories'], queryFn: () => api<string[]>('/api/tools/appraisals/categories') });
}

export function useAppraisals(params?: { page?: number; storeId?: string; status?: string; userId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.userId) sp.set('userId', params.userId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['appraisals', 'list', params],
    queryFn: () => api<{ data: any[]; total: number; page: number; pageSize: number }>(`/api/tools/appraisals/appraisals?${sp}`),
  });
}

export function useAppraisal(id?: string) {
  return useQuery({
    queryKey: ['appraisals', 'detail', id],
    queryFn: () => api<any>(`/api/tools/appraisals/appraisals/${id}`),
    enabled: !!id,
  });
}

export function useCreateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/appraisals/appraisals', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}

export function useUpdateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/appraisals/appraisals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}

export function useSubmitSelfAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, categories }: { id: string; categories: any[] }) =>
      api<any>(`/api/tools/appraisals/appraisals/${id}/self-assessment`, { method: 'POST', body: JSON.stringify({ categories }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}

export function useCompleteAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/appraisals/appraisals/${id}/complete`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}

export function useAppraisalDashboard(storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  return useQuery({
    queryKey: ['appraisals', 'dashboard', storeId],
    queryFn: () => api<any>(`/api/tools/appraisals/dashboard${params}`),
  });
}

// Legacy exports for backward compatibility
export function useAppraisalCycles() {
  return useQuery({ queryKey: ['appraisals', 'cycles'], queryFn: () => api<any[]>('/api/tools/appraisals/cycles').catch(() => []) });
}

export function useCreateAppraisalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/appraisals/cycles', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}
