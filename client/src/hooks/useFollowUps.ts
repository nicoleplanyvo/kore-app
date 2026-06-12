import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = '/api/tools/sea/follow-ups';

export function useFollowUpsList(filters: { storeId?: string; status?: string; sessionId?: string } = {}, page = 1) {
  return useQuery({
    queryKey: ['follow-ups', 'list', filters, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (filters.storeId) params.set('storeId', filters.storeId);
      if (filters.status) params.set('status', filters.status);
      if (filters.sessionId) params.set('sessionId', filters.sessionId);
      return api<{ data: any[]; total: number }>(`${BASE}?${params}`);
    },
  });
}

/** Offene Follow-ups eines Stores — „Was ist seit dem letzten Besuch passiert?" */
export function useOpenFollowUps(storeId?: string) {
  return useQuery({
    queryKey: ['follow-ups', 'open', storeId],
    queryFn: () => api<any[]>(`${BASE}/open/${storeId}`),
    enabled: !!storeId,
  });
}

export function useFollowUpMetrics() {
  return useQuery({
    queryKey: ['follow-ups', 'metrics'],
    queryFn: () => api<any[]>(`${BASE}/metrics`),
  });
}

export function useCreateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { sessionId: string; responseId?: string; description: string; assignedTo?: string; dueDate?: string }) =>
      api<any>(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow-ups'] }),
  });
}

/** Update ohne Foto (JSON) */
export function useUpdateFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; description?: string; resolution?: string; assignedTo?: string | null; dueDate?: string | null }) =>
      api<any>(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow-ups'] }),
  });
}

/** Erledigen mit Nachweis-Foto (multipart) */
export function useResolveFollowUpWithProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      apiUpload<any>(`${BASE}/${id}`, formData, 'PUT'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['follow-ups'] }),
  });
}
