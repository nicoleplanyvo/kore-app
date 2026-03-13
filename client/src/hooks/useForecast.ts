import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useForecastStores() {
  return useQuery({ queryKey: ['forecast', 'stores'], queryFn: () => api<any[]>('/api/tools/forecast/stores') });
}

export function useForecasts(page = 1, storeId?: string, forecastType?: string) {
  return useQuery({
    queryKey: ['forecast', 'list', page, storeId, forecastType],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (storeId) params.set('storeId', storeId);
      if (forecastType) params.set('forecastType', forecastType);
      return api<{ data: any[]; total: number }>(`/api/tools/forecast?${params}`);
    },
  });
}

export function useForecast(id: string) {
  return useQuery({
    queryKey: ['forecast', 'detail', id],
    queryFn: () => api<any>(`/api/tools/forecast/${id}`),
    enabled: !!id,
  });
}

export function useForecastAccuracy() {
  return useQuery({
    queryKey: ['forecast', 'accuracy'],
    queryFn: () => api<any>('/api/tools/forecast/reports/accuracy'),
  });
}
