import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ───────────────────────────────────────────

interface MaintenanceStore {
  id: string;
  name: string;
  city: string | null;
}

interface MaintenanceUser {
  id: string;
  name: string;
  role: string;
}

interface MaintenanceRequest {
  id: string;
  tenantId: string;
  storeId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  reportedBy: string;
  assignedTo: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  photoPath: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  store?: { id: string; name: string; city?: string | null };
  reporter?: { id: string; name: string };
  assignee?: { id: string; name: string } | null;
}

interface MaintenanceListResponse {
  data: MaintenanceRequest[];
  total: number;
  page: number;
  pageSize: number;
}

interface MaintenanceSummary {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  totalEstimatedCost: number;
  totalActualCost: number;
}

interface MaintenanceDashboard {
  kpis: {
    total: number;
    open: number;
    resolved: number;
    overdueCount: number;
    avgResolutionHours: number;
    totalEstimatedCost: number;
    totalActualCost: number;
  };
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  byStore: { storeId: string; name: string; count: number; open: number; resolved: number }[];
  trends: { date: string; created: number; resolved: number }[];
  urgentOpen: MaintenanceRequest[];
}

interface RequestFilters {
  storeId?: string;
  status?: string;
  category?: string;
  priority?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

interface DashboardFilters {
  storeId?: string;
  from?: string;
  to?: string;
}

// ── Stores ──────────────────────────────────────────

export function useMaintenanceStores() {
  return useQuery<MaintenanceStore[]>({
    queryKey: ['maint', 'stores'],
    queryFn: () => api<MaintenanceStore[]>('/api/tools/maintenance/stores'),
  });
}

// ── Users ───────────────────────────────────────────

export function useMaintenanceUsers() {
  return useQuery<MaintenanceUser[]>({
    queryKey: ['maint', 'users'],
    queryFn: () => api<MaintenanceUser[]>('/api/tools/maintenance/users'),
  });
}

// ── Requests ────────────────────────────────────────

export function useMaintenanceRequests(filters: RequestFilters = {}) {
  const { storeId, status, category, priority, from, to, page = 1, pageSize = 20 } = filters;
  return useQuery<MaintenanceListResponse>({
    queryKey: ['maint', 'requests', storeId, status, category, priority, from, to, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (storeId) params.set('storeId', storeId);
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      if (priority) params.set('priority', priority);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<MaintenanceListResponse>(`/api/tools/maintenance/requests?${params}`);
    },
  });
}

export function useMaintenanceRequest(id?: string) {
  return useQuery<MaintenanceRequest>({
    queryKey: ['maint', 'request', id],
    queryFn: () => api<MaintenanceRequest>(`/api/tools/maintenance/requests/${id}`),
    enabled: !!id,
  });
}

export function useCreateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      storeId: string;
      title: string;
      description: string;
      category: string;
      priority?: string;
    }) =>
      api<MaintenanceRequest>('/api/tools/maintenance/requests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maint'] });
    },
  });
}

export function useUpdateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: {
      id: string;
      title?: string;
      description?: string;
      category?: string;
      priority?: string;
      status?: string;
      assignedTo?: string;
      estimatedCost?: number;
      actualCost?: number;
      resolution?: string;
    }) =>
      api<MaintenanceRequest>(`/api/tools/maintenance/requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['maint'] });
    },
  });
}

// ── Summary ─────────────────────────────────────────

export function useMaintenanceSummary(storeId?: string) {
  return useQuery<MaintenanceSummary>({
    queryKey: ['maint', 'summary', storeId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      return api<MaintenanceSummary>(`/api/tools/maintenance/summary?${params}`);
    },
  });
}

// ── Dashboard ───────────────────────────────────────

export function useMaintenanceDashboard(filters: DashboardFilters = {}) {
  const { storeId, from, to } = filters;
  return useQuery<MaintenanceDashboard>({
    queryKey: ['maint', 'dashboard', storeId, from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<MaintenanceDashboard>(`/api/tools/maintenance/dashboard?${params}`);
    },
  });
}

// ── Export ───────────────────────────────────────────

export function useMaintenanceExport() {
  return {
    exportCsv: async (filters: DashboardFilters = {}) => {
      const params = new URLSearchParams();
      if (filters.storeId) params.set('storeId', filters.storeId);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      return api<any[]>(`/api/tools/maintenance/export?${params}`);
    },
  };
}
