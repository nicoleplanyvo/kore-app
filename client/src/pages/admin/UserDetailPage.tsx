import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, Store, Eye, Save, Trash2, Globe } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { useUser, useUpdateUser, useDeleteUser, useImpersonate, useUpdateUserStores } from '../../hooks/useUsers';
import { useStores } from '../../hooks/useStores';
import { useRegions, useUpdateUserRegions } from '../../hooks/useRegions';
import { useAuthStore } from '../../stores/authStore';
import { canCreateRole, hasMinRole, type UserRole } from '@shared/types';

const ROLE_LABELS: Record<string, string> = {
  kore_admin: 'Super Admin',
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'tenant_admin', label: 'Kunden-Admin' },
  { value: 'regional_manager', label: 'Regional Manager' },
  { value: 'multisite_manager', label: 'Multisite Manager' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'learner', label: 'Mitarbeiter' },
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const { data: userData, isLoading } = useUser(id);
  const updateUser = useUpdateUser(id);
  const deleteUser = useDeleteUser();
  const impersonate = useImpersonate();
  const updateStores = useUpdateUserStores(id);

  // Edit states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [storesEditing, setStoresEditing] = useState(false);
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  const [regionsEditing, setRegionsEditing] = useState(false);

  // Load stores for the user's tenant
  const tenantId = userData?.tenantId || currentUser?.tenantId;
  const { data: allStores } = useStores(tenantId || undefined);
  const { data: allRegions } = useRegions(tenantId || undefined);
  const updateRegions = useUpdateUserRegions(id || '');

  const isKoreAdmin = currentUser?.role === 'kore_admin';
  const canManageRegions = hasMinRole((currentUser?.role || 'learner') as UserRole, 'tenant_admin');
  const isRegionalManager = userData?.role === 'regional_manager';

  const startEditing = () => {
    if (!userData) return;
    setEditName(userData.name);
    setEditEmail(userData.email);
    setEditRole(userData.role);
    setEditActive(userData.isActive);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        name: editName,
        email: editEmail,
        role: editRole as UserRole,
        isActive: editActive,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Benutzer wirklich deaktivieren?')) return;
    try {
      await deleteUser.mutateAsync(id!);
      navigate('/admin/users');
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  const handleImpersonate = async () => {
    try {
      await impersonate.mutateAsync(id!);
      navigate('/');
    } catch (err) {
      console.error('Impersonate error:', err);
    }
  };

  const startStoreEditing = () => {
    setSelectedStoreIds(userData?.storeAssignments.map((a) => a.storeId) || []);
    setStoresEditing(true);
  };

  const handleSaveStores = async () => {
    try {
      await updateStores.mutateAsync(selectedStoreIds);
      setStoresEditing(false);
    } catch (err) {
      console.error('Update stores error:', err);
    }
  };

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId],
    );
  };

  const startRegionEditing = () => {
    setSelectedRegionIds(userData?.regionAssignments?.map((a) => a.regionId) || []);
    setRegionsEditing(true);
  };

  const handleSaveRegions = async () => {
    try {
      await updateRegions.mutateAsync(selectedRegionIds);
      setRegionsEditing(false);
    } catch (err) {
      console.error('Update regions error:', err);
    }
  };

  const toggleRegion = (regionId: string) => {
    setSelectedRegionIds((prev) =>
      prev.includes(regionId)
        ? prev.filter((id) => id !== regionId)
        : [...prev, regionId],
    );
  };

  // Filtere verfügbare Rollen: nur Rollen strikt unter der eigenen
  const availableRoles = ROLE_OPTIONS.filter((r) =>
    canCreateRole((currentUser?.role || 'learner') as UserRole, r.value),
  );

  if (isLoading) {
    return <p className="text-kore-mid font-body">Lade Benutzer...</p>;
  }

  if (!userData) {
    return <p className="text-kore-error font-body">Benutzer nicht gefunden.</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-sm text-kore-mid hover:text-kore-ink font-body text-small mb-lg transition-colors"
      >
        <ArrowLeft size={16} />
        Zurück
      </button>

      <div className="flex flex-wrap items-center gap-md sm:gap-lg mb-lg sm:mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-full bg-kore-surface flex items-center justify-center">
            <UserCog className="w-5 h-5 text-kore-mid" />
          </div>
          <div>
            <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">{userData.name}</h1>
            <p className="font-body text-small text-kore-mid">{userData.email}</p>
          </div>
        </div>
        <Badge variant={userData.isActive ? 'success' : 'error'}>
          {userData.isActive ? 'Aktiv' : 'Inaktiv'}
        </Badge>
        <Badge variant="brass">{ROLE_LABELS[userData.role] || userData.role}</Badge>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-md mb-xl">
        {!isEditing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white font-body text-small hover:bg-kore-ink/90 transition-colors"
          >
            Bearbeiten
          </button>
        )}
        {isKoreAdmin && userData.role !== 'kore_admin' && (
          <button
            onClick={handleImpersonate}
            disabled={impersonate.isPending}
            className="flex items-center gap-xs px-lg py-sm bg-amber-500 text-white font-body text-small hover:bg-amber-600 transition-colors"
          >
            <Eye size={14} />
            Als Benutzer anmelden
          </button>
        )}
        {userData.id !== currentUser?.id && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-xs px-lg py-sm bg-kore-surface text-kore-error font-body text-small border border-kore-border hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Deaktivieren
          </button>
        )}
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-kore-white border border-kore-border p-lg sm:p-xl mb-xl max-w-2xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Benutzer bearbeiten</h2>
          <div className="flex flex-col gap-lg">
            <div>
              <label className="block font-body text-small text-kore-mid mb-xs">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-md py-sm border border-kore-border font-body text-small text-kore-ink focus:outline-none focus:border-kore-brass"
              />
            </div>
            <div>
              <label className="block font-body text-small text-kore-mid mb-xs">E-Mail</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-md py-sm border border-kore-border font-body text-small text-kore-ink focus:outline-none focus:border-kore-brass"
              />
            </div>
            <div>
              <label className="block font-body text-small text-kore-mid mb-xs">Rolle</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-md py-sm border border-kore-border bg-kore-white font-body text-small text-kore-ink focus:outline-none focus:border-kore-brass"
              >
                {availableRoles.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-md cursor-pointer">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="w-4 h-4 accent-kore-brass"
              />
              <span className="font-body text-small text-kore-ink">Aktiv</span>
            </label>
            <div className="flex gap-md">
              <button
                onClick={handleSave}
                disabled={updateUser.isPending}
                className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white font-body text-small hover:bg-kore-ink/90 transition-colors"
              >
                <Save size={14} />
                {updateUser.isPending ? 'Speichere...' : 'Speichern'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-lg py-sm font-body text-small text-kore-mid hover:text-kore-ink border border-kore-border transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-lg mb-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Mandant</p>
          <p className="font-display text-h3 text-kore-ink mt-xs">{userData.tenant?.name || '—'}</p>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Letzter Login</p>
          <p className="font-display text-h3 text-kore-ink mt-xs">
            {userData.lastLoginAt
              ? new Date(userData.lastLoginAt).toLocaleDateString('de-DE')
              : '—'
            }
          </p>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <p className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Erstellt</p>
          <p className="font-display text-h3 text-kore-ink mt-xs">
            {new Date(userData.createdAt).toLocaleDateString('de-DE')}
          </p>
        </div>
      </div>

      {/* Store Assignments */}
      <div className="bg-kore-white border border-kore-border">
        <div className="px-md sm:px-xl py-md border-b border-kore-border flex items-center justify-between">
          <div className="flex items-center gap-md">
            <Store size={18} className="text-kore-mid" />
            <h2 className="font-display text-h3 text-kore-ink">Store-Zuweisungen</h2>
          </div>
          {!storesEditing ? (
            <button
              onClick={startStoreEditing}
              className="font-body text-small text-kore-brass hover:text-kore-ink transition-colors"
            >
              Bearbeiten
            </button>
          ) : (
            <div className="flex gap-sm">
              <button
                onClick={handleSaveStores}
                disabled={updateStores.isPending}
                className="flex items-center gap-xs px-md py-xs bg-kore-ink text-kore-white font-body text-caption hover:bg-kore-ink/90 transition-colors"
              >
                <Save size={12} />
                Speichern
              </button>
              <button
                onClick={() => setStoresEditing(false)}
                className="px-md py-xs font-body text-caption text-kore-mid hover:text-kore-ink border border-kore-border transition-colors"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>

        {storesEditing ? (
          <div className="divide-y divide-kore-border">
            {allStores?.map((store) => (
              <label key={store.id} className="flex items-center gap-md px-md sm:px-xl py-md hover:bg-kore-surface/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStoreIds.includes(store.id)}
                  onChange={() => toggleStore(store.id)}
                  className="w-4 h-4 accent-kore-brass"
                />
                <div>
                  <p className="font-body text-body text-kore-ink">{store.name}</p>
                  <p className="font-body text-small text-kore-mid">{store.city || ''}</p>
                </div>
              </label>
            ))}
            {(!allStores || allStores.length === 0) && (
              <p className="px-xl py-md text-kore-mid font-body text-small">Keine Stores verfügbar.</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-kore-border">
            {userData.storeAssignments.length > 0 ? (
              userData.storeAssignments.map((a) => (
                <div key={a.id} className="px-md sm:px-xl py-md flex items-center justify-between">
                  <div>
                    <p className="font-body text-body text-kore-ink">{a.store.name}</p>
                    <p className="font-body text-small text-kore-mid">{a.store.city || ''}</p>
                  </div>
                  <span className="font-body text-caption text-kore-mid">
                    seit {new Date(a.assignedAt).toLocaleDateString('de-DE')}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-xl py-md text-kore-mid font-body text-small">
                Keine Stores zugewiesen.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Region Assignments — nur für regional_manager, sichtbar für tenant_admin+ */}
      {isRegionalManager && canManageRegions && (
        <div className="bg-kore-white border border-kore-border mt-lg">
          <div className="px-md sm:px-xl py-md border-b border-kore-border flex items-center justify-between">
            <div className="flex items-center gap-md">
              <Globe size={18} className="text-kore-mid" />
              <h2 className="font-display text-h3 text-kore-ink">Region-Zuweisungen</h2>
            </div>
            {!regionsEditing ? (
              <button
                onClick={startRegionEditing}
                className="font-body text-small text-kore-brass hover:text-kore-ink transition-colors"
              >
                Bearbeiten
              </button>
            ) : (
              <div className="flex gap-sm">
                <button
                  onClick={handleSaveRegions}
                  disabled={updateRegions.isPending}
                  className="flex items-center gap-xs px-md py-xs bg-kore-ink text-kore-white font-body text-caption hover:bg-kore-ink/90 transition-colors"
                >
                  <Save size={12} />
                  Speichern
                </button>
                <button
                  onClick={() => setRegionsEditing(false)}
                  className="px-md py-xs font-body text-caption text-kore-mid hover:text-kore-ink border border-kore-border transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>

          {regionsEditing ? (
            <div className="divide-y divide-kore-border">
              {allRegions?.map((region) => (
                <label key={region.id} className="flex items-center gap-md px-md sm:px-xl py-md hover:bg-kore-surface/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRegionIds.includes(region.id)}
                    onChange={() => toggleRegion(region.id)}
                    className="w-4 h-4 accent-kore-brass"
                  />
                  <span className="font-body text-body text-kore-ink">{region.name}</span>
                </label>
              ))}
              {(!allRegions || allRegions.length === 0) && (
                <p className="px-xl py-md text-kore-mid font-body text-small">Keine Regionen verfügbar.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-kore-border">
              {userData.regionAssignments && userData.regionAssignments.length > 0 ? (
                userData.regionAssignments.map((a) => (
                  <div key={a.id} className="px-md sm:px-xl py-md flex items-center justify-between">
                    <p className="font-body text-body text-kore-ink">{a.region.name}</p>
                    <span className="font-body text-caption text-kore-mid">
                      seit {new Date(a.assignedAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-xl py-md text-kore-mid font-body text-small">
                  Keine Regionen zugewiesen.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
