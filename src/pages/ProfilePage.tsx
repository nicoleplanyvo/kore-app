import { LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useLogout } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import t from '../locales/de.json';

const roleLabels = t.roles as Record<string, string>;

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const logout = useLogout();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate('/login', { replace: true });
  };

  return (
    <div className="px-lg py-lg space-y-xl max-w-lg mx-auto">
      <h1 className="font-display text-h2 text-kore-ink">{t.profile.title}</h1>

      {/* User Info */}
      <Card className="space-y-md">
        <div className="w-16 h-16 bg-kore-surface flex items-center justify-center mx-auto">
          <span className="font-display text-h2 text-kore-brass">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </span>
        </div>
        <div className="text-center">
          <h2 className="text-body font-medium text-kore-ink">{user?.name}</h2>
          <p className="text-small text-kore-mid">{user?.email}</p>
        </div>
      </Card>

      {/* Details */}
      <div className="space-y-sm">
        <Card className="flex items-center justify-between">
          <span className="text-caption text-kore-mid uppercase tracking-widest">{t.profile.role}</span>
          <span className="text-small text-kore-ink">{roleLabels[user?.role ?? 'learner']}</span>
        </Card>

        <Card className="flex items-center justify-between">
          <span className="text-caption text-kore-mid uppercase tracking-widest">{t.profile.email}</span>
          <span className="text-small text-kore-ink">{user?.email}</span>
        </Card>

        <Card className="flex items-center justify-between">
          <span className="text-caption text-kore-mid uppercase tracking-widest">{t.profile.version}</span>
          <span className="text-small text-kore-mid">0.1.0</span>
        </Card>
      </div>

      {/* Logout */}
      <Button
        variant="ghost"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="w-full text-kore-error"
        size="lg"
      >
        <LogOut size={18} className="mr-sm" />
        {t.profile.logout}
      </Button>
    </div>
  );
}
