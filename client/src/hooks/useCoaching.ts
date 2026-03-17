import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = '/api/tools/coaching';

export function useCoachingStores() {
  return useQuery({ queryKey: ['coaching', 'stores'], queryFn: () => api<any[]>(`${BASE}/stores`) });
}

export function useCoachingUsers() {
  return useQuery({ queryKey: ['coaching', 'users'], queryFn: () => api<any[]>(`${BASE}/users`) });
}

export function useCoachingSessions(params?: { page?: number; pageSize?: number; storeId?: string; status?: string; coachId?: string; coacheeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.coachId) sp.set('coachId', params.coachId);
  if (params?.coacheeId) sp.set('coacheeId', params.coacheeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['coaching', 'sessions', params],
    queryFn: () => api<{ data: any[]; total: number; page: number; pageSize: number }>(`${BASE}/sessions?${sp}`),
  });
}

export function useCoachingSession(id?: string) {
  return useQuery({
    queryKey: ['coaching', 'session', id],
    queryFn: () => api<any>(`${BASE}/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCreateCoachingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/sessions`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching'] }); },
  });
}

export function useUpdateCoachingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`${BASE}/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching'] }); },
  });
}

export function useDeleteCoachingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`${BASE}/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching'] }); },
  });
}

export function useCoachingTemplates() {
  return useQuery({
    queryKey: ['coaching', 'templates'],
    queryFn: () => api<any[]>(`${BASE}/templates`),
  });
}

export function useCreateCoachingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/templates`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching', 'templates'] }); },
  });
}

export function useCoachingDashboard() {
  return useQuery({
    queryKey: ['coaching', 'dashboard'],
    queryFn: () => api<any>(`${BASE}/dashboard`),
  });
}
