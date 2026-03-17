import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useFrTrackingStores() {
  return useQuery({ queryKey: ['frt', 'stores'], queryFn: () => api<any[]>('/api/tools/fr-tracking/stores') });
}

export function useFrTrackingUsers() {
  return useQuery({ queryKey: ['frt', 'users'], queryFn: () => api<any[]>('/api/tools/fr-tracking/users') });
}

export function useFrTrackingSessions(page = 1, storeId?: string, from?: string, to?: string, staffId?: string) {
  return useQuery({
    queryKey: ['frt', 'sessions', page, storeId, from, to, staffId],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '30' });
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (staffId) params.set('staffId', staffId);
      return api<{ data: any[]; total: number }>(`/api/tools/fr-tracking/sessions?${params}`);
    },
  });
}

export function useFrTrackingAnalysis(storeId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['frt', 'analysis', storeId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<any>(`/api/tools/fr-tracking/analysis?${params}`);
    },
  });
}

export function useFrTrackingStaffPerformance(storeId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['frt', 'staff', storeId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<any>(`/api/tools/fr-tracking/staff-performance?${params}`);
    },
  });
}

export function useFrTrackingDashboard() {
  return useQuery({
    queryKey: ['frt', 'dashboard'],
    queryFn: () => api<any>('/api/tools/fr-tracking/dashboard'),
  });
}

// Legacy compat hooks
export function useFrStores() {
  return useQuery({ queryKey: ['fr', 'stores'], queryFn: () => api<any[]>('/api/tools/fr-tracking/stores') });
}

export function useFrEntries(page = 1, storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['fr', 'entries', page, storeId, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '30' });
      if (storeId) params.set('storeId', storeId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<{ data: any[]; total: number }>(`/api/tools/fr-tracking/entries?${params}`);
    },
  });
}

export function useUpsertFrEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/fr-tracking/entries', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr'] }); qc.invalidateQueries({ queryKey: ['frt'] }); },
  });
}

export function useFrSummary(storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['fr', 'summary', storeId, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      return api<any>(`/api/tools/fr-tracking/summary?${params}`);
    },
  });
}

export function useFrHourly(storeId?: string, date?: string) {
  return useQuery({
    queryKey: ['fr', 'hourly', storeId, date],
    queryFn: () => api<any[]>(`/api/tools/fr-tracking/hourly?storeId=${storeId}&date=${date}`),
    enabled: !!storeId && !!date,
  });
}

export function useFrTrends(storeId?: string, days = 30) {
  return useQuery({
    queryKey: ['fr', 'trends', storeId, days],
    queryFn: () => {
      const params = new URLSearchParams({ days: String(days) });
      if (storeId) params.set('storeId', storeId);
      return api<any[]>(`/api/tools/fr-tracking/trends?${params}`);
    },
  });
}
