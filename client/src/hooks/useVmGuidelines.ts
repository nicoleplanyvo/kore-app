import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function useVmGuidelineDocs(page = 1, status?: string, category?: string) {
  return useQuery({
    queryKey: ['vmg', 'docs', page, status, category],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (status) params.set('status', status);
      if (category) params.set('category', category);
      return api<{ data: any[]; total: number }>(`/api/tools/vm-guidelines?${params}`);
    },
  });
}

export function useVmGuidelineDoc(id?: string) {
  return useQuery({
    queryKey: ['vmg', 'doc', id],
    queryFn: () => api<any>(`/api/tools/vm-guidelines/${id}`),
    enabled: !!id,
  });
}

export function useCreateVmGuidelineDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/vm-guidelines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vmg'] }); },
  });
}

export function useUpdateVmGuidelineDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/vm-guidelines/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vmg'] }); },
  });
}

export function usePublishVmGuidelineDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/vm-guidelines/${id}/publish`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vmg'] }); },
  });
}

export function useArchiveVmGuidelineDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/vm-guidelines/${id}/archive`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vmg'] }); },
  });
}
