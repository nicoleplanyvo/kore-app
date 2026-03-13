import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Plus } from 'lucide-react';
import { Badge, Button, Input } from '@/components/ui';
import { useStores } from '../../hooks/useStores';
import { useAuthStore } from '../../stores/authStore';
import { hasMinRole, type UserRole } from '@shared/types';
import { api } from '../../lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function StoresListPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stores, isLoading } = useStores(user?.tenantId || undefined);
  const queryClient = useQueryClient();

  // Store-Erstellungsformular State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // multisite_manager+ kann Stores erstellen
  const canCreateStore = hasMinRole((user?.role || 'learner') as UserRole, 'multisite_manager');

  // Filtere Stores nach User-Zuweisungen (für Manager/Learner)
  const visibleStores = stores?.filter((store) => {
    if (user?.role === 'kore_admin' || user?.role === 'tenant_admin') return true;
    return user?.storeAssignments?.includes(store.id);
  });

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await api('/api/admin/stores', {
        method: 'POST',
        body: JSON.stringify({
          name: newStoreName.trim(),
          city: newStoreCity.trim() || undefined,
          address: newStoreAddress.trim() || undefined,
          tenantId: user?.tenantId,
        }),
      });
      setNewStoreName('');
      setNewStoreCity('');
      setNewStoreAddress('');
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Fehler beim Erstellen.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-lg sm:mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-sand-50 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-brass" />
          </div>
          <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">Stores</h1>
        </div>
        {canCreateStore && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus size={16} className="mr-1 inline" />
            Store anlegen
          </Button>
        )}
      </div>

      {/* Store-Erstellungsformular */}
      {showCreateForm && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg max-w-lg">
          <h3 className="font-display text-h3 text-kore-ink mb-md">Neuen Store anlegen</h3>
          <form onSubmit={handleCreateStore} className="flex flex-col gap-md">
            <Input
              label="Store-Name"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              required
            />
            <Input
              label="Stadt"
              value={newStoreCity}
              onChange={(e) => setNewStoreCity(e.target.value)}
            />
            <Input
              label="Adresse"
              value={newStoreAddress}
              onChange={(e) => setNewStoreAddress(e.target.value)}
            />
            {createError && (
              <p className="font-body text-small text-kore-error">{createError}</p>
            )}
            <div className="flex gap-sm">
              <Button type="submit" disabled={creating}>
                {creating ? 'Erstelle...' : 'Store erstellen'}
              </Button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-md py-sm text-kore-mid hover:text-kore-ink font-body text-small transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-kore-mid font-body">Lade Stores...</p>
      ) : visibleStores && visibleStores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {visibleStores.map((store) => (
            <Link
              key={store.id}
              to={`/admin/stores/${store.id}`}
              className="bg-kore-white border border-kore-border p-xl hover:border-kore-brass transition-colors group"
            >
              <div className="flex items-start justify-between mb-md">
                <h3 className="font-display text-h3 text-kore-ink group-hover:text-kore-brass transition-colors">
                  {store.name}
                </h3>
                <Badge variant={store.isActive ? 'success' : 'error'}>
                  {store.isActive ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
              {store.city && (
                <div className="flex items-center gap-xs text-kore-mid">
                  <MapPin size={14} />
                  <span className="font-body text-small">{store.city}</span>
                </div>
              )}
              <div className="mt-md pt-md border-t border-kore-border flex items-center justify-between">
                <span className="font-body text-caption text-kore-mid uppercase tracking-[0.14em]">
                  {store._count.tools} Tools
                </span>
                <span className="font-body text-small text-kore-mid">
                  {store.tenant.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-xl text-kore-mid font-body text-small">
          Keine Stores verfügbar.
        </div>
      )}
    </div>
  );
}
