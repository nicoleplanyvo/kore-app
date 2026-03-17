import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Package,
  RotateCcw,
} from 'lucide-react';
import {
  useInventoryCount,
  useUpsertItem,
  useCompleteCount,
  useApproveCount,
  useCancelCount,
} from '../../../hooks/useInventory';

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'Laufend',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

const STATUS_STYLES: Record<string, string> = {
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const TYPE_LABELS: Record<string, string> = {
  FULL: 'Vollinventur',
  PARTIAL: 'Stichprobe',
  CYCLE: 'Permanent',
};

const SHRINKAGE_CATEGORIES = [
  { value: '', label: '-- Kategorie --' },
  { value: 'Diebstahl', label: 'Diebstahl' },
  { value: 'Fehlbuchung', label: 'Fehlbuchung' },
  { value: 'Beschaedigung', label: 'Beschaedigung' },
  { value: 'Unbekannt', label: 'Unbekannt' },
];

function isApproved(notes: string | null): boolean {
  return !!notes && notes.includes('[FREIGEGEBEN');
}

function getDiscrepancyColor(expectedQty: number, discrepancy: number): string {
  if (discrepancy === 0) return 'text-emerald-600';
  if (expectedQty === 0) return 'text-red-600';
  const rate = Math.abs(discrepancy / expectedQty);
  if (rate > 0.05) return 'text-red-600';
  return 'text-amber-600';
}

function getRowBg(expectedQty: number, discrepancy: number): string {
  if (discrepancy === 0) return '';
  if (expectedQty === 0) return 'bg-red-50/40';
  const rate = Math.abs(discrepancy / expectedQty);
  if (rate > 0.05) return 'bg-red-50/40';
  return 'bg-amber-50/40';
}

function needsRecount(expectedQty: number, discrepancy: number): boolean {
  if (expectedQty === 0) return Math.abs(discrepancy) > 0;
  return Math.abs(discrepancy / expectedQty) > 0.05;
}

export function CountPage() {
  const { id } = useParams<{ id: string }>();
  const { data: count, isLoading, refetch } = useInventoryCount(id);
  const upsertMut = useUpsertItem();
  const completeMut = useCompleteCount();
  const approveMut = useApproveCount();
  const cancelMut = useCancelCount();

  // Item entry form state
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formExpected, setFormExpected] = useState('');
  const [formActual, setFormActual] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const skuInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill from existing items when SKU matches
  useEffect(() => {
    if (!formSku || !count?.items) return;
    const existing = count.items.find((i: any) => i.sku === formSku);
    if (existing) {
      setFormName(existing.productName || '');
      setFormExpected(String(existing.expectedQty));
      setFormPrice(String(existing.unitPrice));
      setFormCategory(existing.category || '');
    }
  }, [formSku, count?.items]);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!count) return <div className="p-xl text-body text-kore-mid">Inventur nicht gefunden.</div>;

  const items = (count.items ?? []) as Array<any>;
  const progress = count.progress ?? {
    totalItems: items.length,
    countedItems: items.length,
    discrepancyCount: 0,
    recountCount: 0,
    totalDiscrepancyValue: 0,
    progressPercent: 100,
  };
  const approved = isApproved(count.notes);
  const isActive = count.status === 'IN_PROGRESS';

  // Shrinkage summary
  const shrinkageItems = items.filter((i: any) => i.discrepancy < 0);
  const totalShrinkageValue = shrinkageItems.reduce(
    (sum: number, i: any) => sum + Math.abs(i.discrepancyValue),
    0
  );

  const handleAddItem = () => {
    if (!formSku || !formName) return;
    const data = {
      countId: id,
      sku: formSku.trim(),
      productName: formName.trim(),
      expectedQty: Number(formExpected) || 0,
      actualQty: Number(formActual) || 0,
      unitPrice: Number(formPrice) || 0,
      category: formCategory || undefined,
      notes: formNotes || undefined,
    };

    upsertMut.mutate(data, {
      onSuccess: (result: any) => {
        // Clear form
        setFormSku('');
        setFormName('');
        setFormExpected('');
        setFormActual('');
        setFormPrice('');
        setFormCategory('');
        setFormNotes('');
        skuInputRef.current?.focus();

        // Show success feedback
        if (result.needsRecount) {
          setSuccessMsg(`${data.sku} erfasst - Nachzaehlung erforderlich (>5% Abweichung)`);
        } else {
          setSuccessMsg(`${data.sku} erfasst`);
        }
        setTimeout(() => setSuccessMsg(''), 3000);
        refetch();
      },
    });
  };

  const handleSkuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If all fields filled, submit. Otherwise, move to next field.
      if (formSku && formName && formActual) {
        handleAddItem();
      }
    }
  };

  const handleComplete = () => {
    if (!id) return;
    completeMut.mutate(id, { onSuccess: () => refetch() });
  };

  const handleApprove = () => {
    if (!id) return;
    approveMut.mutate(id, { onSuccess: () => refetch() });
  };

  const handleCancel = () => {
    if (!id) return;
    cancelMut.mutate(id, { onSuccess: () => refetch() });
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-xl">
        <Link
          to="/tools/inventory"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-md">
            <h1 className="font-display text-h1 text-kore-ink">
              {count.store?.name ?? 'Inventur'}
            </h1>
            <span className="text-small px-sm py-px border border-kore-border bg-kore-bg text-kore-ink">
              {TYPE_LABELS[count.countType] ?? count.countType}
            </span>
            <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[count.status] ?? ''}`}>
              {approved ? 'Freigegeben' : STATUS_LABELS[count.status] ?? count.status}
            </span>
          </div>
          <p className="text-small text-kore-mid mt-xs">
            {new Date(count.countDate).toLocaleDateString('de-DE', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {isActive && (
            <>
              <button
                onClick={handleCancel}
                disabled={cancelMut.isPending}
                className="flex items-center gap-sm px-md py-sm text-small border border-kore-border text-kore-mid hover:text-red-600 hover:border-red-300 transition-colors"
              >
                <XCircle size={14} /> Abbrechen
              </button>
              <button
                onClick={handleComplete}
                disabled={completeMut.isPending}
                className="flex items-center gap-sm px-md py-sm text-small bg-kore-ink text-kore-white hover:bg-kore-brass transition-colors"
              >
                <CheckCircle2 size={14} /> Abschliessen
              </button>
            </>
          )}
          {count.status === 'COMPLETED' && !approved && (
            <button
              onClick={handleApprove}
              disabled={approveMut.isPending}
              className="flex items-center gap-sm px-md py-sm text-small bg-emerald-700 text-kore-white hover:bg-emerald-600 transition-colors"
            >
              <ShieldCheck size={14} /> Freigeben
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-xs">
          <span className="text-small text-kore-mid">Fortschritt</span>
          <span className="text-small font-medium text-kore-ink">{progress.progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-kore-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-kore-brass transition-all duration-500"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt-Artikel</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{progress.totalItems}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gezaehlt</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{progress.countedItems}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Differenzen</span>
          <div className={`font-display text-h2 mt-sm ${progress.discrepancyCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {progress.discrepancyCount}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Schwund-Wert</span>
          <div className={`font-display text-h2 mt-sm ${totalShrinkageValue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalShrinkageValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </div>
        </div>
      </div>

      {/* Success message (gamification feedback) */}
      {successMsg && (
        <div className="mb-lg p-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-small font-medium flex items-center gap-sm">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Item Entry Form */}
      {isActive && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Position erfassen</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-md">
            <div className="md:col-span-1">
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                SKU / Barcode
              </label>
              <input
                ref={skuInputRef}
                type="text"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
                onKeyDown={handleSkuKeyDown}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white font-mono"
                placeholder="Scannen oder eingeben"
                autoFocus
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Produkt
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
                placeholder="Produktname"
              />
            </div>
            <div>
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Soll
              </label>
              <input
                type="number"
                value={formExpected}
                onChange={(e) => setFormExpected(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Ist
              </label>
              <input
                type="number"
                value={formActual}
                onChange={(e) => setFormActual(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Preis
              </label>
              <input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-md mt-md">
            <div className="md:col-span-1">
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Kategorie
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
              >
                {SHRINKAGE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Notizen
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
                placeholder="Optionale Anmerkung..."
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddItem}
                disabled={!formSku || !formName || upsertMut.isPending}
                className="w-full flex items-center justify-center gap-sm px-lg py-sm text-small font-medium uppercase tracking-widest bg-kore-ink text-kore-white hover:bg-kore-brass transition-colors disabled:opacity-40"
              >
                <Plus size={14} /> Erfassen
              </button>
            </div>
          </div>
          {upsertMut.isError && (
            <p className="text-small text-red-600 mt-md">
              Fehler: {(upsertMut.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Items Table */}
      <div className="mb-xl">
        <h2 className="font-display text-h2 text-kore-ink mb-lg">
          Positionen ({items.length})
        </h2>
        {items.length === 0 ? (
          <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
            <Package size={36} className="text-kore-faint mb-md" />
            <p className="text-body text-kore-mid">
              Noch keine Positionen erfasst. Beginnen Sie mit der Zaehlung oben.
            </p>
          </div>
        ) : (
          <div className="border border-kore-border bg-kore-white overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">SKU</th>
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Produkt</th>
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Kategorie</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Soll</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Ist</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Differenz</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Wert</th>
                  <th className="text-center px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const disc = item.discrepancy ?? (item.actualQty - item.expectedQty);
                  const discVal = item.discrepancyValue ?? disc * item.unitPrice;
                  const recount = needsRecount(item.expectedQty, disc);

                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-kore-border last:border-0 ${getRowBg(item.expectedQty, disc)}`}
                    >
                      <td className="px-lg py-md text-kore-ink font-mono text-small">{item.sku}</td>
                      <td className="px-lg py-md text-kore-ink">{item.productName || '-'}</td>
                      <td className="px-lg py-md text-kore-mid text-small">{item.category || '-'}</td>
                      <td className="px-lg py-md text-right text-kore-mid">{item.expectedQty}</td>
                      <td className="px-lg py-md text-right text-kore-ink font-medium">{item.actualQty}</td>
                      <td className={`px-lg py-md text-right font-medium ${getDiscrepancyColor(item.expectedQty, disc)}`}>
                        {disc > 0 ? '+' : ''}{disc}
                      </td>
                      <td className={`px-lg py-md text-right ${discVal !== 0 ? 'text-red-600' : 'text-kore-mid'}`}>
                        {Math.abs(discVal).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </td>
                      <td className="px-lg py-md text-center">
                        {disc === 0 ? (
                          <CheckCircle2 size={16} className="inline text-emerald-500" />
                        ) : recount ? (
                          <span className="inline-flex items-center gap-xs text-red-600">
                            <RotateCcw size={14} />
                            <span className="text-small">Nachzaehlung</span>
                          </span>
                        ) : (
                          <AlertTriangle size={16} className="inline text-amber-500" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shrinkage Summary */}
      {shrinkageItems.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Schwund-Zusammenfassung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div>
              <span className="text-caption text-kore-mid uppercase tracking-widest">Positionen mit Schwund</span>
              <div className="font-display text-h2 text-red-600 mt-sm">{shrinkageItems.length}</div>
            </div>
            <div>
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtwert Schwund</span>
              <div className="font-display text-h2 text-red-600 mt-sm">
                {totalShrinkageValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
            <div>
              <span className="text-caption text-kore-mid uppercase tracking-widest">Nachzaehlungen noetig</span>
              <div className="font-display text-h2 text-amber-600 mt-sm">{progress.recountCount}</div>
            </div>
          </div>

          {/* Shrinkage by category */}
          {(() => {
            const catMap = new Map<string, { count: number; value: number }>();
            shrinkageItems.forEach((i: any) => {
              const cat = i.category || 'Unbekannt';
              const existing = catMap.get(cat) || { count: 0, value: 0 };
              existing.count += 1;
              existing.value += Math.abs(i.discrepancyValue);
              catMap.set(cat, existing);
            });
            const cats = Array.from(catMap.entries()).sort((a, b) => b[1].value - a[1].value);

            return cats.length > 0 ? (
              <div className="mt-lg border-t border-kore-border pt-lg">
                <h3 className="text-caption text-kore-mid uppercase tracking-widest mb-md">Nach Kategorie</h3>
                <div className="space-y-sm">
                  {cats.map(([cat, data]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-small text-kore-ink">{cat}</span>
                      <div className="flex items-center gap-lg">
                        <span className="text-small text-kore-mid">{data.count} Pos.</span>
                        <span className="text-small font-medium text-red-600">
                          {data.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Notes */}
      {count.notes && !count.notes.startsWith('[FREIGEGEBEN') && (
        <div className="bg-kore-white border border-kore-border p-xl mt-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Notizen</span>
          <p className="text-body text-kore-ink mt-sm whitespace-pre-wrap">{count.notes}</p>
        </div>
      )}
    </div>
  );
}
