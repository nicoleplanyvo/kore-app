import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useMultiStoreStores() {
  return useQuery({ queryKey: ['multi-store', 'stores'], queryFn: () => api<any[]>('/api/tools/multi-store/stores') });
}

export function useMultiStoreOverview() {
  return useQuery({ queryKey: ['multi-store', 'overview'], queryFn: () => api<any[]>('/api/tools/multi-store/overview') });
}

export function useMultiStoreComparison(params?: { period?: string }) {
  const sp = new URLSearchParams();
  if (params?.period) sp.set('period', params.period);
  return useQuery({ queryKey: ['multi-store', 'comparison', params], queryFn: () => api<any[]>(`/api/tools/multi-store/comparison?${sp}`) });
}

export function useMultiStoreRanking(params?: { metric?: string }) {
  const sp = new URLSearchParams();
  if (params?.metric) sp.set('metric', params.metric);
  return useQuery({ queryKey: ['multi-store', 'ranking', params], queryFn: () => api<any[]>(`/api/tools/multi-store/ranking?${sp}`) });
}
