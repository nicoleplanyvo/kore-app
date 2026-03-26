import { Outlet } from 'react-router-dom';
import { TopHeader } from '../components/TopHeader';
import { BottomNav } from '../components/BottomNav';
import { InstallPrompt } from '../components/InstallPrompt';

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-kore-bg flex flex-col">
      <InstallPrompt />
      <TopHeader />
      <main className="flex-1 pb-[72px]">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
