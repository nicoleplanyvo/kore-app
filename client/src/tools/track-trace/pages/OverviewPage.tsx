import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Plus,
  Search,
  ArrowRightLeft,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import {
  useTrackTraceStores,
  useOrders,
  useCreateOrder,
  useOrdersSummary,
} from '../../../hooks/useTrackTrace';

/* ── Status-Maps ──────────────────────────────────── */

const TRANSFER_STATUS: Record<string, string> = {
  ORDERED: 'Erstellt',
  SHIPPED: 'Unterwegs',
  IN_TRANSIT: 'Unterwegs',
  DELIVERED: 'Empfangen',
  COMPLETED: 'Abgeschlossen',
  DIFFERENCE_REPORTED: 'Differenz',
  RETURNED: 'Retourniert',
};

const CC_STATUS: Record<string, string> = {
  ORDERED: 'Bestellt',
  IN_STORE: 'Im Store',
  READY: 'Bereit',
  PICKED_UP: 'Abgeholt',
  RETURNED: 'Retourniert',
};

const STATUS_LABELS: Record<string, string> = {
  ...TRANSFER_STATUS,
  ...CC_STATUS,
  SHIPPED: 'Versendet',
  IN_TRANSIT: 'Unterwegs',
};

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-amber-100 text-amber-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  IN_STORE: 'bg-amber-100 text-amber-700',
  READY: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-emerald-100 text-emerald-700',
  DIFFERENCE_REPORTED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-red-100 text-red-700',
};

type OrderType = 'ALL' | 'TRF-' | 'CC-';

function getOrderTypeLabel(orderNumber: string): string {
  if (orderNumber.startsWith('TRF-')) return 'Transfer';
  if (orderNumber.startsWith('CC-')) return 'Click & Collect';
  return 'Bestellung';
}

function getOrderTypeIcon(orderNumber: string) {
  if (orderNumber.startsWith('TRF-')) return <ArrowRightLeft size={14} className="text-kore-brass" />;
  if (orderNumber.startsWith('CC-')) return <ShoppingBag size={14} className="text-purple-600" />;
  return <Truck size={14} className="text-kore-mid" />;
}

function generateOrderNumber(type: 'transfer' | 'clickcollect'): string {
  const prefix = type === 'transfer' ? 'TRF' : 'CC';
  const ts = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${ts}`;
}

/* ── Page ─────────────────────────────────────────── */

export function OverviewPage() {
  const { data: stores } = useTrackTraceStores();
  const [selectedStore, setSelectedStore] = useState('');
  const storeId = selectedStore || stores?.[0]?.id || '';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrderType>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOrders({
    storeId: storeId || undefined,
    search: search || undefined,
    status: statusFilter || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    page,
  });
  const { data: summary } = useOrdersSummary({ storeId: storeId || undefined });
  const create = useCreateOrder();

  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'transfer' | 'clickcollect'>('transfer');
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    trackingNumber: '',
    carrier: '',
    estimatedDelivery: '',
  });

  const orders = data?.data ?? [];
  const totalPages = useMemo(
    () => (data ? Math.ceil(data.total / data.pageSize) : 1),
    [data],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const orderNumber = generateOrderNumber(formType);
    create.mutate(
      {
        storeId,
        orderNumber,
        customerName: form.customerName,
        customerEmail: form.customerEmail || undefined,
        trackingNumber: form.trackingNumber || undefined,
        carrier: form.carrier || undefined,
        estimatedDelivery: form.estimatedDelivery || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ customerName: '', customerEmail: '', trackingNumber: '', carrier: '', estimatedDelivery: '' });
        },
      },
    );
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Truck size={24} /> Track & Trace
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Inter-Store-Transfers und Click & Collect verfolgen.
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/track-trace/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neuer Vorgang
          </button>
        </div>
      </div>

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <div className="mb-xl">
          <label className="block text-small text-kore-mid mb-xs">Store</label>
          <select
            value={storeId}
            onChange={(e) => { setSelectedStore(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-body min-w-[200px]"
          >
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.city ? ` (${s.city})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          <div className="bg-kore-white border border-kore-border p-lg text-center">
            <span className="block text-small text-kore-mid mb-xs">Gesamt</span>
            <span className="font-display text-h2 text-kore-ink">{summary.total}</span>
          </div>
          {Object.entries(summary.byStatus ?? {}).slice(0, 3).map(([status, count]: any) => (
            <div key={status} className="bg-kore-white border border-kore-border p-lg text-center">
              <span className="block text-small text-kore-mid mb-xs">{STATUS_LABELS[status] ?? status}</span>
              <span className="font-display text-h2 text-kore-ink">{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div className="flex gap-md mb-md">
            <button
              type="button"
              onClick={() => setFormType('transfer')}
              className={`flex items-center gap-xs px-md py-sm text-small border transition-colors ${
                formType === 'transfer'
                  ? 'bg-kore-ink text-kore-white border-kore-ink'
                  : 'border-kore-border text-kore-mid hover:text-kore-ink'
              }`}
            >
              <ArrowRightLeft size={14} /> Inter-Store Transfer
            </button>
            <button
              type="button"
              onClick={() => setFormType('clickcollect')}
              className={`flex items-center gap-xs px-md py-sm text-small border transition-colors ${
                formType === 'clickcollect'
                  ? 'bg-kore-ink text-kore-white border-kore-ink'
                  : 'border-kore-border text-kore-mid hover:text-kore-ink'
              }`}
            >
              <ShoppingBag size={14} /> Click & Collect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">
                {formType === 'transfer' ? 'Ziel-Store / Empfaenger' : 'Kundenname'}
              </label>
              <input
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder={formType === 'transfer' ? 'z.B. Store Berlin Mitte' : 'z.B. Max Mustermann'}
                required
              />
            </div>
            {formType === 'clickcollect' && (
              <div>
                <label className="block text-small text-kore-mid mb-xs">Kunden-E-Mail</label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full border border-kore-border px-md py-sm text-body"
                  placeholder="fuer Benachrichtigung"
                />
              </div>
            )}
            <div>
              <label className="block text-small text-kore-mid mb-xs">Tracking-Nr.</label>
              <input
                value={form.trackingNumber}
                onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder={formType === 'transfer' ? 'DHL / UPS Sendungsnummer' : 'Optional'}
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Versanddienstleister</label>
              <select
                value={form.carrier}
                onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                <option value="">-- Waehlen --</option>
                <option value="DHL">DHL</option>
                <option value="UPS">UPS</option>
                <option value="DPD">DPD</option>
                <option value="Hermes">Hermes</option>
                <option value="GLS">GLS</option>
                <option value="Intern">Intern (Kurier)</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">
                {formType === 'transfer' ? 'Erwartete Ankunft' : 'Abholung bis'}
              </label>
              <input
                type="date"
                value={form.estimatedDelivery}
                onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? 'Erstellen...' : 'Vorgang anlegen'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-lg items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-md top-1/2 -translate-y-1/2 text-kore-mid" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Suche nach Nummer, Name, Tracking..."
            className="w-full border border-kore-border pl-2xl pr-md py-sm text-body"
          />
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Typ</label>
          <div className="flex gap-xs">
            {([['ALL', 'Alle'], ['TRF-', 'Transfers'], ['CC-', 'Click & Collect']] as [OrderType, string][]).map(
              ([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setTypeFilter(val); setPage(1); }}
                  className={`px-md py-xs text-small border transition-colors ${
                    typeFilter === val
                      ? 'bg-kore-ink text-kore-white border-kore-ink'
                      : 'border-kore-border text-kore-mid hover:text-kore-ink'
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-body"
          >
            <option value="">Alle Status</option>
            <option value="ORDERED">Erstellt/Bestellt</option>
            <option value="SHIPPED">Versendet</option>
            <option value="IN_TRANSIT">Unterwegs</option>
            <option value="DELIVERED">Empfangen</option>
            <option value="COMPLETED">Abgeschlossen</option>
            <option value="IN_STORE">Im Store</option>
            <option value="READY">Bereit</option>
            <option value="PICKED_UP">Abgeholt</option>
            <option value="DIFFERENCE_REPORTED">Differenz</option>
            <option value="RETURNED">Retourniert</option>
          </select>
        </div>
      </div>

      {/* Order List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Vorgaenge...</div>
      ) : !orders.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <Truck size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Vorgaenge vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie einen neuen Transfer oder Click & Collect Vorgang.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Ersten Vorgang erstellen
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {orders.map((o: any) => (
              <Link
                key={o.id}
                to={`/tools/track-trace/detail/${o.id}`}
                className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    {getOrderTypeIcon(o.orderNumber)}
                    <span className="text-small text-kore-brass font-medium">{getOrderTypeLabel(o.orderNumber)}</span>
                    <span className="font-medium text-kore-ink">#{o.orderNumber}</span>
                    <span className="text-body text-kore-mid">{o.customerName}</span>
                  </div>
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[o.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </div>
                <div className="flex gap-lg mt-xs text-small text-kore-mid">
                  {o.trackingNumber && <span>Tracking: {o.trackingNumber}</span>}
                  {o.carrier && <span>{o.carrier}</span>}
                  {o.estimatedDelivery && <span>Erwartet: {new Date(o.estimatedDelivery).toLocaleDateString('de-DE')}</span>}
                  <span>{o.store?.name ?? '--'}</span>
                  <span>{o._count?.statusUpdates ?? 0} Updates</span>
                  <span>{new Date(o.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-lg">
              <span className="text-small text-kore-mid">
                Seite {data.page} von {totalPages} ({data.total} Eintraege)
              </span>
              <div className="flex items-center gap-xs">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
                >
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
