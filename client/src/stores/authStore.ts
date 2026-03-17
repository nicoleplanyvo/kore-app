import { create } from 'zustand';
import type { AuthUser, UserRole } from '@shared/types';
import { setAccessToken } from '../lib/api';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** "View as" Rolle — nur für kore_admin, rein clientseitig */
  viewAsRole: UserRole | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setViewAsRole: (role: UserRole | null) => void;
  /** Gibt die effektive Rolle zurück (viewAsRole oder echte Rolle) */
  getEffectiveRole: () => UserRole | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  viewAsRole: null,
  setAuth: (user, token) => {
    setAccessToken(token);
    set({ user, isAuthenticated: true, isLoading: false, viewAsRole: null });
  },
  clearAuth: () => {
    setAccessToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false, viewAsRole: null });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setViewAsRole: (role) => set({ viewAsRole: role }),
  getEffectiveRole: () => {
    const { user, viewAsRole } = get();
    return viewAsRole || user?.role;
  },
}));
