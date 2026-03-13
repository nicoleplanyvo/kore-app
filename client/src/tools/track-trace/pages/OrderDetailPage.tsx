import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Truck, Plus, Clock } from 'lucide-react';
import { useOrder, useUpdateOrder, useAddOrderStatus } from '../../../hooks/useTrackTrace';

const STATUS_LABELS: Record<string, string> = { ORDERED: 'Bestellt', SHIPPED: 'Versendet', IN_TRANSIT: 'Unterwegs', DELIVERED: 'Zugestellt', RETURNED: 'Retourniert' };
const STATUS_COLORS: Record<string, string> = { ORDERED: 'bg-blue-100 text-blue-700', SHIPPED: 'bg-amber-100 text-amber-700', IN_TRANSIT: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-emerald-100 text-emerald-700', RETURNED: 'bg-red-100 text-red-700' };

export function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const addStatus = useAddOrderStatus();
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!order) return <div className="p-xl text-body text-kore-mid">Bestellung nicht gefunden.</div>;

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    addStatus.mutate(
      { orderId: order.id, ...statusForm },
      { onSuccess: () => { setShowStatusForm(false); setStatusForm({ status: '', notes: '' }); } },
    );
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/track-trace" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Truck size={24} /> Bestellung #{order.orderNumber}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {order.customerName} · {order.store?.name ?? '—'} · Erstellt von {order.creator?.name ?? '—'}
          </p>
        </div>
        <span className={`px-md py-sm text-small ${STATUS_COLORS[order.status] ?? 'bg-kore-bg text-kore-mid'}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {/* Order Info */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Kundenname</span>
            <p className="text-body text-kore-ink">{order.customerName}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">E-Mail</span>
            <p className="text-body text-kore-ink">{order.customerEmail || '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Tracking-Nr.</span>
            <p className="text-body text-kore-ink">{order.trackingNumber || '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Versanddienstleister</span>
            <p className="text-body text-kore-ink">{order.carrier || '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Voraussichtliche Lieferung</span>
            <p className="text-body text-kore-ink">{order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('de-DE') : '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Erstellt am</span>
            <p className="text-body text-kore-ink">{new Date(order.createdAt).toLocaleString('de-DE')}</p>
          </div>
        </div>
      </div>

      {/* Status Updates / Timeline */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm"><Clock size={18} /> Status-Verlauf</h2>
          <button onClick={() => setShowStatusForm(!showStatusForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={14} /> Status-Update
          </button>
        </div>

        {showStatusForm && (
          <form onSubmit={handleAddStatus} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Neuer Status</label>
                <select value={statusForm.status} onChange={e => setStatusForm({ ...statusForm, status: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required>
                  <option value="">— Status wählen —</option>
                  <option value="ORDERED">Bestellt</option>
                  <option value="SHIPPED">Versendet</option>
                  <option value="IN_TRANSIT">Unterwegs</option>
                  <option value="DELIVERED">Zugestellt</option>
                  <option value="RETURNED">Retourniert</option>
                </select>
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Notiz</label>
                <input value={statusForm.notes} onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" placeholder="Optional" />
              </div>
            </div>
            <button type="submit" disabled={addStatus.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
              {addStatus.isPending ? 'Speichern...' : 'Status speichern'}
            </button>
          </form>
        )}

        {!order.statusUpdates?.length ? (
          <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Noch keine Status-Updates.</div>
        ) : (
          <div className="space-y-sm">
            {order.statusUpdates.map((su: any) => (
              <div key={su.id} className="bg-kore-white border border-kore-border p-md flex items-start gap-md">
                <div className="mt-1 w-3 h-3 rounded-full bg-kore-ink flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-sm">
                    <span className={`px-sm py-xs text-small ${STATUS_COLORS[su.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[su.status] ?? su.status}</span>
                    <span className="text-small text-kore-mid">{new Date(su.createdAt).toLocaleString('de-DE')}</span>
                    <span className="text-small text-kore-mid">von {su.updater?.name ?? '—'}</span>
                  </div>
                  {su.notes && <p className="text-body text-kore-mid mt-xs">{su.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
