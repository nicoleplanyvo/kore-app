import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface SopCategorySummary { id: string; name: string; sortOrder: number; isActive: boolean; _count?: { documents: number }; }

interface SopDocumentSummary {
  id: string; title: string; version: number; status: string;
  categoryId: string; publishedAt: string | null; updatedAt: string;
  category?: { id: string; name: string };
  author?: { name: string };
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
  userAcknowledged?: boolean;
}

interface AcknowledgmentStatusItem {
  sopId: string; title: string; status: string;
  acknowledged: number; total: number;
}

interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

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

export function useSopAcknowledgmentStatus() {
  return useQuery<AcknowledgmentStatusItem[]>({
    queryKey: ['sop', 'acknowledgment-status'],
    queryFn: () => api('/api/tools/sop/acknowledgments/reports/acknowledgment-status'),
  });
}
