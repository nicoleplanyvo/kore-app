import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Types ──────────────────────────────────────────

interface StoreOption { id: string; name: string; city: string | null; }

interface SopCategorySummary {
  id: string; name: string; sortOrder: number; isActive: boolean;
  _count?: { documents: number };
}

interface SopDocumentSummary {
  id: string; title: string; version: number; status: string;
  categoryId: string; publishedAt: string | null; updatedAt: string;
  category?: { id: string; name: string };
  creator?: { id: string; name: string };
  _count?: { acknowledgments: number };
}

interface SopDocumentDetail {
  id: string; tenantId: string | null; categoryId: string; title: string;
  content: string; version: number; status: string; createdBy: string;
  attachmentPath: string | null; publishedAt: string | null;
  createdAt: string; updatedAt: string;
  category?: { id: string; name: string };
  creator?: { id: string; name: string };
  _count?: { acknowledgments: number };
}

interface AcknowledgmentStatusItem {
  sopId: string; title: string; category?: { id: string; name: string };
  publishedAt: string | null; acknowledgedCount: number; totalUsers: number;
  acknowledgedPercent: number;
}

interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

// ── Queries ────────────────────────────────────────

export function useSopStores() {
  return useQuery<StoreOption[]>({
    queryKey: ['sop', 'stores'],
    queryFn: () => api('/api/tools/sop/stores'),
  });
}

export function useSopCategories() {
  return useQuery<SopCategorySummary[]>({
    queryKey: ['sop', 'categories'],
    queryFn: () => api('/api/tools/sop/categories'),
  });
}

export function useSopDocuments(params: { page?: number; categoryId?: string; status?: string; search?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  const query = qs.toString();
  return useQuery<PaginatedResponse<SopDocumentSummary>>({
    queryKey: ['sop', 'documents', params],
    queryFn: () => api(`/api/tools/sop/documents${query ? '?' + query : ''}`),
  });
}

export function useSopDocument(id?: string) {
  return useQuery<SopDocumentDetail>({
    queryKey: ['sop', 'document', id],
    queryFn: () => api(`/api/tools/sop/documents/${id}`),
    enabled: !!id,
  });
}

export function useSopAcknowledgments(sopId?: string) {
  return useQuery<any[]>({
    queryKey: ['sop', 'acknowledgments', sopId],
    queryFn: () => api(`/api/tools/sop/documents/${sopId}/acknowledgments`),
    enabled: !!sopId,
  });
}

export function useSopAcknowledgmentStatus() {
  return useQuery<AcknowledgmentStatusItem[]>({
    queryKey: ['sop', 'acknowledgment-status'],
    queryFn: () => api('/api/tools/sop/reports/acknowledgment-status'),
  });
}

// ── Mutations ──────────────────────────────────────

export function useCreateSop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; categoryId: string; isGlobal?: boolean }) =>
      api<SopDocumentDetail>('/api/tools/sop/documents', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); },
  });
}

export function useUpdateSop(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; content?: string; categoryId?: string }) =>
      api<SopDocumentDetail>(`/api/tools/sop/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); },
  });
}

export function usePublishSop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<SopDocumentDetail>(`/api/tools/sop/documents/${id}/publish`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); },
  });
}

export function useArchiveSop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<SopDocumentDetail>(`/api/tools/sop/documents/${id}/archive`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); },
  });
}

export function useAcknowledgeSop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/tools/sop/documents/${id}/acknowledge`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop'] }); },
  });
}

export function useCreateSopCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; sortOrder?: number; isGlobal?: boolean }) =>
      api('/api/tools/sop/categories', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sop', 'categories'] }); },
  });
}
