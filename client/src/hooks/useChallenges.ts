import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores & Users ───────────────────────────────────

export function useChallengeStores() {
  return useQuery({ queryKey: ['challenges', 'stores'], queryFn: () => api<any[]>('/api/tools/challenges/stores') });
}

export function useChallengeUsers() {
  return useQuery({ queryKey: ['challenges', 'users'], queryFn: () => api<any[]>('/api/tools/challenges/users') });
}

// ── Dashboard ────────────────────────────────────────

export function useChallengeDashboard() {
  return useQuery({ queryKey: ['challenges', 'dashboard'], queryFn: () => api<any>('/api/tools/challenges/dashboard') });
}

// ── List ─────────────────────────────────────────────

export function useChallenges(params?: { page?: number; pageSize?: number; status?: string; type?: string; storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.status) sp.set('status', params.status);
  if (params?.type) sp.set('type', params.type);
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({
    queryKey: ['challenges', 'list', params],
    queryFn: () => api<any>(`/api/tools/challenges?${sp}`),
  });
}

// ── Detail ───────────────────────────────────────────

export function useChallenge(id?: string) {
  return useQuery({
    queryKey: ['challenges', 'detail', id],
    queryFn: () => api<any>(`/api/tools/challenges/${id}`),
    enabled: !!id,
  });
}

// ── Leaderboard ──────────────────────────────────────

export function useChallengeLeaderboard(id?: string) {
  return useQuery({
    queryKey: ['challenges', 'leaderboard', id],
    queryFn: () => api<any>(`/api/tools/challenges/${id}/leaderboard`),
    enabled: !!id,
  });
}

// ── Mutations ────────────────────────────────────────

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/challenges', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useUpdateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/challenges/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, storeId }: { challengeId: string; storeId?: string }) =>
      api<any>(`/api/tools/challenges/${challengeId}/join`, { method: 'POST', body: JSON.stringify({ storeId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useSubmitEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, value, note }: { challengeId: string; value: number; note?: string }) =>
      api<any>(`/api/tools/challenges/${challengeId}/entries`, { method: 'POST', body: JSON.stringify({ value, note }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}

export function useChallengeVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ challengeId, targetUserId }: { challengeId: string; targetUserId: string }) =>
      api<any>(`/api/tools/challenges/${challengeId}/vote`, { method: 'POST', body: JSON.stringify({ targetUserId }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['challenges'] }); },
  });
}
