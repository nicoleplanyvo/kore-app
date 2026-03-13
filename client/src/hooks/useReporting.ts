import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ReportingHierarchy } from '@shared/types';

export function useReportingHierarchy(tenantId?: string) {
  const qs = tenantId ? `?tenantId=${tenantId}` : '';
  return useQuery<ReportingHierarchy>({
    queryKey: ['reporting', 'hierarchy', tenantId ?? 'current'],
    queryFn: () => api(`/api/admin/reporting/hierarchy${qs}`),
    enabled: tenantId !== '',
  });
}
