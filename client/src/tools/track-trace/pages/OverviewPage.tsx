import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Plus, Search } from 'lucide-react';
import { useOrders, useCreateOrder, useOrdersSummary } from '../../../hooks/useTrackTrace';

const STATUS_LABELS: Record<string, string> = { ORDERED: 'Bestellt', SHIPPED: 'Versendet', IN_TRANSIT: 'Unterwegs', DELIVERED: 'Zugestellt', RETURNED: 'Retourniert' };
const STATUS_COLORS: Record<string, string> = { ORDERED: 'bg-blue-100 text-blue-700', SHIPPED: 'bg-amber-100 text-amber-700', IN_TRANSIT: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-emerald-100 text-emerald-700', RETURNED: 'bg-red-100 text-red-700' };

export function OverviewPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useOrders({ search: search || undefined, status: statusFilter || undefined });
  const { data: summary } = useOrdersSummary();
  const create = useCreateOrder();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderNumber: '', customerName: '', customerEmail: '', trackingNumber: '', carrier: '', estimatedDelivery: '' });

  const orders = data?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, customerEmail: form.customerEmail || undefined, trackingNumber: form.trackingNumber || undefined, carrier: form.carrier || undefined, estimatedDelivery: form.estimatedDelivery || undefined },
      { onSuccess: () => { setShowForm(false); setForm({ orderNumber: '', customerName: '', customerEmail: '', trackingNumber: '', carrier: '', estimatedDelivery: '' }); } },
    );
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Truck size={24} /> Track & Trace</h1>
          <p className="text-body text-kore-mid mt-xs">Kundenbestellungen verfolgen und Statusupdates verwalten.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Bestellung
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          <div className="bg-kore-white border border-kore-border p-lg text-center">
            <span className="block text-small text-kore-mid mb-xs">Gesamt</span>
            <span className="font-display text-h2 text-kore-ink">{summary.total}</span>
          </div>
          {Object.entries(summary.byStatus ?? {}).map(([status, count]: any) => (
            <div key={status} className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">{STATUS_LABELS[status] ?? status}</span>
              <span className="font-display text-h2 text-kore-ink">{count}</span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="grid grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Bestellnummer</label>
              <input value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kundenname</label>
              <input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">E-Mail</label>
              <input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Tracking-Nr.</label>
              <input value={form.trackingNumber} onChange={e => setForm({ ...form, trackingNumber: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Versanddienstleister</label>
              <input value={form.carrier} onChange={e => setForm({ ...form, carrier: e.target.value })} placeholder="z.B. DHL, DPD, UPS" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Voraussichtliche Lieferung</label>
              <input type="date" value={form.estimatedDelivery} onChange={e => setForm({ ...form, estimatedDelivery: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            {create.isPending ? 'Speichern...' : 'Bestellung anlegen'}
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
            placeholder="Suche nach Bestellnummer, Kunde, Tracking..."
            className="w-full border border-kore-border pl-2xl pr-md py-sm text-body"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Status</option>
          <option value="ORDERED">Bestellt</option>
          <option value="SHIPPED">Versendet</option>
          <option value="IN_TRANSIT">Unterwegs</option>
          <option value="DELIVERED">Zugestellt</option>
          <option value="RETURNED">Retourniert</option>
        </select>
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Bestellungen...</div>
      ) : !orders.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Bestellungen vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {orders.map((o: any) => (
            <Link key={o.id} to={`/tools/track-trace/orders/${o.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-kore-ink">#{o.orderNumber}</span>
                  <span className="text-body text-kore-mid ml-sm">{o.customerName}</span>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[o.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[o.status] ?? o.status}</span>
                </div>
              </div>
              <div className="flex gap-lg mt-xs text-small text-kore-mid">
                {o.trackingNumber && <span>Tracking: {o.trackingNumber}</span>}
                {o.carrier && <span>{o.carrier}</span>}
                {o.estimatedDelivery && <span>Lieferung: {new Date(o.estimatedDelivery).toLocaleDateString('de-DE')}</span>}
                <span>{o.store?.name ?? '—'}</span>
                <span>{o._count?.statusUpdates ?? 0} Updates</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
