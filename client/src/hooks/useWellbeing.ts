import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ──────────────────────────────────────────

export function useWellbeingStores() {
  return useQuery({
    queryKey: ['wellbeing', 'stores'],
    queryFn: () => api<any[]>('/api/tools/wellbeing/stores'),
  });
}

// ── Check-Ins ───────────────────────────────────────

export function useWellbeingCheckIns(params?: { storeId?: string; from?: string; to?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({
    queryKey: ['wellbeing', 'checkins', params],
    queryFn: () => api<any>(`/api/tools/wellbeing/checkins?${sp}`),
  });
}

export function useCreateWellbeingCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>('/api/tools/wellbeing/checkins', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellbeing'] });
    },
  });
}

// ── Resources ───────────────────────────────────────

export function useWellbeingResources() {
  return useQuery({
    queryKey: ['wellbeing', 'resources'],
    queryFn: () => api<any[]>('/api/tools/wellbeing/resources'),
  });
}

export function useCreateWellbeingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>('/api/tools/wellbeing/resources', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellbeing'] });
    },
  });
}

export function useUpdateWellbeingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api<any>(`/api/tools/wellbeing/resources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellbeing'] });
    },
  });
}

export function useDeleteWellbeingResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/wellbeing/resources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wellbeing'] });
    },
  });
}

// ── Summary ─────────────────────────────────────────

export function useWellbeingSummary(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['wellbeing', 'summary', params],
    queryFn: () => api<any>(`/api/tools/wellbeing/summary?${sp}`),
  });
}

// ── Trends ──────────────────────────────────────────

export function useWellbeingTrends(params?: { storeId?: string; weeks?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.weeks) sp.set('weeks', String(params.weeks));
  return useQuery({
    queryKey: ['wellbeing', 'trends', params],
    queryFn: () => api<any[]>(`/api/tools/wellbeing/trends?${sp}`),
  });
}

// ── Dashboard ───────────────────────────────────────

export function useWellbeingDashboard(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['wellbeing', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/wellbeing/dashboard?${sp}`),
    enabled: true,
  });
}
