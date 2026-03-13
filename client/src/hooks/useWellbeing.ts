import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useWellbeingCheckIns(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({ queryKey: ['wellbeing', 'checkins', params], queryFn: () => api<any[]>(`/api/tools/wellbeing/checkins?${sp}`) });
}

export function useCreateWellbeingCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/wellbeing/checkins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wellbeing'] }); },
  });
}

export function useWellbeingResources() {
  return useQuery({ queryKey: ['wellbeing', 'resources'], queryFn: () => api<any[]>('/api/tools/wellbeing/resources') });
}

export function useCreateWellbeingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/wellbeing/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wellbeing'] }); },
  });
}

export function useUpdateWellbeingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/wellbeing/resources/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['wellbeing'] }); },
  });
}

export function useWellbeingSummary(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({ queryKey: ['wellbeing', 'summary', params], queryFn: () => api<any>(`/api/tools/wellbeing/summary?${sp}`) });
}

export function useWellbeingTrends(params?: { storeId?: string; weeks?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.weeks) sp.set('weeks', String(params.weeks));
  return useQuery({ queryKey: ['wellbeing', 'trends', params], queryFn: () => api<any[]>(`/api/tools/wellbeing/trends?${sp}`) });
}
