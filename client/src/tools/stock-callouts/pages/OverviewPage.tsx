import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Plus, AlertTriangle, BarChart3, Search, X,
  ArrowRight, Truck, CheckCircle, XCircle, Clipboard,
} from 'lucide-react';
import {
  useStockCalloutStores,
  useStockCallouts,
  useCreateStockCallout,
  useUpdateStockCallout,
  useStockCalloutsSummary,
  useOfferStock,
  useConfirmTransfer,
  useResolveCallout,
} from '../../../hooks/useStockCallouts';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  OFFERED: 'Angeboten',
  TRANSFER: 'Transfer',
  RESOLVED: 'Geloest',
  CANCELLED: 'Storniert',
};
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  OFFERED: 'bg-amber-100 text-amber-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const URGENCY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  NORMAL: 'Normal',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};
const URGENCY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

/* eslint-disable @typescript-eslint/no-explicit-any */

export function OverviewPage() {
  const { data: stores } = useStockCalloutStores();
  const [storeId, setStoreId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  // Auto-select first store
  useEffect(() => { if (stores?.length && !storeId) setStoreId(stores[0].id); }, [stores, storeId]);

  const { data, isLoading } = useStockCallouts({
    storeId: storeId || undefined,
    status: statusFilter || undefined,
    urgency: urgencyFilter || undefined,
  });
  const { data: summary } = useStockCalloutsSummary({ storeId: storeId || undefined });

  const create = useCreateStockCallout();
  const update = useUpdateStockCallout();
  const offerStock = useOfferStock();
  const confirmTransfer = useConfirmTransfer();
  const resolveCallout = useResolveCallout();

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sku: '', productName: '', currentStock: '', reorderPoint: '', requestedQty: '', urgency: 'NORMAL', notes: '' });

  // Offer modal
  const [offerModal, setOfferModal] = useState<any>(null);
  const [offerQty, setOfferQty] = useState(1);
  const [offerNotes, setOfferNotes] = useState('');

  // Detail modal
  const [detailModal, setDetailModal] = useState<any>(null);

  const callouts = data?.data ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        storeId,
        sku: form.sku,
        productName: form.productName,
        currentStock: Number(form.currentStock) || 0,
        reorderPoint: Number(form.reorderPoint) || 0,
        requestedQty: Number(form.requestedQty),
        urgency: form.urgency,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ sku: '', productName: '', currentStock: '', reorderPoint: '', requestedQty: '', urgency: 'NORMAL', notes: '' });
        },
      },
    );
  };

  const handleOffer = () => {
    if (!offerModal) return;
    offerStock.mutate(
      { id: offerModal.id, storeId, availableQty: offerQty, notes: offerNotes || undefined },
      { onSuccess: () => { setOfferModal(null); setOfferQty(1); setOfferNotes(''); } },
    );
  };

  const handleTransfer = (id: string) => {
    confirmTransfer.mutate(id);
  };

  const handleResolve = (id: string) => {
    resolveCallout.mutate(id);
  };

  const handleCancel = (id: string) => {
    if (!confirm('Callout wirklich stornieren?')) return;
    update.mutate({ id, status: 'CANCELLED' });
  };

  const openCount = summary?.byStatus?.['OPEN'] ?? 0;
  const offeredCount = summary?.byStatus?.['OFFERED'] ?? 0;
  const transferCount = summary?.byStatus?.['TRANSFER'] ?? 0;
  const resolvedCount = summary?.byStatus?.['RESOLVED'] ?? 0;

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Package size={24} /> Stock Callouts
          </h1>
          <p className="text-body text-kore-mid mt-xs">Inter-Store Stock-Abgleich und Nachbestellungen</p>
        </div>
        <div className="flex items-center gap-sm">
          {stores && stores.length > 1 && (
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small">
              {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <Link to="/tools/stock-callouts/dashboard" className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            <BarChart3 size={14} /> Dashboard
          </Link>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={16} /> Neues Callout
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-blue-600">{openCount}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Offen</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-amber-600">{offeredCount}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Angeboten</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-purple-600">{transferCount}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Transfer</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-emerald-600">{resolvedCount}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Geloest</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-kore-brass">{summary?.total ?? 0}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Gesamt</div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-lg">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-display text-h3 text-kore-ink">Neues Stock Callout</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-kore-mid hover:text-kore-ink"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">SKU / Barcode</label>
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="z.B. 4012345..." className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Produktname</label>
              <input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Dringlichkeit</label>
              <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="LOW">Niedrig</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Hoch</option>
                <option value="CRITICAL">Kritisch</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Aktueller Bestand</label>
              <input type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Nachbestellpunkt</label>
              <input type="number" value={form.reorderPoint} onChange={e => setForm({ ...form, reorderPoint: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Angeforderte Menge</label>
              <input type="number" min={1} value={form.requestedQty} onChange={e => setForm({ ...form, requestedQty: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
          </div>
          <div className="mt-md">
            <label className="block text-small text-kore-mid mb-xs">Notiz (optional)</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="z.B. Kunde fragt nach, dringend..." className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div className="flex justify-end mt-md">
            <button type="submit" disabled={create.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
              <Search size={14} /> {create.isPending ? 'Wird gepostet...' : 'Artikel suchen'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-lg">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-kore-border px-md py-sm text-small">
          <option value="">Alle Status</option>
          <option value="OPEN">Offen</option>
          <option value="OFFERED">Angeboten</option>
          <option value="TRANSFER">Transfer</option>
          <option value="RESOLVED">Geloest</option>
          <option value="CANCELLED">Storniert</option>
        </select>
        <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="border border-kore-border px-md py-sm text-small">
          <option value="">Alle Dringlichkeiten</option>
          <option value="LOW">Niedrig</option>
          <option value="NORMAL">Normal</option>
          <option value="HIGH">Hoch</option>
          <option value="CRITICAL">Kritisch</option>
        </select>
      </div>

      {/* Callout List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Callouts...</div>
      ) : !callouts.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Keine Stock Callouts vorhanden. Erstellen Sie ein neues Callout, um Artikel bei anderen Stores zu suchen.
        </div>
      ) : (
        <div className="space-y-sm">
          {callouts.map((c: any) => (
            <div
              key={c.id}
              className="bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors cursor-pointer"
              onClick={() => setDetailModal(c)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  {c.urgency === 'CRITICAL' || c.urgency === 'HIGH' ? (
                    <AlertTriangle size={18} className="text-red-500" />
                  ) : (
                    <Package size={18} className="text-kore-mid" />
                  )}
                  <div>
                    <span className="font-medium text-kore-ink">{c.productName}</span>
                    <span className="text-small text-kore-mid ml-sm">SKU: {c.sku}</span>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`px-sm py-xs text-xs ${URGENCY_COLORS[c.urgency] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {URGENCY_LABELS[c.urgency] ?? c.urgency}
                  </span>
                  <span className={`px-sm py-xs text-xs ${STATUS_COLORS[c.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-lg mt-xs text-small text-kore-mid">
                <span>Bestand: {c.currentStock}</span>
                <span>Angefordert: {c.requestedQty}</span>
                <span>{c.store?.name ?? ''}</span>
                <span>{c.reporter?.name ? `von ${c.reporter.name}` : ''}</span>
                <span>{new Date(c.createdAt).toLocaleDateString('de-DE')}</span>
              </div>

              {/* Inline workflow actions */}
              <div className="flex gap-sm mt-sm" onClick={e => e.stopPropagation()}>
                {c.status === 'OPEN' && (
                  <button
                    onClick={() => { setOfferModal(c); setOfferQty(c.requestedQty || 1); }}
                    className="flex items-center gap-xs px-sm py-xs text-xs border border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Clipboard size={12} /> Anbieten
                  </button>
                )}
                {c.status === 'OFFERED' && (
                  <button
                    onClick={() => handleTransfer(c.id)}
                    className="flex items-center gap-xs px-sm py-xs text-xs border border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Truck size={12} /> Transfer bestaetigen
                  </button>
                )}
                {c.status === 'TRANSFER' && (
                  <button
                    onClick={() => handleResolve(c.id)}
                    className="flex items-center gap-xs px-sm py-xs text-xs border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <CheckCircle size={12} /> Erhalten / Geloest
                  </button>
                )}
                {(c.status === 'OPEN' || c.status === 'OFFERED') && (
                  <button
                    onClick={() => handleCancel(c.id)}
                    className="flex items-center gap-xs px-sm py-xs text-xs border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <XCircle size={12} /> Stornieren
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {data && data.total > data.pageSize && (
        <div className="mt-md text-small text-kore-mid text-center">
          Seite {data.page} von {Math.ceil(data.total / data.pageSize)} ({data.total} Callouts)
        </div>
      )}

      {/* ── OFFER MODAL ── */}
      {offerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setOfferModal(null)}>
          <div className="bg-kore-white w-full max-w-md p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Stock anbieten</h2>
              <button onClick={() => setOfferModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>
            <div className="bg-kore-bg border border-kore-border p-md mb-lg text-small space-y-1">
              <div className="flex justify-between"><span className="text-kore-mid">Artikel</span><span className="font-medium">{offerModal.productName}</span></div>
              <div className="flex justify-between"><span className="text-kore-mid">SKU</span><span className="font-medium">{offerModal.sku}</span></div>
              <div className="flex justify-between"><span className="text-kore-mid">Angefordert</span><span className="font-medium">{offerModal.requestedQty} Stk.</span></div>
              <div className="flex justify-between"><span className="text-kore-mid">Von Store</span><span className="font-medium">{offerModal.store?.name ?? ''}</span></div>
            </div>
            <label className="block text-small text-kore-mid mb-xs">Verfuegbare Menge</label>
            <input type="number" min={1} value={offerQty} onChange={e => setOfferQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-full border border-kore-border px-md py-sm text-body mb-md" />
            <label className="block text-small text-kore-mid mb-xs">Notiz (optional)</label>
            <input value={offerNotes} onChange={e => setOfferNotes(e.target.value)} placeholder="z.B. Kann morgen versendet werden..." className="w-full border border-kore-border px-md py-sm text-body mb-lg" />
            <button onClick={handleOffer} disabled={offerStock.isPending} className="w-full flex items-center justify-center gap-sm px-md py-md bg-kore-ink text-kore-white font-medium hover:opacity-90 disabled:opacity-50">
              <ArrowRight size={18} /> Angebot senden
            </button>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setDetailModal(null)}>
          <div className="bg-kore-white w-full max-w-lg p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">{detailModal.productName}</h2>
              <button onClick={() => setDetailModal(null)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>
            <div className="space-y-md">
              <div className="grid grid-cols-2 gap-md bg-kore-bg border border-kore-border p-md text-small">
                <div><span className="text-kore-mid block">SKU</span><span className="font-medium">{detailModal.sku}</span></div>
                <div><span className="text-kore-mid block">Store</span><span className="font-medium">{detailModal.store?.name ?? ''}</span></div>
                <div><span className="text-kore-mid block">Status</span><span className={`inline-block px-sm py-xs text-xs ${STATUS_COLORS[detailModal.status] ?? ''}`}>{STATUS_LABELS[detailModal.status] ?? detailModal.status}</span></div>
                <div><span className="text-kore-mid block">Dringlichkeit</span><span className={`inline-block px-sm py-xs text-xs ${URGENCY_COLORS[detailModal.urgency] ?? ''}`}>{URGENCY_LABELS[detailModal.urgency] ?? detailModal.urgency}</span></div>
                <div><span className="text-kore-mid block">Aktueller Bestand</span><span className="font-medium">{detailModal.currentStock}</span></div>
                <div><span className="text-kore-mid block">Nachbestellpunkt</span><span className="font-medium">{detailModal.reorderPoint}</span></div>
                <div><span className="text-kore-mid block">Angefordert</span><span className="font-medium">{detailModal.requestedQty} Stk.</span></div>
                <div><span className="text-kore-mid block">Gemeldet von</span><span className="font-medium">{detailModal.reporter?.name ?? ''}</span></div>
                <div className="col-span-2"><span className="text-kore-mid block">Erstellt am</span><span className="font-medium">{new Date(detailModal.createdAt).toLocaleString('de-DE')}</span></div>
              </div>

              {/* Workflow buttons */}
              <div className="flex flex-wrap gap-sm">
                {detailModal.status === 'OPEN' && (
                  <button
                    onClick={() => { setOfferModal(detailModal); setOfferQty(detailModal.requestedQty || 1); setDetailModal(null); }}
                    className="flex items-center gap-xs px-md py-sm border border-amber-300 text-amber-700 hover:bg-amber-50 text-small"
                  >
                    <Clipboard size={14} /> Anbieten
                  </button>
                )}
                {detailModal.status === 'OFFERED' && (
                  <button
                    onClick={() => { handleTransfer(detailModal.id); setDetailModal(null); }}
                    className="flex items-center gap-xs px-md py-sm border border-purple-300 text-purple-700 hover:bg-purple-50 text-small"
                  >
                    <Truck size={14} /> Transfer bestaetigen
                  </button>
                )}
                {detailModal.status === 'TRANSFER' && (
                  <button
                    onClick={() => { handleResolve(detailModal.id); setDetailModal(null); }}
                    className="flex items-center gap-xs px-md py-sm border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-small"
                  >
                    <CheckCircle size={14} /> Erhalten / Geloest
                  </button>
                )}
                {(detailModal.status === 'OPEN' || detailModal.status === 'OFFERED') && (
                  <button
                    onClick={() => { handleCancel(detailModal.id); setDetailModal(null); }}
                    className="flex items-center gap-xs px-md py-sm border border-red-200 text-red-500 hover:bg-red-50 text-small"
                  >
                    <XCircle size={14} /> Stornieren
                  </button>
                )}
              </div>

              {/* Workflow status indicator */}
              <div className="border-t border-kore-border pt-md">
                <span className="text-small text-kore-mid block mb-sm">Workflow</span>
                <div className="flex items-center gap-xs text-xs">
                  {['OPEN', 'OFFERED', 'TRANSFER', 'RESOLVED'].map((step, idx) => {
                    const statusOrder = ['OPEN', 'OFFERED', 'TRANSFER', 'RESOLVED'];
                    const currentIdx = statusOrder.indexOf(detailModal.status);
                    const stepIdx = idx;
                    const isActive = stepIdx <= currentIdx && detailModal.status !== 'CANCELLED';
                    return (
                      <div key={step} className="flex items-center gap-xs">
                        {idx > 0 && <div className={`w-6 h-px ${isActive ? 'bg-kore-brass' : 'bg-kore-border'}`} />}
                        <div className={`px-sm py-xs ${isActive ? 'bg-kore-brass/10 text-kore-brass font-medium' : 'bg-kore-bg text-kore-mid'}`}>
                          {STATUS_LABELS[step]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
