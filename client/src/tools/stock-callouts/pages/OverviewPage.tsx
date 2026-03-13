import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, AlertTriangle } from 'lucide-react';
import { useStockCallouts, useCreateStockCallout, useStockCalloutsSummary } from '../../../hooks/useStockCallouts';

const STATUS_LABELS: Record<string, string> = { OPEN: 'Offen', ORDERED: 'Bestellt', RECEIVED: 'Erhalten', CANCELLED: 'Storniert' };
const STATUS_COLORS: Record<string, string> = { OPEN: 'bg-blue-100 text-blue-700', ORDERED: 'bg-amber-100 text-amber-700', RECEIVED: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-red-100 text-red-700' };
const URGENCY_COLORS: Record<string, string> = { LOW: 'bg-gray-100 text-gray-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-orange-100 text-orange-700', CRITICAL: 'bg-red-100 text-red-700' };

export function OverviewPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const { data, isLoading } = useStockCallouts({ status: statusFilter || undefined, urgency: urgencyFilter || undefined });
  const { data: summary } = useStockCalloutsSummary();
  const create = useCreateStockCallout();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sku: '', productName: '', currentStock: '', reorderPoint: '', requestedQty: '', urgency: 'MEDIUM' });

  const callouts = data?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, currentStock: Number(form.currentStock), reorderPoint: Number(form.reorderPoint), requestedQty: Number(form.requestedQty) },
      { onSuccess: () => { setShowForm(false); setForm({ sku: '', productName: '', currentStock: '', reorderPoint: '', requestedQty: '', urgency: 'MEDIUM' }); } },
    );
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Package size={24} /> Stock Callouts</h1>
          <p className="text-body text-kore-mid mt-xs">Nachbestellungen und Bestandsmeldungen verwalten.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neues Callout
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
              <label className="block text-small text-kore-mid mb-xs">SKU / Artikelnr.</label>
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Produktname</label>
              <input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Dringlichkeit</label>
              <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="CRITICAL">Kritisch</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Aktueller Bestand</label>
              <input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Nachbestellpunkt</label>
              <input type="number" value={form.reorderPoint} onChange={e => setForm({ ...form, reorderPoint: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Angeforderte Menge</label>
              <input type="number" value={form.requestedQty} onChange={e => setForm({ ...form, requestedQty: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            {create.isPending ? 'Speichern...' : 'Callout erstellen'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-md mb-lg">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Status</option>
          <option value="OPEN">Offen</option>
          <option value="ORDERED">Bestellt</option>
          <option value="RECEIVED">Erhalten</option>
          <option value="CANCELLED">Storniert</option>
        </select>
        <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Dringlichkeiten</option>
          <option value="LOW">Niedrig</option>
          <option value="MEDIUM">Mittel</option>
          <option value="HIGH">Hoch</option>
          <option value="CRITICAL">Kritisch</option>
        </select>
      </div>

      {/* Callout List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Callouts...</div>
      ) : !callouts.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Keine Stock Callouts vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {callouts.map((c: any) => (
            <Link key={c.id} to={`/tools/stock-callouts/callouts/${c.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  {c.urgency === 'CRITICAL' || c.urgency === 'HIGH' ? <AlertTriangle size={18} className="text-red-500" /> : <Package size={18} className="text-kore-mid" />}
                  <div>
                    <span className="font-medium text-kore-ink">{c.productName}</span>
                    <span className="text-small text-kore-mid ml-sm">SKU: {c.sku}</span>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`px-sm py-xs text-small ${URGENCY_COLORS[c.urgency] ?? 'bg-kore-bg text-kore-mid'}`}>{c.urgency}</span>
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[c.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[c.status] ?? c.status}</span>
                </div>
              </div>
              <div className="flex gap-lg mt-xs text-small text-kore-mid">
                <span>Bestand: {c.currentStock}</span>
                <span>Nachbestellpunkt: {c.reorderPoint}</span>
                <span>Angefordert: {c.requestedQty}</span>
                <span>{c.store?.name ?? '—'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
