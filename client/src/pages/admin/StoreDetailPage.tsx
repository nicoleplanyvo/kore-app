import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Users, Pencil, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useStore, useStoreTools, useAssignStoreTool, useUnassignStoreTool, useStoreUsers, useUpdateStoreUsers } from '../../hooks/useStores';
import { TOOL_CATEGORIES, CATEGORY_ORDER } from '../../lib/moduleCategories';
import { useAuthStore } from '../../stores/authStore';
import { hasMinRole, type UserRole } from '@shared/types';
import t from '../../locales/de.json';

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const ROLE_LABELS: Record<string, string> = {
  kore_admin: 'Super Admin',
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const ROLE_COLORS: Record<string, string> = {
  kore_admin: 'bg-purple-100 text-purple-800',
  tenant_admin: 'bg-blue-100 text-blue-800',
  regional_manager: 'bg-amber-100 text-amber-800',
  multisite_manager: 'bg-teal-100 text-teal-800',
  store_manager: 'bg-green-100 text-green-800',
  learner: 'bg-gray-100 text-gray-700',
};

const ROLE_ORDER: string[] = ['tenant_admin', 'regional_manager', 'multisite_manager', 'store_manager', 'learner'];

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canManageUsers = user ? hasMinRole(user.role as UserRole, 'store_manager') : false;
  const { data: store, isLoading } = useStore(id);
  const { data: storeToolsData } = useStoreTools(id);
  const { data: storeUsersData } = useStoreUsers(canManageUsers ? id : undefined);
  const assignTool = useAssignStoreTool(id!);
  const unassignTool = useUnassignStoreTool(id!);
  const updateStoreUsers = useUpdateStoreUsers(id!);
  const [editingUsers, setEditingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  if (isLoading) {
    return <p className="text-kore-mid font-body">{t.common.loading}</p>;
  }

  if (!store) {
    return <p className="text-kore-error font-body">Store nicht gefunden.</p>;
  }

  // Group tools by category
  const toolsByCategory: Record<string, NonNullable<typeof storeToolsData>['tools']> = {};
  if (storeToolsData?.tools) {
    for (const tool of storeToolsData.tools) {
      if (!toolsByCategory[tool.category]) toolsByCategory[tool.category] = [];
      toolsByCategory[tool.category]!.push(tool);
    }
  }

  // Calc monthly cost
  const monthlyCost = store.tools
    .filter((ta) => ta.isActive)
    .reduce((sum, ta) => sum + ta.tool.priceMonthly, 0);

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-sm text-kore-mid hover:text-kore-ink font-body text-small mb-lg transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <div className="flex flex-wrap items-center gap-md sm:gap-lg mb-lg sm:mb-xl">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">{store.name}</h1>
        <Badge variant={store.isActive ? 'success' : 'error'}>
          {store.isActive ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      {/* Store Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg mb-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Kunde</p>
          <p className="font-display text-h3 text-kore-ink mt-xs">{store.tenant.name}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Standort</p>
          <p className="font-display text-h3 text-kore-ink mt-xs">{store.city || '—'}</p>
          <p className="font-body text-small text-kore-mid">{store.address || ''}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Monatliche Kosten</p>
          <p className="font-display text-h3 text-kore-ink mt-xs">{formatPrice(monthlyCost)}</p>
          <p className="font-body text-small text-kore-mid">{store.tools.filter((ta) => ta.isActive).length} aktive Tools</p>
        </div>
      </div>

      {/* Zugewiesene Benutzer */}
      {canManageUsers && storeUsersData && (
        <div className="bg-kore-white border border-kore-border mb-xl">
          <div className="px-md sm:px-xl py-md border-b border-kore-border flex items-center justify-between">
            <div className="flex items-center gap-md">
              <Users size={18} className="text-kore-mid" />
              <h2 className="font-display text-h3 text-kore-ink">Zugewiesene Benutzer</h2>
              <span className="font-body text-small text-kore-mid">
                ({storeUsersData.assignments.length})
              </span>
            </div>
            {!editingUsers ? (
              <button
                onClick={() => {
                  setSelectedUserIds(storeUsersData.assignments.map((a) => a.userId));
                  setEditingUsers(true);
                }}
                className="flex items-center gap-xs px-md py-sm font-body text-small text-kore-mid hover:text-kore-ink border border-kore-border hover:border-kore-brass transition-colors"
              >
                <Pencil size={14} />
                Bearbeiten
              </button>
            ) : (
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => setEditingUsers(false)}
                  className="flex items-center gap-xs px-md py-sm font-body text-small text-kore-mid hover:text-kore-ink border border-kore-border transition-colors"
                >
                  <X size={14} />
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    updateStoreUsers.mutate(selectedUserIds, {
                      onSuccess: () => setEditingUsers(false),
                    });
                  }}
                  disabled={updateStoreUsers.isPending}
                  className="flex items-center gap-xs px-md py-sm font-body text-small text-kore-white bg-kore-brass hover:bg-kore-brass/90 border border-kore-brass transition-colors disabled:opacity-50"
                >
                  <Save size={14} />
                  Speichern
                </button>
              </div>
            )}
          </div>

          {editingUsers ? (
            /* Edit Mode: Checkbox-Liste gruppiert nach Rolle */
            <div className="divide-y divide-kore-border">
              {ROLE_ORDER.map((role) => {
                const allForRole = [
                  ...storeUsersData.assignments
                    .filter((a) => a.user.role === role)
                    .map((a) => a.user),
                  ...storeUsersData.availableUsers.filter((u) => u.role === role),
                ];
                if (allForRole.length === 0) return null;

                return (
                  <div key={role} className="px-md sm:px-xl py-md">
                    <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em] mb-sm">
                      {ROLE_LABELS[role] || role}
                    </p>
                    <div className="flex flex-col gap-xs">
                      {allForRole.map((u) => (
                        <label
                          key={u.id}
                          className="flex items-center gap-md py-xs cursor-pointer hover:bg-kore-surface/50 px-sm -mx-sm rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={(e) => {
                              setSelectedUserIds((prev) =>
                                e.target.checked
                                  ? [...prev, u.id]
                                  : prev.filter((uid) => uid !== u.id),
                              );
                            }}
                            className="w-4 h-4 accent-kore-brass"
                          />
                          <span className="font-body text-body text-kore-ink">{u.name}</span>
                          <span className="font-body text-small text-kore-mid">{u.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : storeUsersData.assignments.length === 0 ? (
            <div className="px-md sm:px-xl py-lg">
              <p className="font-body text-body text-kore-mid">Keine Benutzer zugewiesen.</p>
            </div>
          ) : (
            /* View Mode: Liste der zugewiesenen Benutzer */
            <div className="divide-y divide-kore-border">
              {ROLE_ORDER.map((role) => {
                const usersForRole = storeUsersData.assignments.filter(
                  (a) => a.user.role === role,
                );
                if (usersForRole.length === 0) return null;

                return (
                  <div key={role} className="px-md sm:px-xl py-md">
                    <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em] mb-sm">
                      {ROLE_LABELS[role] || role}
                    </p>
                    <div className="flex flex-col gap-xs">
                      {usersForRole.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-xs">
                          <div className="flex items-center gap-md">
                            <Link
                              to={`/admin/users/${a.user.id}`}
                              className="font-body text-body text-kore-ink hover:text-kore-brass transition-colors"
                            >
                              {a.user.name}
                            </Link>
                            <span className="font-body text-small text-kore-mid">{a.user.email}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[a.user.role] || ''}`}>
                              {ROLE_LABELS[a.user.role] || a.user.role}
                            </span>
                          </div>
                          <span className="font-body text-caption text-kore-mid">
                            seit {new Date(a.assignedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tool Assignments by Category */}
      <h2 className="font-display text-h3 text-kore-ink mb-lg">Tools verwalten</h2>
      <div className="flex flex-col gap-lg">
        {CATEGORY_ORDER.map((catKey) => {
          const catInfo = TOOL_CATEGORIES[catKey];
          const tools = toolsByCategory[catKey];
          if (!catInfo || !tools || tools.length === 0) return null;

          return (
            <div key={catKey} className="bg-kore-white border border-kore-border">
              <div className="px-md sm:px-xl py-md border-b border-kore-border">
                <h3 className="font-display text-body text-kore-ink font-normal">{catInfo.label}</h3>
              </div>
              <div className="divide-y divide-kore-border">
                {tools.map((tool) => (
                  <div key={tool.id} className="px-md sm:px-xl py-md flex items-center justify-between gap-md">
                    <div className="min-w-0">
                      <p className="font-body text-body text-kore-ink font-normal">{tool.name}</p>
                      <p className="font-body text-small text-kore-mid">
                        {formatPrice(tool.priceMonthly)} / Monat
                      </p>
                    </div>
                    {tool.assigned ? (
                      <button
                        onClick={() => unassignTool.mutate(tool.id)}
                        className="flex items-center gap-xs px-md py-sm bg-green-50 text-green-700 font-body text-small border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                      >
                        <Check size={14} />
                        <span>Aktiv</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => assignTool.mutate(tool.id)}
                        className="flex items-center gap-xs px-md py-sm bg-kore-surface text-kore-mid font-body text-small border border-kore-border hover:border-kore-brass hover:text-kore-ink transition-colors"
                      >
                        <Plus size={14} />
                        <span>Buchen</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
