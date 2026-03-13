import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useRmStores() {
  return useQuery({ queryKey: ['rm-dashboard', 'stores'], queryFn: () => api<any[]>('/api/tools/rm-dashboard/stores') });
}

export function useRmSummary() {
  return useQuery({ queryKey: ['rm-dashboard', 'summary'], queryFn: () => api<any>('/api/tools/rm-dashboard/summary') });
}

export function useRmAlerts() {
  return useQuery({ queryKey: ['rm-dashboard', 'alerts'], queryFn: () => api<any[]>('/api/tools/rm-dashboard/alerts') });
}

export function useRmTrends(params?: { weeks?: number }) {
  const sp = new URLSearchParams();
  if (params?.weeks) sp.set('weeks', String(params.weeks));
  return useQuery({ queryKey: ['rm-dashboard', 'trends', params], queryFn: () => api<any[]>(`/api/tools/rm-dashboard/trends?${sp}`) });
}
