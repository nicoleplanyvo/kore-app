import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalStores: number;
  activeStores: number;
  totalToolBookings: number;
  mrr: number;
  recentTenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    storeCount: number;
    createdAt: string;
  }>;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api<DashboardStats>('/api/admin/dashboard/stats'),
  });
}
