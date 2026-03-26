import { User, Menu, Eye, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import type { UserRole } from '@shared/types';

const ROLE_LABELS: Record<string, string> = {
  kore_admin: 'Super Admin',
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const VIEWABLE_ROLES: UserRole[] = [
  'tenant_admin',
  'regional_manager',
  'multisite_manager',
  'store_manager',
  'learner',
];

interface AppTopBarProps {
  onMenuToggle: () => void;
}

export function AppTopBar({ onMenuToggle }: AppTopBarProps) {
  const { user, viewAsRole, setViewAsRole } = useAuthStore();

  const isKoreAdmin = user?.role === 'kore_admin';
  const effectiveRole = viewAsRole || user?.role;

  return (
    <header className="h-[56px] bg-kore-white border-b border-kore-border/60 flex items-center justify-between px-md sm:px-xl flex-shrink-0 relative z-10">
      {/* Left: Hamburger (desktop only, mobile uses bottom nav) */}
      <button
        onClick={onMenuToggle}
        className="hidden lg:flex w-[40px] h-[40px] items-center justify-center rounded-md hover:bg-kore-surface transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu size={20} className="text-kore-ink" />
      </button>

      {/* Logo on mobile */}
      <div className="lg:hidden">
        <h1 className="font-display text-[1.1rem] font-semibold text-kore-ink tracking-wider">KORE</h1>
      </div>

      <div className="flex items-center gap-md">
        {/* View-as Toggle */}
        {isKoreAdmin && (
          <div className="flex items-center gap-sm">
            {viewAsRole ? (
              <div className="flex items-center gap-sm bg-kore-brass/10 border border-kore-brass/30 rounded-md px-md py-xs">
                <Eye size={14} className="text-kore-brass" />
                <span className="font-body text-caption text-kore-brass font-medium">
                  Ansicht: {ROLE_LABELS[viewAsRole]}
                </span>
                <button
                  onClick={() => setViewAsRole(null)}
                  className="ml-xs text-kore-brass hover:text-kore-ink transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) setViewAsRole(e.target.value as UserRole);
                }}
                className="appearance-none bg-kore-surface border border-kore-border rounded-md pl-md pr-xl py-xs font-body text-caption text-kore-mid cursor-pointer hover:border-kore-mid transition-colors"
              >
                <option value="" disabled>Ansicht wechseln...</option>
                {VIEWABLE_ROLES.map((role) => (
                  <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <span className="font-body text-small text-kore-mid hidden sm:inline">
          {ROLE_LABELS[effectiveRole || ''] || ''}
        </span>

        {/* Avatar */}
        <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-kore-brass-lt to-kore-brass flex items-center justify-center shadow-sm">
          <span className="text-white font-body text-small font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
      </div>
    </header>
  );
}
