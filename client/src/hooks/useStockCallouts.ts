import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useStockCallouts(params?: { storeId?: string; status?: string; urgency?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.urgency) sp.set('urgency', params.urgency);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({ queryKey: ['stock-callouts', 'list', params], queryFn: () => api<any>(`/api/tools/stock-callouts/callouts?${sp}`) });
}

export function useStockCallout(id?: string) {
  return useQuery({ queryKey: ['stock-callouts', 'detail', id], queryFn: () => api<any>(`/api/tools/stock-callouts/callouts/${id}`), enabled: !!id });
}

export function useCreateStockCallout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/stock-callouts/callouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

export function useUpdateStockCallout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/stock-callouts/callouts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

export function useStockCalloutsSummary(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({ queryKey: ['stock-callouts', 'summary', params], queryFn: () => api<any>(`/api/tools/stock-callouts/summary?${sp}`) });
}
