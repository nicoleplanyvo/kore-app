import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiUpload } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = '/api/tools/vm-compliance/spot-checks';

export function useSpotChecks(page = 1, status?: string) {
  return useQuery({
    queryKey: ['spot-checks', 'list', page, status],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      return api<{ data: any[]; total: number }>(`${BASE}?${params}`);
    },
  });
}

export function useSpotCheckInbox() {
  return useQuery({
    queryKey: ['spot-checks', 'inbox'],
    queryFn: () => api<any[]>(`${BASE}/inbox`),
    refetchInterval: 60_000, // Deadlines laufen — Inbox aktuell halten
  });
}

export function useSpotCheck(id?: string) {
  return useQuery({
    queryKey: ['spot-checks', 'detail', id],
    queryFn: () => api<any>(`${BASE}/${id}`),
    enabled: !!id,
    refetchInterval: 30_000, // Live-Status-Board
  });
}

export function useSpotCheckMetrics() {
  return useQuery({
    queryKey: ['spot-checks', 'metrics'],
    queryFn: () => api<any[]>(`${BASE}/metrics/summary`),
  });
}

export function useCreateSpotCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => apiUpload<any>(BASE, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spot-checks'] }),
  });
}

export function useRespondSpotCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      apiUpload<any>(`${BASE}/${id}/respond`, formData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spot-checks'] }),
  });
}

export function useReviewSpotCheckTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, targetId, status, reviewNote }: { requestId: string; targetId: string; status: 'APPROVED' | 'REJECTED'; reviewNote?: string }) =>
      api<any>(`${BASE}/${requestId}/targets/${targetId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spot-checks'] }),
  });
}

export function useCloseSpotCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`${BASE}/${id}/close`, { method: 'PUT' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spot-checks'] }),
  });
}

/** Verbleibende Zeit bis Deadline, deutsch formatiert (negativ = überfällig) */
export function formatDeadline(deadline: string): { label: string; overdue: boolean; urgent: boolean } {
  const diffMs = new Date(deadline).getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  let label: string;
  if (minutes < 60) label = `${minutes} Min.`;
  else if (minutes < 60 * 24) label = `${Math.floor(minutes / 60)} Std. ${minutes % 60} Min.`;
  else label = `${Math.floor(minutes / (60 * 24))} Tg. ${Math.floor((minutes % (60 * 24)) / 60)} Std.`;
  return { label: overdue ? `${label} überfällig` : `noch ${label}`, overdue, urgent: !overdue && minutes <= 60 };
}
