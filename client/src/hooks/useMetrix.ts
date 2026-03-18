import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useMetrixStores() {
  return useQuery({ queryKey: ['metrix', 'stores'], queryFn: () => api<any[]>('/api/tools/metrix/stores') });
}

export function useMetrixConfigs(storeId?: string) {
  return useQuery({
    queryKey: ['metrix', 'configs', storeId],
    queryFn: () => api<any[]>(`/api/tools/metrix/configs?storeId=${storeId}`),
    enabled: !!storeId,
  });
}

export function useMetrixConfig(id?: string) {
  return useQuery({
    queryKey: ['metrix', 'config', id],
    queryFn: () => api<any>(`/api/tools/metrix/configs/${id}`),
    enabled: !!id,
  });
}

export function useCreateMetrixConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/metrix/configs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metrix'] }); },
  });
}

export function useUpdateMetrixConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/metrix/configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metrix'] }); },
  });
}

export function useDeleteMetrixConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/metrix/configs/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metrix'] }); },
  });
}

export function useMetrixEntries(configId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['metrix', 'entries', configId, from, to],
    queryFn: () => {
      const p = new URLSearchParams();
      if (configId) p.set('configId', configId);
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      return api<any[]>(`/api/tools/metrix/entries?${p}`);
    },
    enabled: !!configId,
  });
}

export function useMetrixEntry(id?: string) {
  return useQuery({
    queryKey: ['metrix', 'entry', id],
    queryFn: () => api<any>(`/api/tools/metrix/entries/${id}`),
    enabled: !!id,
  });
}

export function useSubmitMetrixEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/metrix/entries', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['metrix'] }); },
  });
}

export function useMetrixDashboard(configId?: string) {
  return useQuery({
    queryKey: ['metrix', 'dashboard', configId],
    queryFn: () => api<any>(`/api/tools/metrix/dashboard?configId=${configId}`),
    enabled: !!configId,
  });
}

export function useMetrixCompare(period?: string) {
  return useQuery({
    queryKey: ['metrix', 'compare', period],
    queryFn: () => {
      const p = new URLSearchParams();
      if (period) p.set('period', period);
      return api<any>(`/api/tools/metrix/compare?${p}`);
    },
  });
}
