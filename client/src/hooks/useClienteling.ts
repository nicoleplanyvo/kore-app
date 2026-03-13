import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useClients(params?: { storeId?: string; search?: string; vipLevel?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.search) sp.set('search', params.search);
  if (params?.vipLevel) sp.set('vipLevel', params.vipLevel);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({ queryKey: ['clienteling', 'clients', params], queryFn: () => api<any>(`/api/tools/clienteling/clients?${sp}`) });
}

export function useClient(id?: string) {
  return useQuery({ queryKey: ['clienteling', 'client', id], queryFn: () => api<any>(`/api/tools/clienteling/clients/${id}`), enabled: !!id });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/clienteling/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/clienteling/clients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useAddInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, ...data }: any) => api<any>(`/api/tools/clienteling/clients/${clientId}/interactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useAddClientTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, ...data }: any) => api<any>(`/api/tools/clienteling/clients/${clientId}/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useClientelingSummary(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({ queryKey: ['clienteling', 'summary', params], queryFn: () => api<any>(`/api/tools/clienteling/reports/summary?${sp}`) });
}
