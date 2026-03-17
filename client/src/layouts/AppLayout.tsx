import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { AppTopBar } from '../components/AppTopBar';
import { useRecentTools } from '../hooks/useRecentTools';
import { TOOL_ROUTES } from '../lib/toolRoutes';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { trackTool } = useRecentTools();

  useEffect(() => {
    const entry = Object.entries(TOOL_ROUTES).find(([, route]) =>
      location.pathname.startsWith(route)
    );
    if (entry) {
      trackTool(entry[0]);
    }
  }, [location.pathname, trackTool]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppTopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-md sm:p-lg lg:p-xl bg-kore-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
