import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface ToolDefinitionWithCount {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  priceMonthly: number;
  isActive: boolean;
  sortOrder: number;
  _count: { assignments: number };
}

interface ToolsResponse {
  tools: ToolDefinitionWithCount[];
  grouped: Record<string, ToolDefinitionWithCount[]>;
}

interface ToolStats {
  totalTools: number;
  totalAssignments: number;
  mrr: number;
  categoryStats: Record<string, { total: number; assigned: number }>;
}

export function useTools() {
  return useQuery<ToolsResponse>({
    queryKey: ['tools'],
    queryFn: () => api('/api/admin/tools'),
  });
}

export function useToolStats() {
  return useQuery<ToolStats>({
    queryKey: ['tools', 'stats'],
    queryFn: () => api('/api/admin/tools/stats'),
  });
}

export function useToggleToolAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ toolId, storeId, action }: { toolId: string; storeId: string; action: 'assign' | 'unassign' }) =>
      api(`/api/admin/stores/${storeId}/tools/${action}`, {
        method: 'POST',
        body: JSON.stringify({ toolId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tools'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}
