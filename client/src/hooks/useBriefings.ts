import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useBriefings(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({ queryKey: ['briefings', params], queryFn: () => api<any[]>(`/api/tools/briefings?${sp}`) });
}

export function useBriefing(id?: string) {
  return useQuery({ queryKey: ['briefings', id], queryFn: () => api<any>(`/api/tools/briefings/${id}`), enabled: !!id });
}

export function useCreateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/briefings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefings'] }); },
  });
}

export function useUpdateBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/briefings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefings'] }); },
  });
}

export function useAcknowledgeBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/briefings/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['briefings'] }); },
  });
}

export function useBriefingReadRate() {
  return useQuery({ queryKey: ['briefings', 'read-rate'], queryFn: () => api<any>('/api/tools/briefings/reports/read-rate') });
}
