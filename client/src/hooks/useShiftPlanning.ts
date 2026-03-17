import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

const BASE = '/api/tools/shift-planning';

// ── Stores & Users ───────────────────────────────────
export function useShiftStores() {
  return useQuery({ queryKey: ['shift', 'stores'], queryFn: () => api<any[]>(`${BASE}/stores`) });
}

export function useShiftUsers(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({ queryKey: ['shift', 'users', storeId], queryFn: () => api<any[]>(`${BASE}/users?${sp}`) });
}

// ── Shifts ───────────────────────────────────────────
export function useShifts(params?: { storeId?: string; weekStart?: string; weekEnd?: string; userId?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.weekStart) sp.set('weekStart', params.weekStart);
  if (params?.weekEnd) sp.set('weekEnd', params.weekEnd);
  if (params?.userId) sp.set('userId', params.userId);
  return useQuery({
    queryKey: ['shift', 'shifts', params],
    queryFn: () => api<any[]>(`${BASE}/shifts?${sp}`),
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/shifts`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`${BASE}/shifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<any>(`${BASE}/shifts/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function usePublishWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { storeId: string; weekStart: string }) => api<any>(`${BASE}/shifts/publish`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

// ── Availability ─────────────────────────────────────
export function useAvailability(params?: { storeId?: string; userId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.userId) sp.set('userId', params.userId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['shift', 'availability', params],
    queryFn: () => api<any[]>(`${BASE}/availability?${sp}`),
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/availability`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

// ── Swap Requests ────────────────────────────────────
export function useCreateSwapRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>(`${BASE}/swap-requests`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function useUpdateSwapRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`${BASE}/swap-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

// ── Time Tracking ────────────────────────────────────
export function useClock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { storeId: string; action: string; note?: string }) => api<any>(`${BASE}/clock`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shift'] }); },
  });
}

export function useTimeEntries(params?: { storeId?: string; userId?: string; from?: string; to?: string }) {
  const sp = new URLSearchParams();
  if (params?.storeId) sp.set('storeId', params.storeId);
  if (params?.userId) sp.set('userId', params.userId);
  if (params?.from) sp.set('from', params.from);
  if (params?.to) sp.set('to', params.to);
  return useQuery({
    queryKey: ['shift', 'time-entries', params],
    queryFn: () => api<any>(`${BASE}/time-entries?${sp}`),
  });
}

// ── Dashboard ────────────────────────────────────────
export function useShiftDashboard(storeId?: string) {
  const sp = new URLSearchParams();
  if (storeId) sp.set('storeId', storeId);
  return useQuery({
    queryKey: ['shift', 'dashboard', storeId],
    queryFn: () => api<any>(`${BASE}/dashboard?${sp}`),
  });
}
