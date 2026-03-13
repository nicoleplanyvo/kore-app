import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface VmStore { id: string; name: string; city: string | null; }
interface VmGuidelineSummary { id: string; name: string; description: string | null; category: string | null; referencePhoto: string | null; isActive: boolean; sortOrder: number; _count?: { submissions: number }; }
interface VmSubmissionSummary { id: string; guidelineId: string; storeId: string; submittedBy: string; photoPath: string; status: string; reviewNote: string | null; submittedAt: string; reviewedAt: string | null; guideline?: { name: string; referencePhoto: string | null }; store?: { name: string }; submitter?: { name: string }; }
interface VmSummary { totalSubmissions: number; pending: number; approved: number; rejected: number; complianceRate: number; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

export function useVmStores() {
  return useQuery<VmStore[]>({ queryKey: ['vm', 'stores'], queryFn: () => api('/api/tools/vm-compliance/stores') });
}

export function useVmGuidelines() {
  return useQuery<VmGuidelineSummary[]>({ queryKey: ['vm', 'guidelines'], queryFn: () => api('/api/tools/vm-compliance/guidelines') });
}

export function useVmSubmissions(params: { page?: number; status?: string; storeId?: string; guidelineId?: string } = {}) {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.status) qs.set('status', params.status);
  if (params.storeId) qs.set('storeId', params.storeId);
  if (params.guidelineId) qs.set('guidelineId', params.guidelineId);
  const q = qs.toString();
  return useQuery<PaginatedResponse<VmSubmissionSummary>>({
    queryKey: ['vm', 'submissions', params],
    queryFn: () => api(`/api/tools/vm-compliance/submissions${q ? '?' + q : ''}`),
  });
}

export function useVmSummary() {
  return useQuery<VmSummary>({ queryKey: ['vm', 'summary'], queryFn: () => api('/api/tools/vm-compliance/reports/summary') });
}
