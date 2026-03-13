import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Training Hours ─────────────────────────────────

export function useTrainingStores() {
  return useQuery({ queryKey: ['training-hours', 'stores'], queryFn: () => api<any[]>('/api/tools/training-hours/stores') });
}

export function useTrainingLogs(params?: { page?: number; pageSize?: number; storeId?: string; category?: string; userId?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.category) sp.set('category', params.category);
  if (params?.userId) sp.set('userId', params.userId);
  return useQuery({
    queryKey: ['training-hours', 'logs', params],
    queryFn: () => api<any>(`/api/tools/training-hours/logs?${sp}`),
  });
}

export function useCreateTrainingLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/training-hours/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hours'] }); },
  });
}

export function useUpdateTrainingLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/training-hours/logs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hours'] }); },
  });
}

export function useTrainingSummary(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({
    queryKey: ['training-hours', 'summary', storeId],
    queryFn: () => api<any>(`/api/tools/training-hours/summary?${sp}`),
  });
}
