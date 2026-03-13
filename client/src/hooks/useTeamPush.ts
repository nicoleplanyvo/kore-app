import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useTeamMessages() {
  return useQuery({ queryKey: ['team-push', 'messages'], queryFn: () => api<any[]>('/api/tools/team-push/messages') });
}

export function useTeamMessage(id?: string) {
  return useQuery({ queryKey: ['team-push', 'message', id], queryFn: () => api<any>(`/api/tools/team-push/messages/${id}`), enabled: !!id });
}

export function useCreateTeamMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/team-push/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-push'] }); },
  });
}

export function useMarkTeamMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/team-push/messages/${id}/read`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-push'] }); },
  });
}

export function useTeamPushReach() {
  return useQuery({ queryKey: ['team-push', 'reach'], queryFn: () => api<any>('/api/tools/team-push/reports/reach') });
}
