import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditLogResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export function useAuditLog(params: { page?: number; tenantId?: string; entity?: string }) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.tenantId) searchParams.set('tenantId', params.tenantId);
  if (params.entity) searchParams.set('entity', params.entity);

  return useQuery<AuditLogResponse>({
    queryKey: ['gdpr', 'audit-log', params],
    queryFn: () => api(`/api/admin/gdpr/audit-log?${searchParams.toString()}`),
  });
}

interface DataExport {
  exportDate: string;
  gdprArticle: string;
  tenant: Record<string, unknown>;
  users: unknown[];
  stores: unknown[];
  consents: unknown[];
}

export function useDataExport(tenantId: string | undefined, enabled: boolean) {
  return useQuery<DataExport>({
    queryKey: ['gdpr', 'data-export', tenantId],
    queryFn: () => api(`/api/admin/gdpr/data-export/${tenantId}`),
    enabled: !!tenantId && enabled,
  });
}
