import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { useStockCallout, useUpdateStockCallout } from '../../../hooks/useStockCallouts';

const STATUS_LABELS: Record<string, string> = { OPEN: 'Offen', ORDERED: 'Bestellt', RECEIVED: 'Erhalten', CANCELLED: 'Storniert' };
const URGENCY_LABELS: Record<string, string> = { LOW: 'Niedrig', MEDIUM: 'Mittel', HIGH: 'Hoch', CRITICAL: 'Kritisch' };

export function CalloutDetailPage() {
  const { id } = useParams();
  const { data: callout, isLoading } = useStockCallout(id);
  const update = useUpdateStockCallout();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!callout) return <div className="p-xl text-body text-kore-mid">Callout nicht gefunden.</div>;

  const startEdit = () => {
    setForm({ status: callout.status, urgency: callout.urgency, currentStock: callout.currentStock, requestedQty: callout.requestedQty });
    setEditing(true);
  };

  const handleSave = () => {
    update.mutate(
      { id: callout.id, ...form, currentStock: Number(form.currentStock), requestedQty: Number(form.requestedQty) },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/stock-callouts" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Package size={24} /> {callout.productName}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            SKU: {callout.sku} · {callout.store?.name ?? '—'} · Gemeldet von {callout.reporter?.name ?? '—'}
          </p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">Bearbeiten</button>
        )}
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Status</span>
            {editing ? (
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="OPEN">Offen</option>
                <option value="ORDERED">Bestellt</option>
                <option value="RECEIVED">Erhalten</option>
                <option value="CANCELLED">Storniert</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{STATUS_LABELS[callout.status] ?? callout.status}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Dringlichkeit</span>
            {editing ? (
              <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="CRITICAL">Kritisch</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{URGENCY_LABELS[callout.urgency] ?? callout.urgency}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Aktueller Bestand</span>
            {editing ? (
              <input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs" />
            ) : (
              <p className="text-body text-kore-ink">{callout.currentStock}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Nachbestellpunkt</span>
            <p className="text-body text-kore-ink">{callout.reorderPoint}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Angeforderte Menge</span>
            {editing ? (
              <input type="number" value={form.requestedQty} onChange={e => setForm({ ...form, requestedQty: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs" />
            ) : (
              <p className="text-body text-kore-ink">{callout.requestedQty}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Erstellt am</span>
            <p className="text-body text-kore-ink">{new Date(callout.createdAt).toLocaleString('de-DE')}</p>
          </div>
        </div>
      </div>

      {editing && (
        <div className="flex gap-sm">
          <button onClick={handleSave} disabled={update.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Save size={14} /> {update.isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button onClick={() => setEditing(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Abbrechen</button>
        </div>
      )}
    </div>
  );
}
