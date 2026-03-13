import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function usePulseSurveys() {
  return useQuery({ queryKey: ['pulse', 'surveys'], queryFn: () => api<any[]>('/api/tools/pulse-survey/surveys') });
}

export function useCreatePulseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/pulse-survey/surveys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function usePulseSurvey(id?: string) {
  return useQuery({ queryKey: ['pulse', 'survey', id], queryFn: () => api<any>(`/api/tools/pulse-survey/surveys/${id}`), enabled: !!id });
}

export function useAddPulseQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, ...data }: any) => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/questions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function useRespondPulseSurvey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surveyId, ...data }: any) => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pulse'] }); },
  });
}

export function usePulseSurveyResults(surveyId?: string) {
  return useQuery({ queryKey: ['pulse', 'results', surveyId], queryFn: () => api<any>(`/api/tools/pulse-survey/surveys/${surveyId}/results`), enabled: !!surveyId });
}
