import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useOrders(params?: { storeId?: string; status?: string; search?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({ queryKey: ['track-trace', 'orders', params], queryFn: () => api<any>(`/api/tools/track-trace/orders?${sp}`) });
}

export function useOrder(id?: string) {
  return useQuery({ queryKey: ['track-trace', 'order', id], queryFn: () => api<any>(`/api/tools/track-trace/orders/${id}`), enabled: !!id });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/track-trace/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['track-trace'] }); },
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/track-trace/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['track-trace'] }); },
  });
}

export function useAddOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...data }: any) => api<any>(`/api/tools/track-trace/orders/${orderId}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['track-trace'] }); },
  });
}

export function useOrdersSummary(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({ queryKey: ['track-trace', 'summary', params], queryFn: () => api<any>(`/api/tools/track-trace/summary?${sp}`) });
}
