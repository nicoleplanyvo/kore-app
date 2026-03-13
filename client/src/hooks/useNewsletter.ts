import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useNewsletters() {
  return useQuery({ queryKey: ['newsletter'], queryFn: () => api<any[]>('/api/tools/newsletter') });
}

export function useNewsletter(id?: string) {
  return useQuery({ queryKey: ['newsletter', id], queryFn: () => api<any>(`/api/tools/newsletter/${id}`), enabled: !!id });
}

export function useCreateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); },
  });
}

export function useUpdateNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/newsletter/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); },
  });
}

export function usePublishNewsletter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/newsletter/${id}/publish`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); },
  });
}

export function useAddNewsletterSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/newsletter/${id}/sections`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); },
  });
}

export function useRecordNewsletterView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/newsletter/${id}/view`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['newsletter'] }); },
  });
}
