import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserRole } from '../types';

// === Types ===

interface ReportingStore {
  id: string;
  name: string;
  city: string | null;
  isActive: boolean;
  users: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    assignedAt: string;
  }[];
}

interface ReportingRegion {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  stores: ReportingStore[];
}

interface ReportingManager {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stores: { id: string; name: string; city: string | null }[];
}

interface ReportingHierarchy {
  tenant: { id: string; name: string };
  regions: ReportingRegion[];
  stores: ReportingStore[];
  managers: ReportingManager[];
}

interface StoreListItem {
  id: string;
  tenantId: string;
  regionId: string | null;
  region: { id: string; name: string } | null;
  name: string;
  city: string | null;
  address: string | null;
  isActive: boolean;
  tenant: { id: string; name: string; slug: string };
  _count: { tools: number; userAssignments: number };
}

interface StoreUserAssignment {
  id: string;
  userId: string;
  storeId: string;
  assignedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

interface StoreUsersResponse {
  store: { id: string; name: string; tenantId: string };
  assignments: StoreUserAssignment[];
  availableUsers: { id: string; name: string; email: string; role: string }[];
}

// === Hooks ===

export function useOrgHierarchy(tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : '';
  return useQuery<ReportingHierarchy>({
    queryKey: ['reporting', 'hierarchy', tenantId ?? 'mine'],
    queryFn: () => api(`/api/admin/reporting/hierarchy${qs}`),
  });
}

export function useAdminStores(tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : '';
  return useQuery<StoreListItem[]>({
    queryKey: ['admin-stores', tenantId ?? 'all'],
    queryFn: () => api(`/api/admin/stores${qs}`),
  });
}

export function useAdminStoreUsers(storeId: string | undefined) {
  return useQuery<StoreUsersResponse>({
    queryKey: ['admin-stores', storeId, 'users'],
    queryFn: () => api(`/api/admin/stores/${storeId}/users`),
    enabled: !!storeId,
  });
}

export function useUpdateAdminStoreUsers(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api(`/api/admin/stores/${storeId}/users`, {
        method: 'PUT',
        body: JSON.stringify({ userIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-stores', storeId, 'users'] });
      qc.invalidateQueries({ queryKey: ['reporting'] });
    },
  });
}
