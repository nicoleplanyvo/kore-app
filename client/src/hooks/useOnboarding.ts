import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Onboarding ─────────────────────────────────────

export function useOnboardingTemplates() {
  return useQuery({
    queryKey: ['onboarding', 'templates'],
    queryFn: () => api<any[]>('/api/tools/onboarding/templates'),
  });
}

export function useOnboardingTemplate(id?: string) {
  return useQuery({
    queryKey: ['onboarding', 'template', id],
    queryFn: () => api<any>(`/api/tools/onboarding/templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateOnboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/onboarding/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onboarding'] }); },
  });
}

export function useOnboardingJourneys(params?: { page?: number; pageSize?: number; storeId?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  return useQuery({
    queryKey: ['onboarding', 'journeys', params],
    queryFn: () => api<any>(`/api/tools/onboarding/journeys?${sp}`),
  });
}

export function useOnboardingJourney(id?: string) {
  return useQuery({
    queryKey: ['onboarding', 'journey', id],
    queryFn: () => api<any>(`/api/tools/onboarding/journeys/${id}`),
    enabled: !!id,
  });
}

export function useCreateOnboardingJourney() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/onboarding/journeys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onboarding'] }); },
  });
}

export function useUpdateOnboardingStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ journeyId, stepId, ...data }: any) => api<any>(`/api/tools/onboarding/journeys/${journeyId}/steps/${stepId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['onboarding'] }); },
  });
}
