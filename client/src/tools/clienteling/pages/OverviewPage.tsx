import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Star } from 'lucide-react';
import { useClients, useCreateClient, useClientelingSummary } from '../../../hooks/useClienteling';

const VIP_COLORS: Record<string, string> = {
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-gray-100 text-gray-700',
  BRONZE: 'bg-orange-100 text-orange-700',
};

export function OverviewPage() {
  const [search, setSearch] = useState('');
  const [vipFilter, setVipFilter] = useState('');
  const { data, isLoading } = useClients({ search: search || undefined, vipLevel: vipFilter || undefined });
  const { data: summary } = useClientelingSummary();
  const create = useCreateClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', vipLevel: '', preferences: '' });

  const clients = data?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, vipLevel: form.vipLevel || undefined, preferences: form.preferences || undefined },
      { onSuccess: () => { setShowForm(false); setForm({ firstName: '', lastName: '', email: '', phone: '', vipLevel: '', preferences: '' }); } },
    );
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Users size={24} /> Clienteling / CRM</h1>
          <p className="text-body text-kore-mid mt-xs">Kundenpflege, Interaktionen und VIP-Management.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neuer Kunde
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          {[
            { label: 'Kunden gesamt', value: summary.totalClients },
            { label: 'VIP-Kunden', value: summary.vipClients },
            { label: 'Ø Purchases', value: `${summary.avgPurchases?.toFixed(0)}` },
            { label: 'Interaktionen', value: summary.totalInteractions },
          ].map((s, i) => (
            <div key={i} className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">{s.label}</span>
              <span className="font-display text-h2 text-kore-ink">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Vorname</label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Nachname</label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">E-Mail</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Telefon</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">VIP-Level</label>
              <select value={form.vipLevel} onChange={e => setForm({ ...form, vipLevel: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="">— Kein VIP —</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Präferenzen</label>
              <input value={form.preferences} onChange={e => setForm({ ...form, preferences: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" placeholder="z.B. Sneaker, Premium" />
            </div>
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            {create.isPending ? 'Speichern...' : 'Kunde anlegen'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-md mb-lg">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-kore-mid" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Suche nach Name, E-Mail, Telefon..."
            className="w-full border border-kore-border pl-2xl pr-md py-sm text-body"
          />
        </div>
        <select value={vipFilter} onChange={e => setVipFilter(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Kunden</option>
          <option value="BRONZE">Bronze</option>
          <option value="SILVER">Silver</option>
          <option value="GOLD">Gold</option>
        </select>
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Kunden...</div>
      ) : !clients.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Kunden gefunden.</div>
      ) : (
        <div className="space-y-sm">
          {clients.map((c: any) => (
            <Link key={c.id} to={`/tools/clienteling/clients/${c.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 bg-kore-bg flex items-center justify-center text-kore-mid font-medium">
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  <div>
                    <span className="font-medium text-kore-ink">{c.firstName} {c.lastName}</span>
                    <div className="text-small text-kore-mid">{c.email || c.phone || '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  {c.vipLevel && (
                    <span className={`flex items-center gap-xs px-sm py-xs text-small ${VIP_COLORS[c.vipLevel] ?? 'bg-kore-bg text-kore-mid'}`}>
                      <Star size={12} /> {c.vipLevel}
                    </span>
                  )}
                  <span className="text-small text-kore-mid">{c._count?.interactions ?? 0} Interaktionen</span>
                  <span className="text-small text-kore-mid">{c.totalPurchases} Käufe</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
