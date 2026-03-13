import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useShiftTemplates(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({ queryKey: ['shift', 'templates', storeId], queryFn: () => api<any[]>(`/api/tools/shift-planning/templates?${sp}`) });
}

export function useCreateShiftTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/shift-planning/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function useShiftEntries(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({ queryKey: ['shift', 'entries', params], queryFn: () => api<any[]>(`/api/tools/shift-planning/entries?${sp}`) });
}

export function useCreateShiftEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/shift-planning/entries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function useUpdateShiftEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/shift-planning/entries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}
