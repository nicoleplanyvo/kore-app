import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ───────────────────────────────────────────
export function useStockCalloutStores() {
  return useQuery({ queryKey: ['stock-callouts', 'stores'], queryFn: () => api<any[]>('/api/tools/stock-callouts/stores') });
}

// ── Users ────────────────────────────────────────────
export function useStockCalloutUsers() {
  return useQuery({ queryKey: ['stock-callouts', 'users'], queryFn: () => api<any[]>('/api/tools/stock-callouts/users') });
}

// ── Callouts ─────────────────────────────────────────
export function useStockCallouts(params?: { storeId?: string; status?: string; urgency?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.urgency) sp.set('urgency', params.urgency);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({
    queryKey: ['stock-callouts', 'list', params],
    queryFn: () => api<any>(`/api/tools/stock-callouts/callouts?${sp}`),
  });
}

export function useStockCallout(id?: string) {
  return useQuery({
    queryKey: ['stock-callouts', 'detail', id],
    queryFn: () => api<any>(`/api/tools/stock-callouts/callouts/${id}`),
    enabled: !!id,
  });
}

export function useCreateStockCallout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/stock-callouts/callouts', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

export function useUpdateStockCallout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/stock-callouts/callouts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

// ── Workflow Actions ─────────────────────────────────
export function useOfferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/stock-callouts/callouts/${id}/offer`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

export function useConfirmTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/stock-callouts/callouts/${id}/transfer`, { method: 'PUT' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

export function useResolveCallout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/stock-callouts/callouts/${id}/resolve`, { method: 'PUT' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['stock-callouts'] }); },
  });
}

// ── Summary ──────────────────────────────────────────
export function useStockCalloutsSummary(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({
    queryKey: ['stock-callouts', 'summary', params],
    queryFn: () => api<any>(`/api/tools/stock-callouts/summary?${sp}`),
  });
}

// ── Dashboard ────────────────────────────────────────
export function useStockCalloutsDashboard(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['stock-callouts', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/stock-callouts/dashboard?${sp}`),
  });
}

// ── Board (Schwarzes Brett) ──────────────────────────
export function useStockBoard(params?: { sku?: string }) {
  const sp = new URLSearchParams();
  if (params?.sku) sp.set('sku', params.sku);
  return useQuery({
    queryKey: ['stock-callouts', 'board', params],
    queryFn: () => api<any[]>(`/api/tools/stock-callouts/board?${sp}`),
  });
}
