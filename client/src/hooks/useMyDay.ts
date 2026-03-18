import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface MyDayData {
  greeting: string;
  date: string;
  stores: { id: string; name: string }[];
  checklists: {
    todayTotal: number;
    todayCompleted: number;
    todayRate: number;
    overdue: { id: string; template: string; store: string; startedAt: string }[];
  };
  kpiYesterday: {
    revenue: number;
    transactions: number;
    footfall: number;
    unitsSold: number;
    atv: number;
    conversion: number;
    upt: number;
    date: string;
    storeCount: number;
    perStore: { storeId: string; storeName: string; revenue: number; transactions: number; atv: number }[];
  };
  shifts: {
    today: { id: string; user: string; store: string; start: string; end: string; status: string }[];
    totalToday: number;
    pendingSwaps: number;
  };
  handovers: {
    pending: { id: string; from: string; store: string; shiftDate: string; createdAt: string }[];
  };
  briefings: {
    unread: { id: string; title: string; date: string; store: string }[];
  };
  coaching: {
    today: { id: string; coachee: string; store: string; time: string; topic: string | null }[];
  };
  floor: {
    totalZones: number;
    totalStaff: number;
    totalCustomers: number;
    underStaffedZones: number;
  } | null;
}

export function useMyDay() {
  return useQuery<MyDayData>({
    queryKey: ['my-day'],
    queryFn: async () => {
      const res = await api.get('/api/tools/my-day');
      return res.data;
    },
    refetchInterval: 5 * 60 * 1000, // Alle 5 Minuten refreshen
    staleTime: 2 * 60 * 1000,
  });
}
