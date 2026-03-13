import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Region } from '@shared/types';

/**
 * Holt alle Regionen des aktuellen Tenants.
 * Verwendet den admin/regions Endpoint.
 */
export function useRegions(tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : '';
  return useQuery<Region[]>({
    queryKey: ['regions', tenantId ?? 'all'],
    queryFn: () => api(`/api/admin/regions${qs}`),
  });
}

/**
 * Setzt die Region-Zuweisungen für einen User.
 */
export function useUpdateUserRegions(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (regionIds: string[]) =>
      api(`/api/admin/users/${userId}/regions`, {
        method: 'PUT',
        body: JSON.stringify({ regionIds }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', userId] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
