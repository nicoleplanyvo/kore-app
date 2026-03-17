import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ──────────────────────────────────────────
export function useTrackTraceStores() {
  return useQuery({
    queryKey: ['track-trace', 'stores'],
    queryFn: () => api<any[]>('/api/tools/track-trace/stores'),
  });
}

// ── Orders: List ────────────────────────────────────
export function useOrders(params?: { storeId?: string; status?: string; type?: string; search?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.type) sp.set('type', params.type);
  if (params?.search) sp.set('search', params.search);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({
    queryKey: ['track-trace', 'orders', params],
    queryFn: () => api<any>(`/api/tools/track-trace/orders?${sp}`),
  });
}

// ── Orders: Detail ──────────────────────────────────
export function useOrder(id?: string) {
  return useQuery({
    queryKey: ['track-trace', 'order', id],
    queryFn: () => api<any>(`/api/tools/track-trace/orders/${id}`),
    enabled: !!id,
  });
}

// ── Orders: Create ──────────────────────────────────
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/track-trace/orders', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['track-trace'] }); },
  });
}

// ── Orders: Update ──────────────────────────────────
export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/track-trace/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['track-trace'] }); },
  });
}

// ── Orders: Add Status Update ───────────────────────
export function useAddOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, ...data }: any) => api<any>(`/api/tools/track-trace/orders/${orderId}/status`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['track-trace'] }); },
  });
}

// ── Summary ─────────────────────────────────────────
export function useOrdersSummary(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({
    queryKey: ['track-trace', 'summary', params],
    queryFn: () => api<any>(`/api/tools/track-trace/summary?${sp}`),
  });
}

// ── Dashboard ───────────────────────────────────────
export function useTrackTraceDashboard(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['track-trace', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/track-trace/dashboard?${sp}`),
    enabled: true,
  });
}
