import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useCoachingSessions(params?: { page?: number; pageSize?: number; storeId?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  return useQuery({ queryKey: ['coaching', 'sessions', params], queryFn: () => api<any>(`/api/tools/coaching/sessions?${sp}`) });
}

export function useCoachingSession(id?: string) {
  return useQuery({ queryKey: ['coaching', 'session', id], queryFn: () => api<any>(`/api/tools/coaching/sessions/${id}`), enabled: !!id });
}

export function useCreateCoachingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/coaching/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching'] }); },
  });
}

export function useUpdateCoachingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/coaching/sessions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['coaching'] }); },
  });
}
