import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useDevelopmentPlans(params?: { page?: number; pageSize?: number; type?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.type) sp.set('type', params.type);
  if (params?.status) sp.set('status', params.status);
  return useQuery({ queryKey: ['pdp-pip', 'plans', params], queryFn: () => api<any>(`/api/tools/pdp-pip/plans?${sp}`) });
}

export function useDevelopmentPlan(id?: string) {
  return useQuery({ queryKey: ['pdp-pip', 'plan', id], queryFn: () => api<any>(`/api/tools/pdp-pip/plans/${id}`), enabled: !!id });
}

export function useCreateDevelopmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/pdp-pip/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pdp-pip'] }); },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...data }: any) => api<any>(`/api/tools/pdp-pip/plans/${planId}/goals`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pdp-pip'] }); },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, goalId, ...data }: any) => api<any>(`/api/tools/pdp-pip/plans/${planId}/goals/${goalId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pdp-pip'] }); },
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...data }: any) => api<any>(`/api/tools/pdp-pip/plans/${planId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pdp-pip'] }); },
  });
}
