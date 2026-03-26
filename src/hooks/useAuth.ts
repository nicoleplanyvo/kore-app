import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { queryClient } from '../lib/queryClient';
import type { AuthUser } from '../types';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () =>
      api('/api/auth/logout', { method: 'POST' }),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
