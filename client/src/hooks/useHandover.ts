import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useHandovers(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({ queryKey: ['handover', params], queryFn: () => api<any[]>(`/api/tools/handover?${sp}`) });
}

export function useHandover(id?: string) {
  return useQuery({ queryKey: ['handover', id], queryFn: () => api<any>(`/api/tools/handover/${id}`), enabled: !!id });
}

export function useCreateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/handover', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['handover'] }); },
  });
}

export function useUpdateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/handover/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['handover'] }); },
  });
}

export function useAcknowledgeHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/handover/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['handover'] }); },
  });
}
