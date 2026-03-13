import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Training Hub / LMS ─────────────────────────────

export function useCourses(params?: { page?: number; pageSize?: number; status?: string; category?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.status) sp.set('status', params.status);
  if (params?.category) sp.set('category', params.category);
  return useQuery({
    queryKey: ['training-hub', 'courses', params],
    queryFn: () => api<any>(`/api/tools/training-hub/courses?${sp}`),
  });
}

export function useCourse(id?: string) {
  return useQuery({
    queryKey: ['training-hub', 'course', id],
    queryFn: () => api<any>(`/api/tools/training-hub/courses/${id}`),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/training-hub/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hub'] }); },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/training-hub/courses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hub'] }); },
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...data }: any) => api<any>(`/api/tools/training-hub/courses/${courseId}/modules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hub'] }); },
  });
}

export function useEnrollUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...data }: any) => api<any>(`/api/tools/training-hub/courses/${courseId}/enroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hub'] }); },
  });
}

export function useEnrollments(params?: { page?: number; pageSize?: number; status?: string; courseId?: string }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.status) sp.set('status', params.status);
  if (params?.courseId) sp.set('courseId', params.courseId);
  return useQuery({
    queryKey: ['training-hub', 'enrollments', params],
    queryFn: () => api<any>(`/api/tools/training-hub/enrollments?${sp}`),
  });
}

export function useUpdateEnrollmentProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/training-hub/enrollments/${id}/progress`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['training-hub'] }); },
  });
}

export function useCompletionReport() {
  return useQuery({
    queryKey: ['training-hub', 'reports', 'completion'],
    queryFn: () => api<any>('/api/tools/training-hub/reports/completion'),
  });
}
