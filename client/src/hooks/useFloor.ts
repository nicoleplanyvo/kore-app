import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Live Floor ─────────────────────────────────────

export function useFloorStores() {
  return useQuery({ queryKey: ['floor', 'stores'], queryFn: () => api<any[]>('/api/tools/live-floor/stores') });
}

export function useFloorZones(storeId?: string) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  return useQuery({
    queryKey: ['floor', 'zones', storeId],
    queryFn: () => api<any[]>(`/api/tools/live-floor/zones?${params}`),
  });
}

export function useFloorPositions(storeId?: string, status?: string) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  if (status) params.set('status', status);
  return useQuery({
    queryKey: ['floor', 'positions', storeId, status],
    queryFn: () => api<any[]>(`/api/tools/live-floor/positions?${params}`),
  });
}

export function useFloorSnapshot(storeId?: string) {
  const params = new URLSearchParams();
  if (storeId) params.set('storeId', storeId);
  return useQuery({
    queryKey: ['floor', 'snapshot', storeId],
    queryFn: () => api<any[]>(`/api/tools/live-floor/snapshot?${params}`),
  });
}

export function useCreateFloorZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/live-floor/zones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor'] }); },
  });
}

export function useUpdateFloorZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/live-floor/zones/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor'] }); },
  });
}

export function useCreateFloorPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api<any>('/api/tools/live-floor/positions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor'] }); },
  });
}

export function useUpdateFloorPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api<any>(`/api/tools/live-floor/positions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['floor'] }); },
  });
}
