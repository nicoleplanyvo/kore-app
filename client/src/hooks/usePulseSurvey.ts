import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ──────────────────────────────────────────
export function usePulseStores() {
  return useQuery({ queryKey: ['pulse', 'stores'], queryFn: () => api<any[]>('/api/tools/pulse-survey/stores') });
}

// ── Surveys ─────────────────────────────────────────
export function usePulseSurveys() {
  return useQuery({ queryKey: ['pulse', 'surveys'], queryFn: () => api<any[]>('/api/tools/pulse-survey/surveys') });
}

export function usePulseSurvey(id?: string) {
  return useQuery({
    queryKey: ['pulse', 'survey', id],
    queryFn: () => api<any>(`/api/tools/pulse-survey/surveys/${id}`),
    enabled: !!id,
  });
}

export function useCreatePulseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/pulse-survey/surveys', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function useUpdatePulseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/pulse-survey/surveys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function useDeletePulseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/pulse-survey/surveys/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

// ── Questions ───────────────────────────────────────
export function useAddPulseQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, ...data }: any) => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/questions`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function useUpdatePulseQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, questionId, ...data }: any) => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function useDeletePulseQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, questionId }: { surveyId: string; questionId: string }) => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/questions/${questionId}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

// ── Respond ─────────────────────────────────────────
export function useRespondPulseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, ...data }: any) => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/respond`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

// ── Results ─────────────────────────────────────────
export function usePulseSurveyResults(surveyId?: string, storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({
    queryKey: ['pulse', 'results', surveyId, storeId],
    queryFn: () => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/results?${sp}`),
    enabled: !!surveyId,
  });
}

// ── Dashboard ───────────────────────────────────────
export function usePulseDashboard() {
  return useQuery({
    queryKey: ['pulse', 'dashboard'],
    queryFn: () => api<any>('/api/tools/pulse-survey/dashboard'),
  });
}
