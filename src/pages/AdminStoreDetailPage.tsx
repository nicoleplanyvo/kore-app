import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Store, MapPin, GitBranch,
  Pencil, Save, X, Check,
} from 'lucide-react';
import { useAdminStoreUsers, useUpdateAdminStoreUsers } from '../hooks/useAdmin';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';

const ROLE_LABELS: Record<string, string> = {
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const ROLE_ORDER = ['tenant_admin', 'regional_manager', 'multisite_manager', 'store_manager', 'learner'];

export function AdminStoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminStoreUsers(id);
  const updateUsers = useUpdateAdminStoreUsers(id!);
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (isLoading || !data) {
    return <LoadingSpinner />;
  }

  const { store, assignments, availableUsers } = data;

  const handleStartEdit = () => {
    setSelectedIds(assignments.map((a) => a.userId));
    setEditing(true);
  };

  const handleSave = () => {
    updateUsers.mutate(selectedIds, {
      onSuccess: () => setEditing(false),
    });
  };

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  return (
    <div className="px-lg py-lg space-y-lg max-w-lg mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-xs text-small text-kore-mid active:text-kore-ink transition-colors"
      >
        <ArrowLeft size={18} />
        Zurück
      </button>

      {/* Store Info */}
      <div className="flex items-center gap-md">
        <Store size={24} className="text-kore-brass shrink-0" />
        <div>
          <h1 className="font-display text-h2 text-kore-ink">{store.name}</h1>
        </div>
      </div>

      {/* User Management */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <div className="flex items-center gap-sm">
            <Users size={18} className="text-kore-mid" />
            <h2 className="text-body font-medium text-kore-ink">
              Benutzer ({assignments.length})
            </h2>
          </div>
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={handleStartEdit}>
              <Pencil size={14} className="mr-1" />
              Bearbeiten
            </Button>
          ) : (
            <div className="flex items-center gap-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
              >
                <X size={14} />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateUsers.isPending}
              >
                <Save size={14} className="mr-1" />
                Speichern
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          /* Edit Mode */
          <div className="space-y-md">
            {ROLE_ORDER.map((role) => {
              const allForRole = [
                ...assignments
                  .filter((a) => a.user.role === role)
                  .map((a) => ({ id: a.user.id, name: a.user.name, email: a.user.email })),
                ...availableUsers
                  .filter((u) => u.role === role)
                  .map((u) => ({ id: u.id, name: u.name, email: u.email })),
              ];
              if (allForRole.length === 0) return null;

              return (
                <div key={role}>
                  <p className="text-caption text-kore-mid uppercase tracking-widest mb-sm">
                    {ROLE_LABELS[role] || role}
                  </p>
                  <div className="space-y-xs">
                    {allForRole.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className="w-full"
                      >
                        <Card
                          className={`flex items-center justify-between transition-colors ${
                            selectedIds.includes(u.id)
                              ? 'border-kore-brass bg-kore-brass/5'
                              : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-small font-medium text-kore-ink truncate text-left">
                              {u.name}
                            </p>
                            <p className="text-caption text-kore-mid truncate text-left">
                              {u.email}
                            </p>
                          </div>
                          {selectedIds.includes(u.id) && (
                            <Check size={18} className="text-kore-brass shrink-0" />
                          )}
                        </Card>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : assignments.length === 0 ? (
          <Card className="text-center">
            <p className="text-small text-kore-mid">
              Keine Benutzer zugewiesen.
            </p>
          </Card>
        ) : (
          /* View Mode */
          <div className="space-y-md">
            {ROLE_ORDER.map((role) => {
              const usersForRole = assignments.filter((a) => a.user.role === role);
              if (usersForRole.length === 0) return null;

              return (
                <div key={role}>
                  <p className="text-caption text-kore-mid uppercase tracking-widest mb-sm">
                    {ROLE_LABELS[role] || role}
                  </p>
                  <div className="space-y-xs">
                    {usersForRole.map((a) => (
                      <Card key={a.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-small font-medium text-kore-ink truncate">
                            {a.user.name}
                          </p>
                          <p className="text-caption text-kore-mid truncate">
                            {a.user.email}
                          </p>
                        </div>
                        <span className="text-caption text-kore-mid shrink-0">
                          seit {new Date(a.assignedAt).toLocaleDateString('de-DE')}
                        </span>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
