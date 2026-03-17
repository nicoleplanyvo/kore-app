import {
  Building2, Store, Wrench, TrendingUp, Euro, ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { useDashboardStats, useTenants } from '../../hooks/useTenants';
import { useAuthStore } from '../../stores/authStore';
import { hasMinRole, type UserRole } from '@shared/types';
import { Badge } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import t from '../../locales/de.json';

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-kore-white border border-kore-border p-xl flex items-start gap-lg">
      <div
        className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0"
        style={{ background: color || 'var(--kore-surface)' }}
      >
        <Icon size={20} className="text-kore-ink" />
      </div>
      <div>
        <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">{label}</p>
        <p className="font-display text-h2 text-kore-ink mt-xs">{value}</p>
      </div>
    </div>
  );
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'brass'> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'error',
  TRIALING: 'brass',
};

/** kore_admin Dashboard: Plattform-Stats + Recent Tenants */
function KoreAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTenants } = useTenants({ page: 1, pageSize: 5 });
  const navigate = useNavigate();

  const formatMrr = (cents: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg mb-2xl">
        <StatsCard
          icon={Building2}
          label={t.dashboard.totalTenants}
          value={statsLoading ? '...' : stats?.totalTenants ?? 0}
        />
        <StatsCard
          icon={Store}
          label={t.dashboard.totalStores}
          value={statsLoading ? '...' : stats?.totalStores ?? 0}
          color="rgba(107, 140, 107, 0.1)"
        />
        <StatsCard
          icon={Wrench}
          label={t.dashboard.totalToolBookings}
          value={statsLoading ? '...' : stats?.totalToolBookings ?? 0}
          color="rgba(158, 132, 96, 0.1)"
        />
        <StatsCard
          icon={TrendingUp}
          label={t.dashboard.activeTenants}
          value={statsLoading ? '...' : stats?.activeTenants ?? 0}
        />
        <StatsCard
          icon={Store}
          label={t.dashboard.activeStores}
          value={statsLoading ? '...' : stats?.activeStores ?? 0}
          color="rgba(107, 140, 107, 0.1)"
        />
        <StatsCard
          icon={Euro}
          label={t.dashboard.mrr}
          value={statsLoading ? '...' : formatMrr(stats?.mrr ?? 0)}
          color="rgba(158, 132, 96, 0.15)"
        />
      </div>

      <div className="bg-kore-white border border-kore-border">
        <div className="px-xl py-lg border-b border-kore-border">
          <h2 className="font-display text-h3 text-kore-ink">{t.dashboard.recentTenants}</h2>
        </div>
        <div className="divide-y divide-kore-border">
          {recentTenants?.data.map((tenant) => (
            <div
              key={tenant.id}
              className="px-md sm:px-xl py-md flex items-start sm:items-center justify-between gap-md cursor-pointer hover:bg-kore-surface transition-colors"
              onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
            >
              <div className="min-w-0">
                <p className="font-body text-body text-kore-ink font-normal truncate">{tenant.name}</p>
                <p className="font-body text-small text-kore-mid">{tenant.slug}</p>
              </div>
              <div className="flex items-center gap-xs sm:gap-md-sm flex-wrap justify-end flex-shrink-0">
                <Badge variant={statusVariant[tenant.status] ?? 'neutral'}>
                  {t.status[tenant.status as keyof typeof t.status]}
                </Badge>
                <span className="text-small text-kore-mid">
                  {tenant._count?.stores ?? 0} Stores
                </span>
              </div>
            </div>
          ))}
          {recentTenants?.data.length === 0 && (
            <p className="px-xl py-lg text-kore-mid font-body text-small">{t.tenants.empty}</p>
          )}
        </div>
      </div>
    </>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const userRole = (user?.role || 'learner') as UserRole;

  const roleLabels: Record<string, string> = {
    kore_admin: 'Plattform-Admin',
    tenant_admin: 'Administrator',
    regional_manager: 'Regional Manager',
    multisite_manager: 'Multisite Manager',
    store_manager: 'Store Manager',
    learner: 'Mitarbeiter',
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-lg sm:mb-xl">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">
          Hallo, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="font-body text-small text-kore-mid mt-xs">
          {roleLabels[userRole] || userRole}
        </p>
      </div>

      {/* Link zur KORE App */}
      <div className="bg-kore-white border border-kore-border p-xl mb-xl flex items-center justify-between">
        <div>
          <h2 className="font-display text-h3 text-kore-ink">KORE App</h2>
          <p className="font-body text-small text-kore-mid mt-xs">
            Tools nutzen, Daten erfassen, Performance tracken
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-md-sm px-lg py-md bg-kore-ink text-kore-white font-body text-small hover:bg-kore-ink/90 transition-colors"
        >
          <span>Zur App</span>
          <ExternalLink size={16} />
        </a>
      </div>

      {/* kore_admin: Plattform-Stats */}
      {hasMinRole(userRole, 'kore_admin') && <KoreAdminDashboard />}
    </div>
  );
}
