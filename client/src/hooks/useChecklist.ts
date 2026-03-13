import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types for API responses
interface ChecklistStore { id: string; name: string; city: string | null; }

interface ChecklistTemplateSummary {
  id: string; name: string; description: string | null; isDefault: boolean;
  _count: { sections: number };
}

interface ChecklistTemplateDetail {
  id: string; name: string; description: string | null; version: number;
  isDefault: boolean; tenantId: string | null;
  sections: {
    id: string; name: string; sortOrder: number;
    items: { id: string; text: string; type: string; isRequired: boolean; sortOrder: number; }[];
  }[];
}

interface ChecklistSessionSummary {
  id: string; storeId: string; templateId: string; status: string;
  completionRate: number; notes: string | null;
  startedAt: string; completedAt: string | null;
  template: { name: string };
  store: { name: string; city: string | null };
  _count: { entries: number };
}

interface ChecklistSessionDetail {
  id: string; tenantId: string; storeId: string; templateId: string;
  conductedBy: string; status: string; completionRate: number;
  notes: string | null; startedAt: string; completedAt: string | null;
  template: ChecklistTemplateDetail;
  store: { id: string; name: string; city: string | null };
  entries: {
    id: string; itemId: string; valueBool: boolean | null;
    valueText: string | null; valueNumber: number | null;
    photoPath: string | null; comment: string | null;
  }[];
}

interface ChecklistSummaryStats {
  totalSessions: number; averageCompletionRate: number;
  thisMonth: number; lastMonth: number;
}

interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

export function useChecklistStores() {
  return useQuery<ChecklistStore[]>({
    queryKey: ['checklist', 'stores'],
    queryFn: () => api('/api/tools/checklisten/stores'),
  });
}

export function useChecklistTemplates() {
  return useQuery<ChecklistTemplateSummary[]>({
    queryKey: ['checklist', 'templates'],
    queryFn: () => api('/api/tools/checklisten/templates'),
  });
}

export function useChecklistTemplate(id?: string) {
  return useQuery<ChecklistTemplateDetail>({
    queryKey: ['checklist', 'template', id],
    queryFn: () => api(`/api/tools/checklisten/templates/${id}`),
    enabled: !!id,
  });
}

export function useChecklistSessions(page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<ChecklistSessionSummary>>({
    queryKey: ['checklist', 'sessions', page, pageSize],
    queryFn: () => api(`/api/tools/checklisten/sessions?page=${page}&pageSize=${pageSize}`),
  });
}

export function useChecklistSession(id?: string) {
  return useQuery<ChecklistSessionDetail>({
    queryKey: ['checklist', 'session', id],
    queryFn: () => api(`/api/tools/checklisten/sessions/${id}`),
    enabled: !!id,
  });
}

export function useChecklistSummary() {
  return useQuery<ChecklistSummaryStats>({
    queryKey: ['checklist', 'summary'],
    queryFn: () => api('/api/tools/checklisten/reports/summary'),
  });
}
