import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../stores/authStore';

const ROLE_LABELS: Record<string, string> = {
  kore_admin: 'Super Admin',
  tenant_admin: 'Kunden-Admin',
  regional_manager: 'Regional Manager',
  multisite_manager: 'Multisite Manager',
  store_manager: 'Store Manager',
  learner: 'Mitarbeiter',
};

const ROLE_VARIANTS: Record<string, 'brass' | 'success' | 'error'> = {
  kore_admin: 'brass',
  tenant_admin: 'brass',
  regional_manager: 'success',
  multisite_manager: 'success',
  store_manager: 'success',
  learner: 'success',
};

const ROLE_OPTIONS = [
  { value: '', label: 'Alle Rollen' },
  { value: 'tenant_admin', label: 'Kunden-Admin' },
  { value: 'regional_manager', label: 'Regional Manager' },
  { value: 'multisite_manager', label: 'Multisite Manager' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'learner', label: 'Mitarbeiter' },
];

export function UsersListPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useUsers({
    page,
    search: search || undefined,
    role: roleFilter || undefined,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-md mb-lg sm:mb-xl">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-lg bg-sand-50 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-brass" />
          </div>
          <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">Benutzer</h1>
        </div>
        <Link
          to="/admin/users/new"
          className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white font-body text-small hover:bg-kore-ink/90 transition-colors"
        >
          <Plus size={16} />
          Benutzer anlegen
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-lg">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-kore-mid" />
          <input
            type="text"
            placeholder="Name oder E-Mail suchen..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-[40px] pr-md py-sm border border-kore-border bg-kore-white font-body text-small text-kore-ink placeholder:text-kore-mid focus:outline-none focus:border-kore-brass"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-md py-sm border border-kore-border bg-kore-white font-body text-small text-kore-ink focus:outline-none focus:border-kore-brass"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-kore-white border border-kore-border overflow-x-auto">
        {isLoading ? (
          <div className="p-xl text-kore-mid font-body text-small">Lade Benutzer...</div>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="px-md sm:px-xl py-md text-left font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Name</th>
                  <th className="px-md sm:px-xl py-md text-left font-body text-caption text-kore-mid uppercase tracking-[0.14em] hidden sm:table-cell">E-Mail</th>
                  <th className="px-md sm:px-xl py-md text-left font-body text-caption text-kore-mid uppercase tracking-[0.14em]">Rolle</th>
                  <th className="px-md sm:px-xl py-md text-left font-body text-caption text-kore-mid uppercase tracking-[0.14em] hidden md:table-cell">Stores</th>
                  <th className="px-md sm:px-xl py-md text-left font-body text-caption text-kore-mid uppercase tracking-[0.14em] hidden lg:table-cell">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kore-border">
                {data.data.map((u) => (
                  <tr key={u.id} className="hover:bg-kore-surface/50 transition-colors">
                    <td className="px-md sm:px-xl py-md">
                      <Link to={`/admin/users/${u.id}`} className="font-body text-body text-kore-ink hover:text-kore-brass transition-colors">
                        {u.name}
                      </Link>
                      <p className="font-body text-caption text-kore-mid sm:hidden">{u.email}</p>
                    </td>
                    <td className="px-md sm:px-xl py-md font-body text-small text-kore-mid hidden sm:table-cell">
                      {u.email}
                    </td>
                    <td className="px-md sm:px-xl py-md">
                      <Badge variant={ROLE_VARIANTS[u.role] || 'brass'}>
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="px-md sm:px-xl py-md font-body text-small text-kore-mid hidden md:table-cell">
                      {u.storeAssignments.length > 0
                        ? u.storeAssignments.map((a) => a.store.name).join(', ')
                        : '—'
                      }
                    </td>
                    <td className="px-md sm:px-xl py-md hidden lg:table-cell">
                      <Badge variant={u.isActive ? 'success' : 'error'}>
                        {u.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-md sm:px-xl py-md border-t border-kore-border flex items-center justify-between">
              <span className="font-body text-small text-kore-mid">{data.total} Benutzer</span>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-xs hover:bg-kore-surface rounded disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-body text-small text-kore-mid">Seite {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={data.data.length < data.pageSize}
                  className="p-xs hover:bg-kore-surface rounded disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-xl text-kore-mid font-body text-small">
            Keine Benutzer gefunden.
          </div>
        )}
      </div>
    </div>
  );
}
