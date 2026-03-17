import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft,
  Truck,
  Plus,
  Clock,
  ArrowRightLeft,
  ShoppingBag,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useOrder, useUpdateOrder, useAddOrderStatus } from '../../../hooks/useTrackTrace';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_LABELS: Record<string, string> = {
  ORDERED: 'Erstellt',
  SHIPPED: 'Versendet',
  IN_TRANSIT: 'Unterwegs',
  DELIVERED: 'Empfangen',
  COMPLETED: 'Abgeschlossen',
  DIFFERENCE_REPORTED: 'Differenz gemeldet',
  IN_STORE: 'Im Store',
  READY: 'Bereit zur Abholung',
  PICKED_UP: 'Abgeholt',
  RETURNED: 'Retourniert',
};

const STATUS_COLORS: Record<string, string> = {
  ORDERED: 'bg-blue-100 text-blue-700',
  SHIPPED: 'bg-amber-100 text-amber-700',
  IN_TRANSIT: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  DIFFERENCE_REPORTED: 'bg-red-100 text-red-700',
  IN_STORE: 'bg-amber-100 text-amber-700',
  READY: 'bg-blue-100 text-blue-700',
  PICKED_UP: 'bg-emerald-100 text-emerald-700',
  RETURNED: 'bg-red-100 text-red-700',
};

const TRANSFER_STATUSES = [
  { value: 'ORDERED', label: 'Erstellt' },
  { value: 'SHIPPED', label: 'Versendet' },
  { value: 'IN_TRANSIT', label: 'Unterwegs' },
  { value: 'DELIVERED', label: 'Empfangen' },
  { value: 'DIFFERENCE_REPORTED', label: 'Differenz melden' },
  { value: 'COMPLETED', label: 'Abgeschlossen' },
  { value: 'RETURNED', label: 'Retourniert' },
];

const CC_STATUSES = [
  { value: 'ORDERED', label: 'Bestellt' },
  { value: 'IN_STORE', label: 'Im Store eingetroffen' },
  { value: 'READY', label: 'Bereit zur Abholung' },
  { value: 'PICKED_UP', label: 'Abgeholt' },
  { value: 'RETURNED', label: 'Retourniert' },
];

const DIFFERENCE_REASONS = [
  'beschaedigt',
  'fehlend',
  'falsche Ware',
  'Mengendifferenz',
  'Sonstiges',
];

function isTransfer(orderNumber: string): boolean {
  return orderNumber.startsWith('TRF-');
}

function isClickCollect(orderNumber: string): boolean {
  return orderNumber.startsWith('CC-');
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading } = useOrder(id);
  const updateOrder = useUpdateOrder();
  const addStatus = useAddOrderStatus();

  const [showStatusForm, setShowStatusForm] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', notes: '' });
  const [diffReason, setDiffReason] = useState('');

  const [editTracking, setEditTracking] = useState(false);
  const [trackingForm, setTrackingForm] = useState({ trackingNumber: '', carrier: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!order) return <div className="p-xl text-body text-kore-mid">Vorgang nicht gefunden.</div>;

  const transfer = isTransfer(order.orderNumber);
  const cc = isClickCollect(order.orderNumber);
  const statusOptions = transfer ? TRANSFER_STATUSES : cc ? CC_STATUSES : TRANSFER_STATUSES;

  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    let notes = statusForm.notes;
    if (statusForm.status === 'DIFFERENCE_REPORTED' && diffReason) {
      notes = `Grund: ${diffReason}${notes ? ` - ${notes}` : ''}`;
    }
    addStatus.mutate(
      { orderId: order.id, status: statusForm.status, notes },
      {
        onSuccess: () => {
          setShowStatusForm(false);
          setStatusForm({ status: '', notes: '' });
          setDiffReason('');
        },
      },
    );
  };

  const handleTrackingSave = () => {
    updateOrder.mutate(
      { id: order.id, trackingNumber: trackingForm.trackingNumber, carrier: trackingForm.carrier },
      { onSuccess: () => setEditTracking(false) },
    );
  };

  // Calculate duration
  const createdDate = new Date(order.createdAt);
  const lastUpdate = order.statusUpdates?.[0];
  const daysSinceCreation = Math.round(
    (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Check for overdue (> 5 days without completion)
  const isOverdue =
    daysSinceCreation > 5 &&
    !['DELIVERED', 'COMPLETED', 'PICKED_UP', 'RETURNED'].includes(order.status);

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/track-trace" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            {transfer ? <ArrowRightLeft size={24} /> : cc ? <ShoppingBag size={24} /> : <Truck size={24} />}
            {transfer ? 'Transfer' : cc ? 'Click & Collect' : 'Bestellung'} #{order.orderNumber}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {order.customerName} · {order.store?.name ?? '--'} · Erstellt von {order.creator?.name ?? '--'}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {isOverdue && (
            <span className="flex items-center gap-xs px-sm py-xs bg-red-50 text-red-700 text-small">
              <AlertTriangle size={14} /> Ueberfaellig
            </span>
          )}
          <span className={`px-md py-sm text-small ${STATUS_COLORS[order.status] ?? 'bg-kore-bg text-kore-mid'}`}>
            {STATUS_LABELS[order.status] ?? order.status}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
          <div>
            <span className="text-small text-kore-mid">{transfer ? 'Empfaenger' : 'Kundenname'}</span>
            <p className="text-body text-kore-ink">{order.customerName}</p>
          </div>
          {cc && (
            <div>
              <span className="text-small text-kore-mid">Kunden-E-Mail</span>
              <p className="text-body text-kore-ink">{order.customerEmail || '--'}</p>
            </div>
          )}
          <div>
            <span className="text-small text-kore-mid">Tracking-Nr.</span>
            {editTracking ? (
              <div className="flex items-center gap-xs mt-xs">
                <input
                  value={trackingForm.trackingNumber}
                  onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                  className="border border-kore-border px-sm py-xs text-small flex-1"
                  placeholder="Sendungsnummer"
                />
                <button onClick={handleTrackingSave} className="text-emerald-600 hover:text-emerald-800"><Check size={14} /></button>
                <button onClick={() => setEditTracking(false)} className="text-kore-mid hover:text-kore-ink"><X size={14} /></button>
              </div>
            ) : (
              <p className="text-body text-kore-ink flex items-center gap-xs">
                {order.trackingNumber || '--'}
                <button
                  onClick={() => { setEditTracking(true); setTrackingForm({ trackingNumber: order.trackingNumber || '', carrier: order.carrier || '' }); }}
                  className="text-kore-mid hover:text-kore-ink"
                >
                  <Pencil size={12} />
                </button>
              </p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Versanddienstleister</span>
            {editTracking ? (
              <select
                value={trackingForm.carrier}
                onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
                className="border border-kore-border px-sm py-xs text-small w-full mt-xs"
              >
                <option value="">--</option>
                <option value="DHL">DHL</option>
                <option value="UPS">UPS</option>
                <option value="DPD">DPD</option>
                <option value="Hermes">Hermes</option>
                <option value="GLS">GLS</option>
                <option value="Intern">Intern (Kurier)</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{order.carrier || '--'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">
              {transfer ? 'Erwartete Ankunft' : cc ? 'Abholung bis' : 'Voraussichtliche Lieferung'}
            </span>
            <p className="text-body text-kore-ink">
              {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('de-DE') : '--'}
            </p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Erstellt am</span>
            <p className="text-body text-kore-ink">{createdDate.toLocaleString('de-DE')}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Laufzeit</span>
            <p className={`text-body font-medium ${isOverdue ? 'text-red-600' : 'text-kore-ink'}`}>
              {daysSinceCreation} Tage
            </p>
          </div>
        </div>
      </div>

      {/* Difference warning for transfers */}
      {transfer && order.statusUpdates?.some((su: any) => su.status === 'DIFFERENCE_REPORTED') && (
        <div className="bg-red-50 border border-red-200 p-lg mb-xl">
          <h3 className="text-body font-medium text-red-800 flex items-center gap-sm mb-sm">
            <AlertTriangle size={16} /> Differenz gemeldet
          </h3>
          {order.statusUpdates
            .filter((su: any) => su.status === 'DIFFERENCE_REPORTED')
            .map((su: any) => (
              <p key={su.id} className="text-small text-red-700">
                {su.notes || 'Keine Details'} -- {su.updater?.name ?? '--'}, {new Date(su.createdAt).toLocaleString('de-DE')}
              </p>
            ))}
        </div>
      )}

      {/* Status Timeline */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm">
            <Clock size={18} /> Status-Verlauf
          </h2>
          <button
            onClick={() => setShowStatusForm(!showStatusForm)}
            className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={14} /> Status-Update
          </button>
        </div>

        {showStatusForm && (
          <form onSubmit={handleAddStatus} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Neuer Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full border border-kore-border px-md py-sm text-body"
                  required
                >
                  <option value="">-- Status waehlen --</option>
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              {statusForm.status === 'DIFFERENCE_REPORTED' && (
                <div>
                  <label className="block text-small text-kore-mid mb-xs">Differenz-Grund</label>
                  <select
                    value={diffReason}
                    onChange={(e) => setDiffReason(e.target.value)}
                    className="w-full border border-kore-border px-md py-sm text-body"
                    required
                  >
                    <option value="">-- Grund waehlen --</option>
                    {DIFFERENCE_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className={statusForm.status === 'DIFFERENCE_REPORTED' ? 'md:col-span-2' : ''}>
                <label className="block text-small text-kore-mid mb-xs">Notiz / Details</label>
                <input
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  className="w-full border border-kore-border px-md py-sm text-body"
                  placeholder={statusForm.status === 'DIFFERENCE_REPORTED' ? 'z.B. 2 Artikel fehlend, 1 beschaedigt' : 'Optional'}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addStatus.isPending}
              className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {addStatus.isPending ? 'Speichern...' : 'Status speichern'}
            </button>
          </form>
        )}

        {!order.statusUpdates?.length ? (
          <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">
            Noch keine Status-Updates.
          </div>
        ) : (
          <div className="space-y-sm">
            {order.statusUpdates.map((su: any) => (
              <div key={su.id} className="bg-kore-white border border-kore-border p-md flex items-start gap-md">
                <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                  su.status === 'DIFFERENCE_REPORTED' ? 'bg-red-500' :
                  su.status === 'DELIVERED' || su.status === 'COMPLETED' || su.status === 'PICKED_UP' ? 'bg-emerald-500' :
                  'bg-kore-ink'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-sm">
                    <span className={`px-sm py-xs text-small ${STATUS_COLORS[su.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                      {STATUS_LABELS[su.status] ?? su.status}
                    </span>
                    <span className="text-small text-kore-mid">{new Date(su.createdAt).toLocaleString('de-DE')}</span>
                    <span className="text-small text-kore-mid">von {su.updater?.name ?? '--'}</span>
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
