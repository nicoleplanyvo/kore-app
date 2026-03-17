import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = '/api/tools/clienteling';

export function useClientelingStores() {
  return useQuery({ queryKey: ['clienteling', 'stores'], queryFn: () => api<any[]>(`${BASE}/stores`) });
}

export function useClientelingUsers() {
  return useQuery({ queryKey: ['clienteling', 'users'], queryFn: () => api<any[]>(`${BASE}/users`) });
}

export function useCustomers(params?: { storeId?: string; search?: string; vip?: boolean; vipLevel?: string; page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.search) sp.set('search', params.search);
  if (params?.vip) sp.set('vip', 'true');
  if (params?.vipLevel) sp.set('vipLevel', params.vipLevel);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  return useQuery({ queryKey: ['clienteling', 'customers', params], queryFn: () => api<any>(`${BASE}/customers?${sp}`) });
}

export function useCustomer(id?: string) {
  return useQuery({ queryKey: ['clienteling', 'customer', id], queryFn: () => api<any>(`${BASE}/customers/${id}`), enabled: !!id });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/customers`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`${BASE}/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`${BASE}/customers/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useAddInteraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, ...data }: any) => api<any>(`${BASE}/customers/${customerId}/interactions`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useAppointments(params?: { storeId?: string; from?: string; to?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  if (params?.status) sp.set('status', params.status);
  return useQuery({ queryKey: ['clienteling', 'appointments', params], queryFn: () => api<any[]>(`${BASE}/appointments?${sp}`) });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/appointments`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`${BASE}/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`${BASE}/appointments/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clienteling'] }); },
  });
}

export function useClientelingDashboard(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({ queryKey: ['clienteling', 'dashboard', storeId], queryFn: () => api<any>(`${BASE}/dashboard?${sp}`) });
}
