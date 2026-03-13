import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Tenant, DashboardStats, PaginatedResponse, TenantListParams } from '@shared/types';
import type { TenantCreateInput, TenantUpdateInput } from '@shared/validators';

export function useTenants(params: TenantListParams = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);

  const qs = query.toString();

  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => api<PaginatedResponse<Tenant>>(`/api/admin/tenants${qs ? `?${qs}` : ''}`),
  });
}

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: ['tenants', id],
    queryFn: () => api<Tenant>(`/api/admin/tenants/${id}`),
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['tenants', 'stats'],
    queryFn: () => api<DashboardStats>('/api/admin/tenants/stats'),
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantCreateInput) =>
      api<Tenant>('/api/admin/tenants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantUpdateInput) =>
      api<Tenant>(`/api/admin/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/tenants/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}
