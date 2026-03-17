import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ──────────────────────────────────────────
export function usePdpStores() {
  return useQuery({
    queryKey: ['pdp-pip', 'stores'],
    queryFn: () => api<any[]>('/api/tools/pdp-pip/stores'),
  });
}

// ── Users ───────────────────────────────────────────
export function usePdpUsers() {
  return useQuery({
    queryKey: ['pdp-pip', 'users'],
    queryFn: () => api<any[]>('/api/tools/pdp-pip/users'),
  });
}

// ── Plans — List ────────────────────────────────────
export function useDevelopmentPlans(params?: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
  storeId?: string;
  userId?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.type) sp.set('type', params.type);
  if (params?.status) sp.set('status', params.status);
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.userId) sp.set('userId', params.userId);
  return useQuery({
    queryKey: ['pdp-pip', 'plans', params],
    queryFn: () => api<any>(`/api/tools/pdp-pip/plans?${sp}`),
  });
}

// ── Plans — Detail ──────────────────────────────────
export function useDevelopmentPlan(id?: string) {
  return useQuery({
    queryKey: ['pdp-pip', 'plan', id],
    queryFn: () => api<any>(`/api/tools/pdp-pip/plans/${id}`),
    enabled: !!id,
  });
}

// ── Plans — Create ──────────────────────────────────
export function useCreateDevelopmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>('/api/tools/pdp-pip/plans', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdp-pip'] });
    },
  });
}

// ── Plans — Update ──────────────────────────────────
export function useUpdateDevelopmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api<any>(`/api/tools/pdp-pip/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdp-pip'] });
    },
  });
}

// ── Goals — Create ──────────────────────────────────
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...data }: any) =>
      api<any>(`/api/tools/pdp-pip/plans/${planId}/goals`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdp-pip'] });
    },
  });
}

// ── Goals — Update ──────────────────────────────────
export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, goalId, ...data }: any) =>
      api<any>(`/api/tools/pdp-pip/plans/${planId}/goals/${goalId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdp-pip'] });
    },
  });
}

// ── Goals — Delete ──────────────────────────────────
export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, goalId }: { planId: string; goalId: string }) =>
      api<any>(`/api/tools/pdp-pip/plans/${planId}/goals/${goalId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdp-pip'] });
    },
  });
}

// ── Reviews — Create ────────────────────────────────
export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...data }: any) =>
      api<any>(`/api/tools/pdp-pip/plans/${planId}/reviews`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pdp-pip'] });
    },
  });
}

// ── Dashboard ───────────────────────────────────────
export function usePdpDashboard(params?: { storeId?: string; type?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.type) sp.set('type', params.type);
  return useQuery({
    queryKey: ['pdp-pip', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/pdp-pip/dashboard?${sp}`),
  });
}
