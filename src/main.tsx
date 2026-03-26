import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { api } from './lib/api';
import { useAuthStore } from './stores/authStore';
import { App } from './App';
import './index.css';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    // Versuche Token-Refresh beim App-Start
    api<{ accessToken: string; user: { id: string; name: string; email: string; role: string; tenantId?: string; storeAssignments?: string[] } }>('/api/auth/refresh', {
      method: 'POST',
    })
      .then((data) => {
        setAuth(data.user as Parameters<typeof setAuth>[0], data.accessToken);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setAuth, setLoading, clearAuth]);

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
  </StrictMode>,
);
