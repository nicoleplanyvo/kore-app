import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// --- Stores ---
export function useHandoverStores() {
  return useQuery({
    queryKey: ['handover', 'stores'],
    queryFn: () => api<Array<{ id: string; name: string; city: string | null }>>('/api/tools/handover/stores'),
  });
}

// --- Users for a store ---
export function useHandoverUsers(storeId?: string) {
  return useQuery({
    queryKey: ['handover', 'users', storeId],
    queryFn: () =>
      api<Array<{ id: string; name: string; email: string; role: string }>>(
        `/api/tools/handover/users?storeId=${storeId}`
      ),
    enabled: !!storeId,
  });
}

// --- List handovers with filters ---
export function useHandovers(params?: {
  storeId?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));

  return useQuery({
    queryKey: ['handover', 'list', params],
    queryFn: () => api<{ data: any[]; total: number; page: number; pageSize: number }>(`/api/tools/handover?${sp}`),
  });
}

// --- Single handover ---
export function useHandover(id?: string) {
  return useQuery({
    queryKey: ['handover', 'detail', id],
    queryFn: () => api<any>(`/api/tools/handover/${id}`),
    enabled: !!id,
  });
}

// --- Create ---
export function useCreateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>('/api/tools/handover', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['handover'] });
    },
  });
}

// --- Update ---
export function useUpdateHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api<any>(`/api/tools/handover/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['handover'] });
    },
  });
}

// --- Submit (DRAFT -> SUBMITTED) ---
export function useSubmitHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/handover/${id}/submit`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['handover'] });
    },
  });
}

// --- Acknowledge ---
export function useAcknowledgeHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/handover/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['handover'] });
    },
  });
}

// --- Dashboard ---
export function useHandoverDashboard(params?: {
  storeId?: string;
  from?: string;
  to?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);

  return useQuery({
    queryKey: ['handover', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/handover/dashboard?${sp}`),
  });
}
