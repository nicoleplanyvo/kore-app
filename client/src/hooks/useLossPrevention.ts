import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = '/api/tools/loss-prevention';

// ── Stores ─────────────────────────────────────────────────────
export function useLossStores() {
  return useQuery({
    queryKey: ['loss', 'stores'],
    queryFn: () => api<any[]>(`${BASE}/stores`),
  });
}

// ── Users ──────────────────────────────────────────────────────
export function useLossUsers(storeId?: string) {
  return useQuery({
    queryKey: ['loss', 'users', storeId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (storeId) params.set('storeId', storeId);
      return api<any[]>(`${BASE}/users?${params}`);
    },
    enabled: !!storeId,
  });
}

// ── Incidents List ─────────────────────────────────────────────
interface IncidentFilters {
  storeId?: string;
  category?: string;
  status?: string;
  severity?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function useLossIncidents(filters: IncidentFilters = {}) {
  return useQuery({
    queryKey: ['loss', 'incidents', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(filters.page || 1));
      params.set('pageSize', String(filters.pageSize || 20));
      if (filters.storeId) params.set('storeId', filters.storeId);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      return api<{ data: any[]; total: number; page: number; pageSize: number }>(
        `${BASE}/incidents?${params}`,
      );
    },
  });
}

// ── Incident Detail ────────────────────────────────────────────
export function useLossIncident(id?: string) {
  return useQuery({
    queryKey: ['loss', 'incident', id],
    queryFn: () => api<any>(`${BASE}/incidents/${id}`),
    enabled: !!id,
  });
}

// ── Create Incident ────────────────────────────────────────────
export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api<any>(`${BASE}/incidents`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loss'] });
    },
  });
}

// ── Update Incident ────────────────────────────────────────────
export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api<any>(`${BASE}/incidents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loss'] });
    },
  });
}

// ── Assign Incident ────────────────────────────────────────────
export function useAssignIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) =>
      api<any>(`${BASE}/incidents/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignedTo }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loss'] });
    },
  });
}

// ── Escalate Incident ──────────────────────────────────────────
export function useEscalateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`${BASE}/incidents/${id}/escalate`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loss'] });
    },
  });
}

// ── Resolve Incident ───────────────────────────────────────────
export function useResolveIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      api<any>(`${BASE}/incidents/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loss'] });
    },
  });
}

// ── Dashboard ──────────────────────────────────────────────────
interface DashboardFilters {
  storeId?: string;
  from?: string;
  to?: string;
}

export function useLossDashboard(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['loss', 'dashboard', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.storeId) params.set('storeId', filters.storeId);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      return api<any>(`${BASE}/dashboard?${params}`);
    },
  });
}

// ── Areas ──────────────────────────────────────────────────────
export function useLossAreas() {
  return useQuery({
    queryKey: ['loss', 'areas'],
    queryFn: () => api<string[]>(`${BASE}/areas`),
  });
}

// ── Measures Catalog ───────────────────────────────────────────
export function useLossMeasures() {
  return useQuery({
    queryKey: ['loss', 'measures'],
    queryFn: () => api<any[]>(`${BASE}/measures`),
  });
}
