import { NavLink } from 'react-router-dom';
import { Home, Wrench, GraduationCap, User, Settings } from 'lucide-react';
import { cn } from '../lib/cn';
import { useAuthStore } from '../stores/authStore';
import { hasMinRole } from '../types';
import type { UserRole } from '../types';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  minRole?: UserRole;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
  { to: '/training', icon: GraduationCap, label: 'Training' },
  { to: '/admin', icon: Settings, label: 'Admin', minRole: 'store_manager' },
  { to: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const user = useAuthStore((s) => s.user);
  const userRole = (user?.role || 'learner') as UserRole;

  const visibleItems = navItems.filter(
    (item) => !item.minRole || hasMinRole(userRole, item.minRole),
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-kore-white border-t border-kore-border safe-bottom">
      <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-[2px] w-full h-full touch-manipulation transition-colors',
                isActive ? 'text-kore-brass' : 'text-kore-mid',
              )
            }
          >
            <Icon size={22} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wider uppercase">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
