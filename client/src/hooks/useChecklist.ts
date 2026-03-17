import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ────────────────────────────────────────────────
export function useChecklistStores() {
  return useQuery<any[]>({
    queryKey: ['checklisten', 'stores'],
    queryFn: () => api('/api/tools/checklisten/stores'),
  });
}

// ── Templates ─────────────────────────────────────────────
export function useChecklistTemplates(storeId?: string) {
  return useQuery<any[]>({
    queryKey: ['checklisten', 'templates', storeId],
    queryFn: () => {
      const params = storeId ? `?storeId=${storeId}` : '';
      return api(`/api/tools/checklisten/templates${params}`);
    },
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api('/api/tools/checklisten/templates', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklisten', 'templates'] }); },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api(`/api/tools/checklisten/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklisten', 'templates'] }); },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/tools/checklisten/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklisten', 'templates'] }); },
  });
}

// ── Checklists (Sessions) ─────────────────────────────────
export function useChecklists(page = 1, storeId?: string, status?: string, date?: string) {
  return useQuery<{ data: any[]; total: number; page: number; pageSize: number }>({
    queryKey: ['checklisten', 'list', page, storeId, status, date],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      if (status) params.set('status', status);
      if (date) params.set('date', date);
      return api(`/api/tools/checklisten/checklists?${params}`);
    },
  });
}

export function useChecklist(id: string) {
  return useQuery<any>({
    queryKey: ['checklisten', 'detail', id],
    queryFn: () => api(`/api/tools/checklisten/checklists/${id}`),
    enabled: !!id,
  });
}

export function useCreateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api('/api/tools/checklisten/checklists', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklisten'] }); },
  });
}

export function useToggleCheckItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: string; itemId: string }) =>
      api(`/api/tools/checklisten/checklists/${checklistId}/items/${itemId}`, { method: 'PUT', body: '{}' }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['checklisten', 'detail', vars.checklistId] });
      qc.invalidateQueries({ queryKey: ['checklisten', 'list'] });
      qc.invalidateQueries({ queryKey: ['checklisten', 'dashboard'] });
    },
  });
}

// ── Dashboard ─────────────────────────────────────────────
export function useChecklistDashboard(storeId?: string) {
  return useQuery<any>({
    queryKey: ['checklisten', 'dashboard', storeId],
    queryFn: () => {
      const params = storeId ? `?storeId=${storeId}` : '';
      return api(`/api/tools/checklisten/dashboard${params}`);
    },
  });
}
