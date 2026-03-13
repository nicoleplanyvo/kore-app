import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { AppTopBar } from '../components/AppTopBar';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
