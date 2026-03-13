import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { setAccessToken } from './lib/api';
import { App } from './App';
import './index.css';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || ''}/api/auth/refresh`,
          { method: 'POST', credentials: 'include' }
        );
        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.accessToken);
          setAuth(data.user, data.accessToken);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }
    initAuth();
  }, [setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
