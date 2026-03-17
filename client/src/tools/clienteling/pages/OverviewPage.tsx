import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Star, Calendar, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCustomers, useClientelingStores } from '../../../hooks/useClienteling';

const VIP_COLORS: Record<string, string> = {
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-gray-100 text-gray-700',
  BRONZE: 'bg-orange-100 text-orange-700',
};

export function OverviewPage() {
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);

  const { data: stores } = useClientelingStores();
  const { data, isLoading } = useCustomers({
    search: search || undefined,
    vipLevel: vipFilter || undefined,
    storeId: storeId || undefined,
    page,
    pageSize: 20,
  });

  const customers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Clienteling</h1>
          <p className="text-body text-kore-mid mt-xs">Kundenpflege, Kommunikation und Terminverwaltung</p>
        </div>
        <div className="flex items-center gap-sm">
          <Link to="/tools/clienteling/appointments" className="flex items-center gap-xs px-lg py-md-sm bg-kore-white border border-kore-border text-kore-ink text-small font-medium uppercase tracking-widest hover:border-kore-ink transition-colors">
            <Calendar size={16} /> Termine
          </Link>
          <Link to="/tools/clienteling/customers/create" className="flex items-center gap-xs px-lg py-md-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Neuer Kunde
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Kunden gesamt</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{total}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">VIP-Kunden</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">
            {customers.filter((c: any) => c.vipLevel).length}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Interaktionen</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">
            {customers.reduce((s: number, c: any) => s + (c._count?.interactions ?? 0), 0)}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Termine</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">
            {customers.reduce((s: number, c: any) => s + (c._count?.appointments ?? 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-kore-mid" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Suche nach Name, E-Mail, Telefon..."
            className="w-full border border-kore-border pl-2xl pr-md py-sm text-body"
          />
        </div>
        {stores && stores.length > 1 && (
          <select value={storeId} onChange={e => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-body">
            <option value="">Alle Stores</option>
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select value={vipFilter} onChange={e => { setVipFilter(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Kunden</option>
          <option value="BRONZE">Bronze</option>
          <option value="SILVER">Silber</option>
          <option value="GOLD">Gold</option>
        </select>
      </div>

      {/* Customer List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Kunden...</div>
      ) : !customers.length ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Users size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Kunden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Legen Sie Ihren ersten Kunden an, um mit dem Clienteling zu beginnen.</p>
          <Link to="/tools/clienteling/customers/create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Kunden anlegen
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {customers.map((c: any) => (
              <Link
                key={c.id}
                to={`/tools/clienteling/customers/${c.id}`}
                className="block bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <div className="w-10 h-10 bg-kore-bg flex items-center justify-center text-kore-mid font-medium text-small">
                      {c.firstName?.[0]}{c.lastName?.[0]}
                    </div>
                    <div>
                      <span className="font-medium text-kore-ink">{c.firstName} {c.lastName}</span>
                      <div className="text-small text-kore-mid">
                        {c.email || c.phone || '--'} {c.store?.name ? `· ${c.store.name}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-md">
                    {c.vipLevel && (
                      <span className={`flex items-center gap-xs px-sm py-xs text-small ${VIP_COLORS[c.vipLevel] ?? 'bg-kore-bg text-kore-mid'}`}>
                        <Star size={12} /> {c.vipLevel}
                      </span>
                    )}
                    {c.loyaltyPoints > 0 && (
                      <span className="text-small text-kore-brass font-medium">{c.loyaltyPoints} Pkt.</span>
                    )}
                    <span className="text-small text-kore-mid flex items-center gap-xs">
                      <MessageSquare size={12} /> {c._count?.interactions ?? 0}
                    </span>
                    <span className="text-small text-kore-mid flex items-center gap-xs">
                      <Calendar size={12} /> {c._count?.appointments ?? 0}
                    </span>
                    {c.totalSpent > 0 && (
                      <span className="text-small font-medium text-emerald-700">{c.totalSpent.toFixed(0)} EUR</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Kunden insgesamt</span>
              <div className="flex items-center gap-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-sm border border-kore-border hover:border-kore-ink disabled:opacity-30 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-sm border border-kore-border hover:border-kore-ink disabled:opacity-30 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
