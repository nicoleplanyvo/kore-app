import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch, Store, Users, ChevronDown, ChevronRight,
  MapPin, Wrench,
} from 'lucide-react';
import { useOrgHierarchy } from '../hooks/useAdmin';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Admin',
  regional_manager: 'Regional',
  multisite_manager: 'Multisite',
  store_manager: 'Store Mgr',
  learner: 'Mitarbeiter',
};

export function AdminOrgPage() {
  const user = useAuthStore((s) => s.user);
  const { data: hierarchy, isLoading } = useOrgHierarchy(user?.tenantId || undefined);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());

  const toggleRegion = (id: string) => {
    setExpandedRegions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStore = (id: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) return <LoadingSpinner />;

  if (!hierarchy) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Keine Daten"
        description="Organisation konnte nicht geladen werden."
      />
    );
  }

  const totalStores =
    hierarchy.regions.reduce((sum, r) => sum + r.stores.length, 0) +
    hierarchy.stores.length;

  const totalUsers =
    hierarchy.regions.reduce(
      (sum, r) => sum + r.stores.reduce((s, st) => s + st.users.length, 0),
      0,
    ) + hierarchy.stores.reduce((s, st) => s + st.users.length, 0);

  return (
    <div className="px-lg py-lg space-y-lg max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-display text-h2 text-kore-ink">Organisation</h1>
        <p className="text-small text-kore-mid mt-xs">
          {hierarchy.tenant.name}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-md-sm">
        <Card className="text-center">
          <p className="text-h3 font-display text-kore-brass">{hierarchy.regions.length}</p>
          <p className="text-caption text-kore-mid uppercase tracking-widest">Regionen</p>
        </Card>
        <Card className="text-center">
          <p className="text-h3 font-display text-kore-brass">{totalStores}</p>
          <p className="text-caption text-kore-mid uppercase tracking-widest">Stores</p>
        </Card>
        <Card className="text-center">
          <p className="text-h3 font-display text-kore-brass">{totalUsers}</p>
          <p className="text-caption text-kore-mid uppercase tracking-widest">Benutzer</p>
        </Card>
      </div>

      {/* Regionen */}
      {hierarchy.regions.length > 0 && (
        <div className="space-y-md-sm">
          <h2 className="text-caption text-kore-mid uppercase tracking-widest">
            Regionen
          </h2>
          {hierarchy.regions.map((region) => (
            <div key={region.id}>
              <button
                onClick={() => toggleRegion(region.id)}
                className="w-full"
              >
                <Card className="flex items-center justify-between">
                  <div className="flex items-center gap-md min-w-0">
                    <GitBranch size={20} className="text-kore-brass shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-body font-medium text-kore-ink truncate">
                        {region.name}
                      </p>
                      <p className="text-caption text-kore-mid">
                        {region.stores.length} Stores
                      </p>
                    </div>
                  </div>
                  {expandedRegions.has(region.id) ? (
                    <ChevronDown size={18} className="text-kore-faint shrink-0" />
                  ) : (
                    <ChevronRight size={18} className="text-kore-faint shrink-0" />
                  )}
                </Card>
              </button>

              {expandedRegions.has(region.id) && (
                <div className="ml-md pl-md border-l-2 border-kore-border mt-sm space-y-sm">
                  {region.stores.map((store) => (
                    <StoreItem
                      key={store.id}
                      store={store}
                      expanded={expandedStores.has(store.id)}
                      onToggle={() => toggleStore(store.id)}
                    />
                  ))}
                  {region.stores.length === 0 && (
                    <p className="text-small text-kore-mid py-sm px-md">
                      Keine Stores in dieser Region.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nicht zugeordnete Stores */}
      {hierarchy.stores.length > 0 && (
        <div className="space-y-md-sm">
          <h2 className="text-caption text-kore-mid uppercase tracking-widest">
            {hierarchy.regions.length > 0 ? 'Ohne Region' : 'Stores'}
          </h2>
          {hierarchy.stores.map((store) => (
            <StoreItem
              key={store.id}
              store={store}
              expanded={expandedStores.has(store.id)}
              onToggle={() => toggleStore(store.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// === StoreItem Subcomponent ===

interface StoreItemProps {
  store: {
    id: string;
    name: string;
    city: string | null;
    users: {
      id: string;
      name: string;
      role: string;
      assignedAt: string;
    }[];
  };
  expanded: boolean;
  onToggle: () => void;
}

function StoreItem({ store, expanded, onToggle }: StoreItemProps) {
  return (
    <div>
      <button onClick={onToggle} className="w-full">
        <Card className="flex items-center justify-between">
          <div className="flex items-center gap-md min-w-0">
            <Store size={18} className="text-kore-mid shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-small font-medium text-kore-ink truncate">
                {store.name}
              </p>
              {store.city && (
                <div className="flex items-center gap-xs">
                  <MapPin size={12} className="text-kore-faint" />
                  <span className="text-caption text-kore-mid">{store.city}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-md-sm shrink-0">
            <Badge variant="default">{store.users.length} User</Badge>
            <Link
              to={`/admin/stores/${store.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-kore-brass"
            >
              <Wrench size={16} />
            </Link>
            {expanded ? (
              <ChevronDown size={16} className="text-kore-faint" />
            ) : (
              <ChevronRight size={16} className="text-kore-faint" />
            )}
          </div>
        </Card>
      </button>

      {expanded && store.users.length > 0 && (
        <div className="ml-md pl-md border-l border-kore-border mt-xs space-y-xs">
          {store.users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between py-xs px-md"
            >
              <span className="text-small text-kore-ink truncate">{u.name}</span>
              <span className="text-caption text-kore-mid shrink-0">
                {ROLE_LABELS[u.role] || u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
