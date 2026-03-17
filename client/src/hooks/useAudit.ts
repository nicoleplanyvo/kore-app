import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ──────────────────────────────────────────

interface StoreOption { id: string; name: string; city: string | null; }

interface PaginatedSessions {
  data: any[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Queries ────────────────────────────────────────

export function useAuditStores() {
  return useQuery<StoreOption[]>({
    queryKey: ['audit', 'stores'],
    queryFn: () => api('/api/tools/sea/stores'),
  });
}

export function useAuditSessions(params: { page?: number; pageSize?: number; storeId?: string; status?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  if (params.storeId) qs.set('storeId', params.storeId);
  if (params.status) qs.set('status', params.status);
  const query = qs.toString();
  return useQuery<PaginatedSessions>({
    queryKey: ['audit', 'sessions', params],
    queryFn: () => api(`/api/tools/sea/sessions${query ? '?' + query : ''}`),
  });
}

export function useAuditSession(id?: string) {
  return useQuery<any>({
    queryKey: ['audit', 'session', id],
    queryFn: () => api(`/api/tools/sea/sessions/${id}`),
    enabled: !!id,
  });
}

export function useAuditTemplates() {
  return useQuery<any[]>({
    queryKey: ['audit', 'templates'],
    queryFn: () => api('/api/tools/sea/templates'),
  });
}

export function useAuditTemplate(id?: string) {
  return useQuery<any>({
    queryKey: ['audit', 'template', id],
    queryFn: () => api(`/api/tools/sea/templates/${id}`),
    enabled: !!id,
  });
}

export function useAuditSummary() {
  return useQuery<any>({
    queryKey: ['audit', 'summary'],
    queryFn: () => api('/api/tools/sea/reports/summary'),
  });
}

export function useAuditTrends() {
  return useQuery<any[]>({
    queryKey: ['audit', 'trends'],
    queryFn: () => api('/api/tools/sea/reports/trends'),
  });
}

export function useAuditCategoryStats() {
  return useQuery<any>({
    queryKey: ['audit', 'category-stats'],
    queryFn: () => api('/api/tools/sea/reports/categories'),
  });
}

// ── Mutations ──────────────────────────────────────

export function useCreateAuditSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { storeId: string; templateId: string; storeLocation?: string; notes?: string }) =>
      api<any>('/api/tools/sea/sessions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit'] }); },
  });
}

export function useUpdateAuditSession(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { notes?: string; storeLocation?: string }) =>
      api<any>(`/api/tools/sea/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit'] }); },
  });
}

export function useCompleteAuditSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/sea/sessions/${id}/complete`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit'] }); },
  });
}

export function useCancelAuditSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/sea/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit'] }); },
  });
}

export function useUpsertAuditResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId: string; criterionId: string; scorePercent?: number | null; passed?: boolean | null; comment?: string | null }) =>
      api<any>(`/api/tools/sea/sessions/${data.sessionId}/responses/${data.criterionId}`, {
        method: 'PUT',
        body: JSON.stringify({ scorePercent: data.scorePercent, passed: data.passed, comment: data.comment }),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit'] }); },
  });
}

export function useCreateAuditTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; categories?: any[] }) =>
      api<any>('/api/tools/sea/templates', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit', 'templates'] }); },
  });
}

export function useUpdateAuditTemplate(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      api<any>(`/api/tools/sea/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit', 'templates'] }); },
  });
}

export function useDeleteAuditTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/sea/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audit', 'templates'] }); },
  });
}
