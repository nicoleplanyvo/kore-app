import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ───────────────────────────────────────────

interface TeamPushStore {
  id: string;
  name: string;
  city: string | null;
}

interface TeamPushUser {
  id: string;
  name: string;
  role: string;
}

interface TeamMessageData {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  priority: string;
  targetType: string;
  targetStoreIds: string | null;
  sentBy: string;
  createdAt: string;
  sender: { id: string; name: string };
  _count: { reads: number };
  reads?: { id: string; userId: string; readAt: string; user: { id: string; name: string } }[];
  totalRecipients?: number;
}

interface MessageListResponse {
  data: TeamMessageData[];
  total: number;
  page: number;
  pageSize: number;
}

interface MessageFilters {
  priority?: string;
  targetType?: string;
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

interface DashboardFilters {
  from?: string;
  to?: string;
}

interface TeamPushDashboard {
  kpis: {
    totalMessages: number;
    totalReads: number;
    avgReadRate: number;
    totalUsers: number;
    urgentCount: number;
    highCount: number;
  };
  byPriority: Record<string, number>;
  byTarget: Record<string, number>;
  topSenders: { id: string; name: string; count: number; totalReads: number }[];
  trends: { date: string; sent: number; reads: number }[];
  bestRead: { id: string; title: string; readRate: number; reads: number } | null;
  recentMessages: TeamMessageData[];
}

// ── Stores ──────────────────────────────────────────
export function useTeamPushStores() {
  return useQuery<TeamPushStore[]>({
    queryKey: ['team-push', 'stores'],
    queryFn: () => api<TeamPushStore[]>('/api/tools/team-push/stores'),
  });
}

// ── Users ───────────────────────────────────────────
export function useTeamPushUsers() {
  return useQuery<TeamPushUser[]>({
    queryKey: ['team-push', 'users'],
    queryFn: () => api<TeamPushUser[]>('/api/tools/team-push/users'),
  });
}

// ── Messages ────────────────────────────────────────
export function useTeamMessages(filters: MessageFilters = {}) {
  const { priority, targetType, search, from, to, page = 1, pageSize = 20 } = filters;
  return useQuery<MessageListResponse>({
    queryKey: ['team-push', 'messages', priority, targetType, search, from, to, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (priority) params.set('priority', priority);
      if (targetType) params.set('targetType', targetType);
      if (search) params.set('search', search);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<MessageListResponse>(`/api/tools/team-push/messages?${params}`);
    },
  });
}

export function useTeamMessage(id?: string) {
  return useQuery<TeamMessageData>({
    queryKey: ['team-push', 'message', id],
    queryFn: () => api<TeamMessageData>(`/api/tools/team-push/messages/${id}`),
    enabled: !!id,
  });
}

export function useCreateTeamMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; body: string; priority?: string; targetType?: string; targetStoreIds?: string }) =>
      api<TeamMessageData>('/api/tools/team-push/messages', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-push'] }); },
  });
}

export function useDeleteTeamMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<{ success: boolean }>(`/api/tools/team-push/messages/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-push'] }); },
  });
}

// ── Read Confirmations ──────────────────────────────
export function useMarkTeamMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/team-push/messages/${id}/read`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team-push'] }); },
  });
}

export function useUnreadUsers(messageId?: string) {
  return useQuery<TeamPushUser[]>({
    queryKey: ['team-push', 'unread', messageId],
    queryFn: () => api<TeamPushUser[]>(`/api/tools/team-push/messages/${messageId}/unread`),
    enabled: !!messageId,
  });
}

// ── Dashboard ───────────────────────────────────────
export function useTeamPushDashboard(filters: DashboardFilters = {}) {
  const { from, to } = filters;
  return useQuery<TeamPushDashboard>({
    queryKey: ['team-push', 'dashboard', from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<TeamPushDashboard>(`/api/tools/team-push/dashboard?${params}`);
    },
  });
}

// ── Reach Report ────────────────────────────────────
export function useTeamPushReach() {
  return useQuery({
    queryKey: ['team-push', 'reach'],
    queryFn: () => api<{ totalMessages: number; totalReads: number; avgReach: number }>('/api/tools/team-push/reports/reach'),
  });
}
