import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ───────────────────────────────────────────────
export function useInventoryStores() {
  return useQuery({
    queryKey: ['inventory', 'stores'],
    queryFn: () => api<any[]>('/api/tools/inventory/stores'),
  });
}

// ── Users ────────────────────────────────────────────────
export function useInventoryUsers(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({
    queryKey: ['inventory', 'users', storeId],
    queryFn: () => api<any[]>(`/api/tools/inventory/users?${sp}`),
    enabled: !!storeId,
  });
}

// ── Counts List ──────────────────────────────────────────
export function useInventoryCounts(params?: {
  storeId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.type) sp.set('type', params.type);
  if (params?.status) sp.set('status', params.status);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({
    queryKey: ['inventory', 'counts', params],
    queryFn: () => api<{ data: any[]; total: number; page: number; pageSize: number }>(`/api/tools/inventory/counts?${sp}`),
  });
}

// ── Count Detail ─────────────────────────────────────────
export function useInventoryCount(id?: string) {
  return useQuery({
    queryKey: ['inventory', 'count', id],
    queryFn: () => api<any>(`/api/tools/inventory/counts/${id}`),
    enabled: !!id,
  });
}

// ── Create Count ─────────────────────────────────────────
export function useCreateInventoryCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>('/api/tools/inventory/counts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Update Count ─────────────────────────────────────────
export function useUpdateInventoryCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api<any>(`/api/tools/inventory/counts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Upsert Item ──────────────────────────────────────────
export function useUpsertItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ countId, ...data }: any) =>
      api<any>(`/api/tools/inventory/counts/${countId}/items`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Batch Import Items ───────────────────────────────────
export function useBatchImportItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ countId, items }: { countId: string; items: any[] }) =>
      api<any>(`/api/tools/inventory/counts/${countId}/items/batch`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Complete Count ───────────────────────────────────────
export function useCompleteCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/inventory/counts/${id}/complete`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Approve Count ────────────────────────────────────────
export function useApproveCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/inventory/counts/${id}/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Cancel Count ─────────────────────────────────────────
export function useCancelCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/inventory/counts/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ── Dashboard ────────────────────────────────────────────
export function useInventoryDashboard(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['inventory', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/inventory/dashboard?${sp}`),
  });
}
