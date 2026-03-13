import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button, Badge, Table, Thead, Tbody, Th, Tr, Td } from '@/components/ui';
import { useTenants } from '../../hooks/useTenants';
import type { SubStatus } from '@shared/types';
import t from '../../locales/de.json';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'brass'> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'error',
  TRIALING: 'brass',
};

export function TenantsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubStatus | ''>('');

  const { data, isLoading } = useTenants({
    page,
    pageSize: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg sm:mb-xl gap-md">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">{t.tenants.title}</h1>
        <Button onClick={() => navigate('/admin/tenants/new')}>
          <span className="flex items-center gap-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">{t.tenants.new}</span>
            <span className="sm:hidden">Neu</span>
          </span>
        </Button>
      </div>

      <div className="flex items-center gap-md mb-lg flex-wrap">
        <div className="flex items-center gap-sm bg-kore-white border border-kore-border px-md py-md-sm flex-1 min-w-[240px]">
          <Search size={16} className="text-kore-faint flex-shrink-0" />
          <input
            type="text"
            placeholder={t.tenants.search}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="font-body text-body text-kore-ink bg-transparent border-none outline-none w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as SubStatus | ''); setPage(1); }}
          className="font-body text-small bg-kore-white border border-kore-border px-md py-md-sm text-kore-ink outline-none cursor-pointer"
        >
          <option value="">{t.common.allStatuses}</option>
          <option value="ACTIVE">{t.status.ACTIVE}</option>
          <option value="PAST_DUE">{t.status.PAST_DUE}</option>
          <option value="CANCELED">{t.status.CANCELED}</option>
          <option value="TRIALING">{t.status.TRIALING}</option>
        </select>
      </div>

      <div className="bg-kore-white border border-kore-border overflow-x-auto">
        {isLoading ? (
          <p className="p-xl text-kore-mid font-body text-small">{t.common.loading}</p>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>{t.tenants.name}</Th>
                <Th>{t.tenants.status}</Th>
                <Th>{t.tenants.stores}</Th>
                <Th>{t.tenants.users}</Th>
                <Th>{t.tenants.contact}</Th>
              </tr>
            </Thead>
            <Tbody>
              {data?.data.map((tenant) => (
                <Tr key={tenant.id} onClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
                  <Td>
                    <div>
                      <p className="font-normal text-kore-ink">{tenant.name}</p>
                      <p className="text-small text-kore-mid">{tenant.slug}</p>
                    </div>
                  </Td>
                  <Td>
                    <Badge variant={statusVariant[tenant.status]}>
                      {t.status[tenant.status as keyof typeof t.status]}
                    </Badge>
                  </Td>
                  <Td><span className="text-small">{tenant._count?.stores ?? 0}</span></Td>
                  <Td><span className="text-small">{tenant._count?.users ?? 0}</span></Td>
                  <Td><span className="text-small">{tenant.contactName || tenant.contactEmail || '—'}</span></Td>
                </Tr>
              ))}
              {data?.data.length === 0 && (
                <tr><Td style={{ textAlign: 'center' }}><span className="text-kore-mid">{t.tenants.empty}</span></Td></tr>
              )}
            </Tbody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-lg">
          <p className="font-body text-small text-kore-mid">Seite {page} von {totalPages} ({data?.total} Kunden)</p>
          <div className="flex gap-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-md py-sm border border-kore-border bg-kore-white text-kore-ink font-body text-small disabled:opacity-40 disabled:cursor-not-allowed hover:border-kore-brass transition-colors">Zurück</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-md py-sm border border-kore-border bg-kore-white text-kore-ink font-body text-small disabled:opacity-40 disabled:cursor-not-allowed hover:border-kore-brass transition-colors">Weiter</button>
          </div>
        </div>
      )}
    </div>
  );
}
