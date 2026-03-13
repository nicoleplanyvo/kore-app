import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Challenges ─────────────────────────────────────

export function useChallenges(params?: { page?: number; pageSize?: number; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.status) sp.set('status', params.status);
  return useQuery({
    queryKey: ['challenges', 'list', params],
    queryFn: () => api<any>(`/api/tools/challenges?${sp}`),
  });
}

export function useChallenge(id?: string) {
  return useQuery({
    queryKey: ['challenges', 'detail', id],
    queryFn: () => api<any>(`/api/tools/challenges/${id}`),
    enabled: !!id,
  });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/challenges/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, ...data }: any) => api<any>(`/api/tools/challenges/${challengeId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useUpdateChallengeProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, ...data }: any) => api<any>(`/api/tools/challenges/${challengeId}/progress`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}
