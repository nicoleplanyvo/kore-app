import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Stores ───────────────────────────────────────────
export function useFRStores() {
  return useQuery({ queryKey: ['fr-conversion', 'stores'], queryFn: () => api<any[]>('/api/tools/fr-conversion/stores') });
}

// ── Settings ─────────────────────────────────────────
export function useFRSettings(storeId?: string) {
  return useQuery({
    queryKey: ['fr-conversion', 'settings', storeId],
    queryFn: () => api<any>(`/api/tools/fr-conversion/settings?storeId=${storeId}`),
    enabled: !!storeId,
  });
}

export function useUpdateFRSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/fr-conversion/settings', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion', 'settings'] }); },
  });
}

// ── Rooms ────────────────────────────────────────────
export function useFRRooms(storeId?: string) {
  return useQuery({
    queryKey: ['fr-conversion', 'rooms', storeId],
    queryFn: () => api<any[]>(`/api/tools/fr-conversion/rooms?storeId=${storeId}`),
    enabled: !!storeId,
  });
}

export function useCreateFRRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/fr-conversion/rooms', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion', 'rooms'] }); },
  });
}

export function useDeleteFRRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/fr-conversion/rooms/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion', 'rooms'] }); },
  });
}

// ── Sessions ─────────────────────────────────────────
export function useFRActiveSessions(storeId?: string) {
  return useQuery({
    queryKey: ['fr-conversion', 'sessions', 'active', storeId],
    queryFn: () => api<any[]>(`/api/tools/fr-conversion/sessions/active?storeId=${storeId}`),
    enabled: !!storeId,
    refetchInterval: 15000, // Auto-refresh every 15s for live status
  });
}

export function useFRSessions(params?: { storeId?: string; status?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.status) sp.set('status', params.status);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['fr-conversion', 'sessions', params],
    queryFn: () => api<any[]>(`/api/tools/fr-conversion/sessions?${sp}`),
    enabled: !!params?.storeId,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/fr-conversion/sessions/check-in', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fr-conversion', 'sessions'] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/fr-conversion/sessions/${id}/check-out`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fr-conversion', 'sessions'] });
      qc.invalidateQueries({ queryKey: ['fr-conversion', 'dashboard'] });
    },
  });
}

export function useAddItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/fr-conversion/sessions/${id}/add-items`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion', 'sessions'] }); },
  });
}

export function useChangeStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/fr-conversion/sessions/${id}/change-staff`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion', 'sessions'] }); },
  });
}

export function useCancelSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`/api/tools/fr-conversion/sessions/${id}/cancel`, { method: 'PUT' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fr-conversion', 'sessions'] }); },
  });
}

// ── Dashboard ────────────────────────────────────────
export function useFRDashboard(params?: { storeId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['fr-conversion', 'dashboard', params],
    queryFn: () => api<any>(`/api/tools/fr-conversion/dashboard?${sp}`),
    enabled: !!params?.storeId,
  });
}

// ── Users (for staff selector) ───────────────────────
export function useFRUsers() {
  return useQuery({ queryKey: ['fr-conversion', 'users'], queryFn: () => api<any[]>('/api/tools/fr-conversion/users') });
}
