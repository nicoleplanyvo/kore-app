import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AuditSummaryStats, AuditSession, AuditTemplate } from '@shared/types';

interface PaginatedSessions {
  data: AuditSession[];
  total: number;
  page: number;
  pageSize: number;
}

export function useAuditSummary() {
  return useQuery<AuditSummaryStats>({
    queryKey: ['audit', 'summary'],
    queryFn: () => api('/api/tools/sea/reports/summary'),
  });
}

export function useAuditSessions(page: number = 1, pageSize: number = 20) {
  return useQuery<PaginatedSessions>({
    queryKey: ['audit', 'sessions', page, pageSize],
    queryFn: () => api(`/api/tools/sea/sessions?page=${page}&pageSize=${pageSize}`),
  });
}

export function useAuditSession(id: string | undefined) {
  return useQuery<AuditSession>({
    queryKey: ['audit', 'session', id],
    queryFn: () => api(`/api/tools/sea/sessions/${id}`),
    enabled: !!id,
  });
}

export function useAuditTemplates() {
  return useQuery<AuditTemplate[]>({
    queryKey: ['audit', 'templates'],
    queryFn: () => api('/api/tools/sea/templates'),
  });
}

interface StoreOption {
  id: string;
  name: string;
  city: string | null;
}

export function useStoreOptions() {
  return useQuery<StoreOption[]>({
    queryKey: ['audit', 'stores'],
    queryFn: () => api('/api/tools/sea/stores'),
  });
}
