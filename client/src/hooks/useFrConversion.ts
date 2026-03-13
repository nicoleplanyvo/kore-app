import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useConversionGoals(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({ queryKey: ['fr-conversion', 'goals', params], queryFn: () => api<any[]>(`/api/tools/fr-conversion/goals?${sp}`) });
}

export function useUpsertConversionGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/fr-conversion/goals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion'] }); },
  });
}

export function useConversionAnalysis(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({ queryKey: ['fr-conversion', 'analysis', params], queryFn: () => api<any>(`/api/tools/fr-conversion/analysis?${sp}`) });
}

export function useConversionComparison() {
  return useQuery({ queryKey: ['fr-conversion', 'comparison'], queryFn: () => api<any[]>('/api/tools/fr-conversion/comparison') });
}

export function useConversionTrends(params?: { storeId?: string; weeks?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.weeks) sp.set('weeks', String(params.weeks));
  return useQuery({ queryKey: ['fr-conversion', 'trends', params], queryFn: () => api<any[]>(`/api/tools/fr-conversion/trends?${sp}`) });
}
