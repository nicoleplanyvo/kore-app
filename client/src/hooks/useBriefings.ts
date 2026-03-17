import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useBriefingStores() {
  return useQuery({ queryKey: ['briefings', 'stores'], queryFn: () => api<any[]>('/api/tools/briefings/stores') });
}

export function useBriefingUsers() {
  return useQuery({ queryKey: ['briefings', 'users'], queryFn: () => api<any[]>('/api/tools/briefings/users') });
}

export function useBriefings(params?: { storeId?: string; page?: number; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  sp.set('pageSize', '20');
  return useQuery({
    queryKey: ['briefings', 'list', params],
    queryFn: () => api<{ data: any[]; total: number; page: number; pageSize: number }>(`/api/tools/briefings?${sp}`),
  });
}

export function useBriefing(id?: string) {
  return useQuery({
    queryKey: ['briefings', 'detail', id],
    queryFn: () => api<any>(`/api/tools/briefings/${id}`),
    enabled: !!id,
  });
}

export function useBriefingCopyLast(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({
    queryKey: ['briefings', 'copy-last', storeId],
    queryFn: () => api<any>(`/api/tools/briefings/copy-last?${sp}`),
    enabled: false, // only fetch on demand
  });
}

export function useBriefingDashboard(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({
    queryKey: ['briefings', 'dashboard', storeId],
    queryFn: () => api<any>(`/api/tools/briefings/dashboard?${sp}`),
  });
}

export function useBriefingReaders(id?: string) {
  return useQuery({
    queryKey: ['briefings', 'readers', id],
    queryFn: () => api<any[]>(`/api/tools/briefings/${id}/readers`),
    enabled: !!id,
  });
}

export function useCreateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/briefings', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefings'] }); },
  });
}

export function useUpdateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/briefings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefings'] }); },
  });
}

export function useMarkBriefingRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/briefings/${id}/read`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefings'] }); },
  });
}
