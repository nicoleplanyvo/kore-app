import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useAppraisalCycles() {
  return useQuery({ queryKey: ['appraisals', 'cycles'], queryFn: () => api<any[]>('/api/tools/appraisals/cycles') });
}

export function useCreateAppraisalCycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/appraisals/cycles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}

export function useAppraisals(params?: { page?: number; cycleId?: string; status?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.cycleId) sp.set('cycleId', params.cycleId);
  if (params?.status) sp.set('status', params.status);
  return useQuery({ queryKey: ['appraisals', 'list', params], queryFn: () => api<any>(`/api/tools/appraisals/appraisals?${sp}`) });
}

export function useAppraisal(id?: string) {
  return useQuery({ queryKey: ['appraisals', 'detail', id], queryFn: () => api<any>(`/api/tools/appraisals/appraisals/${id}`), enabled: !!id });
}

export function useCreateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/appraisals/appraisals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}

export function useUpdateAppraisal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/appraisals/appraisals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appraisals'] }); },
  });
}
