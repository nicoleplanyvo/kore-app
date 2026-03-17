import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ──────────────────────────────────────────

export function useOnboardingStores() {
  return useQuery({
    queryKey: ['onboarding', 'stores'],
    queryFn: () => api<any[]>('/api/tools/onboarding/stores'),
  });
}

// ── Users ───────────────────────────────────────────

export function useOnboardingUsers() {
  return useQuery({
    queryKey: ['onboarding', 'users'],
    queryFn: () => api<any[]>('/api/tools/onboarding/users'),
  });
}

// ── Templates ───────────────────────────────────────

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
    mutationFn: (data: any) =>
      api<any>('/api/tools/onboarding/templates', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useUpdateOnboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      api<any>(`/api/tools/onboarding/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useDeleteOnboardingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<any>(`/api/tools/onboarding/templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// ── Journeys ────────────────────────────────────────

export function useOnboardingJourneys(params?: {
  page?: number;
  pageSize?: number;
  storeId?: string;
  status?: string;
  userId?: string;
  mentorId?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.userId) sp.set('userId', params.userId);
  if (params?.mentorId) sp.set('mentorId', params.mentorId);
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
    mutationFn: (data: any) =>
      api<any>('/api/tools/onboarding/journeys', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useUpdateJourneyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<any>(`/api/tools/onboarding/journeys/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useAssignMentor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mentorId }: { id: string; mentorId: string | null }) =>
      api<any>(`/api/tools/onboarding/journeys/${id}/mentor`, { method: 'PUT', body: JSON.stringify({ mentorId }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useUpdateOnboardingStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ journeyId, stepId, ...data }: any) =>
      api<any>(`/api/tools/onboarding/journeys/${journeyId}/steps/${stepId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

// ── Dashboard ───────────────────────────────────────

export function useOnboardingDashboard(params?: { storeId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  return useQuery({
    queryKey: ['onboarding', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/onboarding/dashboard?${sp}`),
  });
}
