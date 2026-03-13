import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { PaginatedResponse, AuthUser } from '@shared/types';
import type { UserCreateInput, UserUpdateInput } from '@shared/validators';

interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  tenant: { name: string } | null;
  storeAssignments: { storeId: string; store: { name: string } }[];
}

interface UserDetail extends UserListItem {
  updatedAt: string;
  tenant: { id: string; name: string } | null;
  storeAssignments: {
    id: string;
    storeId: string;
    assignedAt: string;
    store: { id: string; name: string; city: string | null };
  }[];
  regionAssignments: {
    id: string;
    regionId: string;
    assignedAt: string;
    region: { id: string; name: string };
  }[];
}

interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  tenantId?: string;
}

export function useUsers(params: UserListParams = {}) {
  const { page = 1, pageSize = 20, search, role, tenantId } = params;
  const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) qs.set('search', search);
  if (role) qs.set('role', role);
  if (tenantId) qs.set('tenantId', tenantId);

  return useQuery<PaginatedResponse<UserListItem>>({
    queryKey: ['users', params],
    queryFn: () => api(`/api/admin/users?${qs}`),
  });
}

export function useUser(id: string | undefined) {
  return useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: () => api(`/api/admin/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserCreateInput) =>
      api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UserUpdateInput) =>
      api(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useUpdateUserStores(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storeIds: string[]) =>
      api(`/api/admin/users/${id}/stores`, {
        method: 'PUT',
        body: JSON.stringify({ storeIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', id] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useImpersonate() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (userId: string) =>
      api<{ accessToken: string; user: AuthUser }>('/api/auth/impersonate', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}
