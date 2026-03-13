import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StoreCreateInput } from '@shared/validators';

interface StoreTenant {
  id: string;
  name: string;
  slug: string;
}

interface StoreListItem {
  id: string;
  tenantId: string;
  name: string;
  city: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant: StoreTenant;
  _count: { tools: number };
}

interface ToolDef {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  priceMonthly: number;
  isActive: boolean;
  sortOrder: number;
}

interface StoreToolAssignment {
  id: string;
  storeId: string;
  toolId: string;
  tool: ToolDef;
  isActive: boolean;
  assignedAt: string;
}

interface StoreDetail {
  id: string;
  tenantId: string;
  name: string;
  city: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant: StoreTenant;
  tools: StoreToolAssignment[];
}

interface StoreToolsResponse {
  store: { id: string; name: string; tenantId: string };
  tools: (ToolDef & { assigned: boolean })[];
}

export function useStores(tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : '';
  return useQuery<StoreListItem[]>({
    queryKey: ['stores', tenantId ?? 'all'],
    queryFn: () => api(`/api/admin/stores${qs}`),
  });
}

export function useStore(id: string | undefined) {
  return useQuery<StoreDetail>({
    queryKey: ['stores', id],
    queryFn: () => api(`/api/admin/stores/${id}`),
    enabled: !!id,
  });
}

export function useStoreTools(storeId: string | undefined) {
  return useQuery<StoreToolsResponse>({
    queryKey: ['stores', storeId, 'tools'],
    queryFn: () => api(`/api/admin/stores/${storeId}/tools`),
    enabled: !!storeId,
  });
}

export function useCreateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: StoreCreateInput) =>
      api('/api/admin/stores', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

// === Store-User Assignments ===

interface StoreUserAssignmentItem {
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
  assignments: StoreUserAssignmentItem[];
  availableUsers: { id: string; name: string; email: string; role: string }[];
}

export function useStoreUsers(storeId: string | undefined) {
  return useQuery<StoreUsersResponse>({
    queryKey: ['stores', storeId, 'users'],
    queryFn: () => api(`/api/admin/stores/${storeId}/users`),
    enabled: !!storeId,
  });
}

export function useUpdateStoreUsers(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userIds: string[]) =>
      api(`/api/admin/stores/${storeId}/users`, {
        method: 'PUT',
        body: JSON.stringify({ userIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores', storeId, 'users'] });
      qc.invalidateQueries({ queryKey: ['stores', storeId] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// === Store-Tool Assignments ===

export function useAssignStoreTool(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) =>
      api(`/api/admin/stores/${storeId}/tools/assign`, {
        method: 'POST',
        body: JSON.stringify({ toolId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}

export function useUnassignStoreTool(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) =>
      api(`/api/admin/stores/${storeId}/tools/unassign`, {
        method: 'POST',
        body: JSON.stringify({ toolId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['tools'] });
    },
  });
}
