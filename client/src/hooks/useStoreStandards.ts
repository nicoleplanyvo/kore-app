import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface StdStore { id: string; name: string; city: string | null; }
interface StdCategorySummary { id: string; name: string; description: string | null; sortOrder: number; isActive: boolean; _count?: { definitions: number }; }
interface StdDefinitionSummary { id: string; categoryId: string; name: string; description: string | null; unit: string | null; targetValue: number; operator: string; weight: number; isActive: boolean; sortOrder: number; category?: { name: string }; }
interface StdEvaluationSummary { id: string; storeId: string; evaluatedBy: string; period: string; overallScore: number | null; status: string; evaluatedAt: string; completedAt: string | null; store?: { name: string; city: string | null }; evaluator?: { name: string }; _count?: { scores: number }; }
interface StdEvaluationDetail extends StdEvaluationSummary { notes: string | null; scores: { id: string; definitionId: string; actualValue: number; passed: boolean; score: number; comment: string | null; definition: StdDefinitionSummary; }[]; }
interface StdSummary { totalEvaluations: number; averageScore: number; complianceRate: number; thisMonth: number; }
interface PaginatedResponse<T> { data: T[]; total: number; page: number; pageSize: number; }

export function useStdStores() {
  return useQuery<StdStore[]>({ queryKey: ['standards', 'stores'], queryFn: () => api('/api/tools/store-standards/stores') });
}

export function useStdCategories() {
  return useQuery<StdCategorySummary[]>({ queryKey: ['standards', 'categories'], queryFn: () => api('/api/tools/store-standards/categories') });
}

export function useStdDefinitions() {
  return useQuery<StdDefinitionSummary[]>({ queryKey: ['standards', 'definitions'], queryFn: () => api('/api/tools/store-standards/definitions') });
}

export function useStdEvaluations(page = 1) {
  return useQuery<PaginatedResponse<StdEvaluationSummary>>({
    queryKey: ['standards', 'evaluations', page],
    queryFn: () => api(`/api/tools/store-standards/evaluations?page=${page}`),
  });
}

export function useStdEvaluation(id?: string) {
  return useQuery<StdEvaluationDetail>({
    queryKey: ['standards', 'evaluation', id],
    queryFn: () => api(`/api/tools/store-standards/evaluations/${id}`),
    enabled: !!id,
  });
}

export function useStdSummary() {
  return useQuery<StdSummary>({ queryKey: ['standards', 'summary'], queryFn: () => api('/api/tools/store-standards/reports/summary') });
}
