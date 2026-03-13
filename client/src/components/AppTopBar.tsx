import { User, Menu } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const ROLE_LABELS: Record<string, string> = {
  kore_admin: 'Super Admin',
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

interface AppTopBarProps {
  onMenuToggle: () => void;
}

export function AppTopBar({ onMenuToggle }: AppTopBarProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-[56px] bg-kore-white border-b border-kore-border flex items-center justify-between px-md sm:px-xl flex-shrink-0">
      <button
        onClick={onMenuToggle}
        className="lg:hidden w-[36px] h-[36px] flex items-center justify-center rounded-sm hover:bg-kore-surface transition-colors"
        aria-label="Menue oeffnen"
      >
        <Menu size={20} className="text-kore-ink" />
      </button>

      {/* Spacer for desktop (no hamburger) */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-md-sm">
        <span className="font-body text-caption text-kore-mid hidden sm:inline">
          {ROLE_LABELS[user?.role || ''] || ''}
        </span>
        <div className="w-[32px] h-[32px] rounded-full bg-kore-surface flex items-center justify-center">
          <User size={16} className="text-kore-mid" />
        </div>
        <span className="font-body text-small text-kore-ink hidden sm:inline">{user?.name}</span>
      </div>
    </header>
  );
}
