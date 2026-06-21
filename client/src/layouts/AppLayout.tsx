import { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { AppTopBar } from '../components/AppTopBar';
import { useRecentTools } from '../hooks/useRecentTools';
import { TOOL_ROUTES } from '../lib/toolRoutes';
import {
  LayoutDashboard,
  Grid3X3,
  ClipboardCheck,
  Camera,
  Menu as MenuIcon,
} from 'lucide-react';

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
    <div className="flex h-screen overflow-hidden bg-kore-bg">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AppTopBar onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto pb-nav-safe lg:pb-0">
          <div className="p-md sm:p-lg lg:p-xl max-w-[1400px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-kore-white border-t border-kore-border shadow-bottom z-40 safe-area-bottom">
          <div className="flex items-center justify-around h-[64px] px-sm">
            <BottomTab to="/" icon={LayoutDashboard} label="Home" exact />
            <BottomTab to="/tools" icon={Grid3X3} label="Tools" />
            <BottomTab to="/tools/vm-compliance" icon={Camera} label="VM" />
            <BottomTab to="/tools/sea" icon={ClipboardCheck} label="Audit" />
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center justify-center gap-[2px] min-w-[56px] py-sm text-kore-faint"
            >
              <MenuIcon size={22} strokeWidth={1.8} />
              <span className="text-[0.625rem] font-body font-medium">Mehr</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

function BottomTab({
  to,
  icon: Icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string }>;
  label: string;
  exact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-[2px] min-w-[56px] py-sm transition-colors ${
          isActive ? 'text-kore-brass' : 'text-kore-faint'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`relative ${isActive ? '' : ''}`}>
            <Icon size={22} strokeWidth={isActive ? 2 : 1.8} className={isActive ? 'text-kore-brass' : ''} />
            {isActive && (
              <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-kore-brass" />
            )}
          </div>
          <span className={`text-[0.625rem] font-body ${isActive ? 'font-medium text-kore-brass' : 'font-normal'}`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
