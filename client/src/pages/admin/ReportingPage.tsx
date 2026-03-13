import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Users, Store, MapPin } from 'lucide-react';
import { useReportingHierarchy } from '../../hooks/useReporting';
import { useTenants } from '../../hooks/useTenants';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole, ReportingManager, ReportingStore } from '@shared/types';

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const ROLE_COLORS: Record<string, string> = {
  tenant_admin: 'bg-blue-100 text-blue-800',
  regional_manager: 'bg-amber-100 text-amber-800',
  multisite_manager: 'bg-teal-100 text-teal-800',
  store_manager: 'bg-green-100 text-green-800',
  learner: 'bg-gray-100 text-gray-700',
};

const ROLE_ORDER: UserRole[] = [
  'tenant_admin',
  'regional_manager',
  'multisite_manager',
  'store_manager',
  'learner',
];

type ViewMode = 'manager' | 'store';

/** Store-Karte mit Benutzerliste */
function StoreCard({ store }: { store: ReportingStore }) {
  return (
    <div className="bg-kore-white border border-kore-border">
      <div className="px-md sm:px-xl py-md border-b border-kore-border flex items-center justify-between">
        <div className="flex items-center gap-md">
          <Link
            to={`/admin/stores/${store.id}`}
            className="font-display text-h3 text-kore-ink hover:text-kore-brass transition-colors"
          >
            {store.name}
          </Link>
          {store.city && (
            <span className="flex items-center gap-xs font-body text-small text-kore-mid">
              <MapPin size={12} />
              {store.city}
            </span>
          )}
        </div>
        <span className="font-body text-small text-kore-mid">
          {store.users.length} Benutzer
        </span>
      </div>

      {store.users.length > 0 ? (
        <div className="px-md sm:px-xl py-md">
          <div className="flex flex-col gap-xs">
            {ROLE_ORDER.map((role) => {
              const usersForRole = store.users.filter((u) => u.role === role);
              if (usersForRole.length === 0) return null;

              return usersForRole.map((u) => (
                <div key={u.id} className="flex items-center gap-md py-xs">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full min-w-[120px] justify-center ${ROLE_COLORS[u.role] || ''}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <Link
                    to={`/admin/users/${u.id}`}
                    className="font-body text-body text-kore-ink hover:text-kore-brass transition-colors"
                  >
                    {u.name}
                  </Link>
                  <span className="font-body text-small text-kore-mid">{u.email}</span>
                </div>
              ));
            })}
          </div>
        </div>
      ) : (
        <div className="px-md sm:px-xl py-md">
          <p className="font-body text-small text-kore-mid italic">
            Keine Benutzer zugewiesen
          </p>
        </div>
      )}
    </div>
  );
}

export function ReportingPage() {
  const user = useAuthStore((s) => s.user);
  const isKoreAdmin = user?.role === 'kore_admin';

  const { data: tenants } = useTenants(isKoreAdmin ? {} : undefined);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('manager');

  // Für tenant_admin: eigene tenantId, für kore_admin: gewählter Tenant
  const effectiveTenantId = isKoreAdmin ? selectedTenantId : user?.tenantId;

  const { data: hierarchy, isLoading } = useReportingHierarchy(effectiveTenantId || undefined);

  // Wenn kore_admin und noch kein Tenant gewählt, ersten Tenant auswählen
  const tenantList = tenants?.data || [];
  if (isKoreAdmin && !selectedTenantId && tenantList.length > 0) {
    setSelectedTenantId(tenantList[0]!.id);
  }

  // Manager nach Rolle gruppieren
  const managersByRole: Record<string, ReportingManager[]> = {};
  if (hierarchy?.managers) {
    for (const mgr of hierarchy.managers) {
      if (!managersByRole[mgr.role]) managersByRole[mgr.role] = [];
      managersByRole[mgr.role]!.push(mgr);
    }
  }

  // Gesamtzahl aller Stores (Regionen + nicht zugeordnete)
  const totalStoreCount = hierarchy
    ? (hierarchy.regions?.reduce((sum, r) => sum + r.stores.length, 0) ?? 0) + hierarchy.stores.length
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-lg sm:mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-sand-50 flex items-center justify-center flex-shrink-0">
            <GitBranch className="w-5 h-5 text-kore-brass" />
          </div>
          <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">Organisationsstruktur</h1>
        </div>
      </div>

      {/* Controls: Tenant Selector + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-md mb-xl">
        {/* Tenant Selector (kore_admin only) */}
        {isKoreAdmin && (
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="px-md py-sm border border-kore-border font-body text-body text-kore-ink bg-kore-white focus:outline-none focus:border-kore-brass"
          >
            <option value="">Kunde wählen...</option>
            {tenantList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {/* View Toggle */}
        <div className="flex border border-kore-border bg-kore-white">
          <button
            onClick={() => setViewMode('manager')}
            className={`flex items-center gap-xs px-md py-sm font-body text-small transition-colors ${
              viewMode === 'manager'
                ? 'bg-kore-brass text-kore-white'
                : 'text-kore-mid hover:text-kore-ink'
            }`}
          >
            <Users size={14} />
            Manager-Ansicht
          </button>
          <button
            onClick={() => setViewMode('store')}
            className={`flex items-center gap-xs px-md py-sm font-body text-small transition-colors ${
              viewMode === 'store'
                ? 'bg-kore-brass text-kore-white'
                : 'text-kore-mid hover:text-kore-ink'
            }`}
          >
            <Store size={14} />
            Store-Ansicht
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <p className="text-kore-mid font-body">Lade Organisationsstruktur...</p>
      )}

      {/* No Tenant Selected */}
      {isKoreAdmin && !selectedTenantId && !isLoading && (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <p className="font-body text-body text-kore-mid">
            Bitte wählen Sie einen Kunden aus, um die Organisationsstruktur anzuzeigen.
          </p>
        </div>
      )}

      {/* Content */}
      {hierarchy && !isLoading && (
        <>
          {/* Tenant Header */}
          <div className="bg-kore-white border border-kore-border px-md sm:px-xl py-md mb-lg">
            <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Kunde</p>
            <p className="font-display text-h3 text-kore-ink">{hierarchy.tenant.name}</p>
            <p className="font-body text-small text-kore-mid mt-xs">
              {totalStoreCount} Stores · {hierarchy.regions?.length ?? 0} Regionen · {hierarchy.managers.length} Benutzer
            </p>
          </div>

          {viewMode === 'manager' ? (
            /* === Manager-Ansicht: Wer sieht was? === */
            <div className="flex flex-col gap-lg">
              {ROLE_ORDER.map((role) => {
                const mgrs = managersByRole[role];
                if (!mgrs || mgrs.length === 0) return null;

                return (
                  <div key={role} className="bg-kore-white border border-kore-border">
                    <div className="px-md sm:px-xl py-md border-b border-kore-border">
                      <div className="flex items-center gap-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[role] || ''}`}>
                          {ROLE_LABELS[role] || role}
                        </span>
                        <span className="font-body text-small text-kore-mid">
                          ({mgrs.length})
                        </span>
                      </div>
                    </div>
                    <div className="divide-y divide-kore-border">
                      {mgrs.map((mgr) => (
                        <div key={mgr.id} className="px-md sm:px-xl py-md">
                          <div className="flex items-center justify-between mb-sm">
                            <Link
                              to={`/admin/users/${mgr.id}`}
                              className="font-body text-body text-kore-ink font-medium hover:text-kore-brass transition-colors"
                            >
                              {mgr.name}
                            </Link>
                            <span className="font-body text-small text-kore-mid">{mgr.email}</span>
                          </div>
                          {mgr.stores.length > 0 ? (
                            <div className="flex flex-wrap gap-sm">
                              {mgr.stores.map((s) => (
                                <Link
                                  key={s.id}
                                  to={`/admin/stores/${s.id}`}
                                  className="inline-flex items-center gap-xs px-md py-xs bg-kore-surface border border-kore-border text-kore-ink font-body text-small hover:border-kore-brass transition-colors"
                                >
                                  <Store size={12} className="text-kore-mid" />
                                  {s.name}
                                  {s.city && (
                                    <span className="text-kore-mid flex items-center gap-0.5">
                                      <MapPin size={10} />
                                      {s.city}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <p className="font-body text-small text-kore-mid italic">
                              Keine Stores zugewiesen
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {Object.keys(managersByRole).length === 0 && (
                <div className="bg-kore-white border border-kore-border p-xl text-center">
                  <p className="font-body text-body text-kore-mid">
                    Keine Benutzer mit Store-Zuweisungen gefunden.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* === Store-Ansicht: Regionen → Stores → Benutzer === */
            <div className="flex flex-col gap-lg">
              {/* Regionen mit ihren Stores */}
              {hierarchy.regions?.map((region) => (
                <div key={region.id}>
                  <div className="flex items-center gap-sm mb-md">
                    <MapPin size={16} className="text-kore-brass" />
                    <h3 className="font-display text-h3 text-kore-ink">{region.name}</h3>
                    {region.description && (
                      <span className="font-body text-small text-kore-mid">— {region.description}</span>
                    )}
                    <span className="font-body text-small text-kore-mid">
                      ({region.stores.length} Stores)
                    </span>
                  </div>

                  {region.stores.length > 0 ? (
                    <div className="flex flex-col gap-md ml-md">
                      {region.stores.map((store) => (
                        <StoreCard key={store.id} store={store} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-kore-white border border-kore-border p-lg ml-md">
                      <p className="font-body text-small text-kore-mid italic">
                        Keine Stores in dieser Region.
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Nicht zugeordnete Stores */}
              {hierarchy.stores.length > 0 && (
                <div>
                  <div className="flex items-center gap-sm mb-md">
                    <Store size={16} className="text-kore-mid" />
                    <h3 className="font-display text-h3 text-kore-ink">Ohne Region</h3>
                    <span className="font-body text-small text-kore-mid">
                      ({hierarchy.stores.length} Stores)
                    </span>
                  </div>
                  <div className="flex flex-col gap-md ml-md">
                    {hierarchy.stores.map((store) => (
                      <StoreCard key={store.id} store={store} />
                    ))}
                  </div>
                </div>
              )}

              {totalStoreCount === 0 && (
                <div className="bg-kore-white border border-kore-border p-xl text-center">
                  <p className="font-body text-body text-kore-mid">Keine Stores vorhanden.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
