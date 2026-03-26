import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { StoreToolAssignment } from '../types';

export function useMyTools() {
  return useQuery<StoreToolAssignment[]>({
    queryKey: ['my-tools'],
    queryFn: () => api('/api/tools'),
  });
}
