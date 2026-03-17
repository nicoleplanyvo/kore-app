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

/** Rollen die im "View as" Dropdown auswählbar sind (ohne kore_admin) */
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
    <header className="h-[56px] bg-kore-white border-b border-kore-border flex items-center justify-between px-md sm:px-xl flex-shrink-0">
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-[36px] h-[36px] flex items-center justify-center rounded-sm hover:bg-kore-surface transition-colors"
        aria-label="Menü öffnen"
      >
        <Menu size={20} className="text-kore-ink" />
      </button>

      {/* Spacer for desktop (no hamburger) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-md">
        {/* View-as Toggle — nur für kore_admin */}
        {isKoreAdmin && (
          <div className="flex items-center gap-sm">
            {viewAsRole ? (
              <div className="flex items-center gap-sm bg-kore-brass/10 border border-kore-brass/30 rounded-sm px-md py-xs">
                <Eye size={14} className="text-kore-brass" />
                <span className="font-body text-caption text-kore-brass font-medium">
                  Ansicht: {ROLE_LABELS[viewAsRole]}
                </span>
                <button
                  onClick={() => setViewAsRole(null)}
                  className="ml-xs text-kore-brass hover:text-kore-ink transition-colors"
                  title="Zurück zur Admin-Ansicht"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value) setViewAsRole(e.target.value as UserRole);
                  }}
                  className="appearance-none bg-kore-surface border border-kore-border rounded-sm pl-md pr-xl py-xs font-body text-caption text-kore-mid cursor-pointer hover:border-kore-mid transition-colors"
                >
                  <option value="" disabled>
                    Ansicht wechseln...
                  </option>
                  {VIEWABLE_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                <Eye size={14} className="absolute right-sm top-1/2 -translate-y-1/2 text-kore-mid pointer-events-none" />
              </div>
            )}
          </div>
        )}

        <span className="font-body text-caption text-kore-mid hidden sm:inline">
          {ROLE_LABELS[effectiveRole || ''] || ''}
        </span>
        <div className="w-[32px] h-[32px] rounded-full bg-kore-surface flex items-center justify-center">
          <User size={16} className="text-kore-mid" />
        </div>
        <span className="font-body text-small text-kore-ink hidden sm:inline">{user?.name}</span>
      </div>
    </header>
  );
}
