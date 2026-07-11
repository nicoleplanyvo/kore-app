import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './stores/authStore';
import { setAccessToken, refreshSession } from './lib/api';
import { App } from './App';
import { initNative, registerPushAndSyncToken } from './lib/native';
import './index.css';

// Native-Integration (Statusleiste/Splash) — im Web No-Op
void initNative();

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      // refreshSession(): Web nutzt das Cookie, die native App den gespeicherten Token
      const data = await refreshSession();
      if (data) {
        setAccessToken(data.accessToken);
        setAuth(data.user, data.accessToken);
        // Native: Push registrieren und Token ans Backend melden
        void registerPushAndSyncToken();
      } else {
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
