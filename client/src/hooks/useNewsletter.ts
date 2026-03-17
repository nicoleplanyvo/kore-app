import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ───────────────────────────────────────────

interface NewsletterSection {
  id: string;
  newsletterId: string;
  title: string;
  content: string;
  sortOrder: number;
}

interface NewsletterListItem {
  id: string;
  title: string;
  content: string | null;
  status: string;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string } | null;
  _count: { sections: number; views: number };
}

interface NewsletterDetail extends NewsletterListItem {
  sections: NewsletterSection[];
}

interface NewsletterListResponse {
  data: NewsletterListItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface NewsletterDashboard {
  kpis: {
    total: number;
    drafts: number;
    published: number;
    archived: number;
    totalViews: number;
    totalSections: number;
    avgViewsPerNewsletter: number;
    avgSectionsPerNewsletter: number;
  };
  topByViews: {
    id: string;
    title: string;
    views: number;
    sections: number;
    publishedAt: string | null;
    creator: { id: string; name: string } | null;
  }[];
  authorPerformance: {
    id: string;
    name: string;
    count: number;
    totalViews: number;
    published: number;
    avgViews: number;
  }[];
  trends: { month: string; created: number; published: number; views: number }[];
  dailyViews: { date: string; count: number }[];
}

interface NewsletterFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface DashboardFilters {
  from?: string;
  to?: string;
}

// ── Queries ─────────────────────────────────────────

export function useNewsletters(filters: NewsletterFilters = {}) {
  const { status, search, page = 1, pageSize = 20 } = filters;
  return useQuery<NewsletterListResponse>({
    queryKey: ['newsletter', 'list', status, search, page, pageSize],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      return api<NewsletterListResponse>(`/api/tools/newsletter?${params}`);
    },
  });
}

export function useNewsletter(id?: string) {
  return useQuery<NewsletterDetail>({
    queryKey: ['newsletter', 'detail', id],
    queryFn: () => api<NewsletterDetail>(`/api/tools/newsletter/${id}`),
    enabled: !!id,
  });
}

export function useNewsletterDashboard(filters: DashboardFilters = {}) {
  const { from, to } = filters;
  return useQuery<NewsletterDashboard>({
    queryKey: ['newsletter', 'dashboard', from, to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      return api<NewsletterDashboard>(`/api/tools/newsletter/dashboard?${params}`);
    },
  });
}

// ── Mutations ───────────────────────────────────────

export function useCreateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content?: string }) =>
      api<any>('/api/tools/newsletter', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useUpdateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; content?: string; status?: string }) =>
      api<any>(`/api/tools/newsletter/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function usePublishNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/newsletter/${id}/publish`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useArchiveNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/newsletter/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useDuplicateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/newsletter/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useDeleteNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/newsletter/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

// ── Sections ────────────────────────────────────────

export function useAddNewsletterSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title: string; content: string; sortOrder?: number }) =>
      api<any>(`/api/tools/newsletter/${id}/sections`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useUpdateNewsletterSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sectionId, ...data }: { sectionId: string; title: string; content: string; sortOrder?: number }) =>
      api<any>(`/api/tools/newsletter/sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useDeleteNewsletterSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sectionId: string) =>
      api<any>(`/api/tools/newsletter/sections/${sectionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

export function useReorderSections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, order }: { id: string; order: string[] }) =>
      api<any>(`/api/tools/newsletter/${id}/sections/reorder`, { method: 'PUT', body: JSON.stringify({ order }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}

// ── Views ───────────────────────────────────────────

export function useRecordNewsletterView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/newsletter/${id}/view`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
}
