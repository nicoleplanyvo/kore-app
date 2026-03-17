import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  BarChart3,
  Upload,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RotateCcw,
  Layers,
  X,
} from 'lucide-react';
import {
  useInventoryStores,
  useInventoryCounts,
  useCreateInventoryCount,
  useBatchImportItems,
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

const TYPE_ICONS: Record<string, typeof ClipboardList> = {
  FULL: ClipboardList,
  PARTIAL: Layers,
  CYCLE: RotateCcw,
};

function isApproved(notes: string | null): boolean {
  return !!notes && notes.includes('[FREIGEGEBEN');
}

export function OverviewPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const { data: stores } = useInventoryStores();
  const { data, isLoading } = useInventoryCounts({
    storeId: storeId || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });

  const counts = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Inventur</h1>
          <p className="text-body text-kore-mid mt-xs">
            Bestandsaufnahmen durchfuehren und Abweichungen erkennen
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/inventory/dashboard"
            className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest text-kore-ink hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} /> Neue Inventur
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-xl">
        <select
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: { id: string; name: string; city?: string }) => (
            <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Status</option>
          <option value="IN_PROGRESS">Laufend</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="CANCELLED">Abgebrochen</option>
        </select>
        <button
          onClick={() => setShowCsvModal(true)}
          className="flex items-center gap-sm border border-kore-border px-md py-sm text-small text-kore-ink hover:bg-kore-bg transition-colors"
        >
          <Upload size={14} /> CSV Import
        </button>
      </div>

      {/* Count List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : counts.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Package size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Inventuren vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Starten Sie Ihre erste Bestandsaufnahme, um Soll- und Ist-Werte systematisch zu erfassen.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} /> Inventur starten
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-md">
            {counts.map((c: any) => {
              const TypeIcon = TYPE_ICONS[c.countType] || ClipboardList;
              const progressPct = c.totalItems > 0
                ? Math.round((c.countedItems / c.totalItems) * 100)
                : c.countedItems > 0 ? 100 : 0;
              const approved = isApproved(c.notes);

              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/tools/inventory/count/${c.id}`)}
                  className="w-full text-left block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-lg">
                      <TypeIcon size={20} className="text-kore-mid flex-shrink-0" />
                      <div>
                        <span className="text-body font-medium text-kore-ink">
                          {c.store?.name ?? 'Store'}
                        </span>
                        <div className="flex items-center gap-md mt-xs flex-wrap">
                          <span className="text-small px-sm py-px border border-kore-border bg-kore-bg text-kore-ink">
                            {TYPE_LABELS[c.countType] ?? c.countType}
                          </span>
                          <span className="text-small text-kore-faint">
                            {new Date(c.countDate).toLocaleDateString('de-DE')}
                          </span>
                          <span className="text-small text-kore-faint">
                            {c._count?.items ?? 0} Positionen
                          </span>
                        </div>
                        {/* Progress bar */}
                        {c.status === 'IN_PROGRESS' && (
                          <div className="mt-sm flex items-center gap-md">
                            <div className="w-32 h-1.5 bg-kore-bg rounded-full overflow-hidden">
                              <div
                                className="h-full bg-kore-brass transition-all"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-small text-kore-mid">{progressPct}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-lg">
                      {c.discrepancies > 0 && (
                        <span className="text-small text-amber-600 font-medium">
                          {c.discrepancies} Differenzen
                        </span>
                      )}
                      {c.totalValue > 0 && (
                        <span className="text-small text-kore-mid">
                          {Number(c.totalValue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </span>
                      )}
                      <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[c.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
                        {approved ? 'Freigegeben' : STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">
                {total} Inventuren &middot; Seite {page} von {totalPages}
              </span>
              <div className="flex gap-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCountModal
          stores={stores ?? []}
          onClose={() => setShowCreateModal(false)}
          onCreated={(id) => {
            setShowCreateModal(false);
            navigate(`/tools/inventory/count/${id}`);
          }}
        />
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <CsvImportModal
          onClose={() => setShowCsvModal(false)}
        />
      )}
    </div>
  );
}

// ── Create Count Modal ───────────────────────────────────
function CreateCountModal({
  stores,
  onClose,
  onCreated,
}: {
  stores: Array<{ id: string; name: string; city?: string }>;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [storeId, setStoreId] = useState(stores.length === 1 ? stores[0].id : '');
  const [countType, setCountType] = useState<'FULL' | 'PARTIAL' | 'CYCLE'>('FULL');
  const [notes, setNotes] = useState('');
  const createMut = useCreateInventoryCount();

  const handleSubmit = () => {
    if (!storeId) return;
    const today = new Date().toISOString().slice(0, 10);
    createMut.mutate(
      { storeId, countType, countDate: today, notes: notes || undefined },
      { onSuccess: (data: any) => onCreated(data.id) }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-kore-white border border-kore-border p-2xl w-full max-w-lg mx-xl">
        <div className="flex items-center justify-between mb-xl">
          <h2 className="font-display text-h2 text-kore-ink">Neue Inventur starten</h2>
          <button onClick={onClose} className="text-kore-mid hover:text-kore-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-lg">
          {/* Store */}
          <div>
            <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Store</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
            >
              <option value="">Store waehlen...</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Inventur-Typ</label>
            <div className="grid grid-cols-3 gap-md">
              {(['FULL', 'PARTIAL', 'CYCLE'] as const).map((t) => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    onClick={() => setCountType(t)}
                    className={`flex flex-col items-center gap-sm p-lg border transition-colors ${
                      countType === t
                        ? 'border-kore-brass bg-kore-brass/5 text-kore-ink'
                        : 'border-kore-border text-kore-mid hover:border-kore-ink'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-small font-medium">{TYPE_LABELS[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Notizen</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-kore-border px-md py-sm text-small bg-kore-white resize-none"
              placeholder="Optionale Anmerkungen zur Inventur..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-md mt-xl">
          <button
            onClick={onClose}
            className="px-lg py-md-sm text-small font-medium uppercase tracking-widest border border-kore-border text-kore-ink hover:bg-kore-bg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={!storeId || createMut.isPending}
            className="px-lg py-md-sm text-small font-medium uppercase tracking-widest bg-kore-ink text-kore-white hover:bg-kore-brass transition-colors disabled:opacity-40"
          >
            {createMut.isPending ? 'Wird erstellt...' : 'Inventur starten'}
          </button>
        </div>

        {createMut.isError && (
          <p className="text-small text-red-600 mt-md">
            Fehler: {(createMut.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

// ── CSV Import Modal ─────────────────────────────────────
function CsvImportModal({ onClose }: { onClose: () => void }) {
  const [countId, setCountId] = useState('');
  const [parsedItems, setParsedItems] = useState<any[]>([]);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const batchMut = useBatchImportItems();

  // Fetch in-progress counts for dropdown
  const { data: countsData } = useInventoryCounts({ status: 'IN_PROGRESS', pageSize: 50 });
  const inProgressCounts = countsData?.data ?? [];

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setParsedItems([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setParseError('CSV muss mindestens eine Kopfzeile und eine Datenzeile haben.');
          return;
        }

        const headers = lines[0].toLowerCase().split(/[;\t,]/).map((h) => h.trim());
        const skuIdx = headers.findIndex((h) => h === 'sku' || h === 'artikelnr');
        const nameIdx = headers.findIndex((h) => h === 'productname' || h === 'produkt' || h === 'artikel' || h === 'name');
        const expectedIdx = headers.findIndex((h) => h === 'expectedqty' || h === 'soll' || h === 'sollbestand' || h === 'expected');
        const actualIdx = headers.findIndex((h) => h === 'actualqty' || h === 'ist' || h === 'istbestand' || h === 'actual');
        const priceIdx = headers.findIndex((h) => h === 'unitprice' || h === 'preis' || h === 'price' || h === 'vk');
        const catIdx = headers.findIndex((h) => h === 'category' || h === 'kategorie');

        if (skuIdx === -1 || nameIdx === -1) {
          setParseError('CSV muss mindestens Spalten "SKU" und "Produkt/Name" enthalten.');
          return;
        }

        const items: any[] = [];
        const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ''));
          if (!cols[skuIdx]) continue;

          items.push({
            sku: cols[skuIdx],
            productName: cols[nameIdx] || cols[skuIdx],
            category: catIdx >= 0 ? cols[catIdx] || undefined : undefined,
            expectedQty: expectedIdx >= 0 ? Number(cols[expectedIdx]) || 0 : 0,
            actualQty: actualIdx >= 0 ? Number(cols[actualIdx]) || 0 : 0,
            unitPrice: priceIdx >= 0 ? Number(cols[priceIdx]?.replace(',', '.')) || 0 : 0,
          });
        }

        if (items.length === 0) {
          setParseError('Keine gueltigen Zeilen in der CSV gefunden.');
          return;
        }

        setParsedItems(items);
      } catch {
        setParseError('Fehler beim Parsen der CSV-Datei.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleImport = () => {
    if (!countId || parsedItems.length === 0) return;
    batchMut.mutate(
      { countId, items: parsedItems },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-kore-white border border-kore-border p-2xl w-full max-w-lg mx-xl">
        <div className="flex items-center justify-between mb-xl">
          <h2 className="font-display text-h2 text-kore-ink">Soll-Bestaende importieren</h2>
          <button onClick={onClose} className="text-kore-mid hover:text-kore-ink">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-lg">
          <div>
            <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
              Inventur waehlen
            </label>
            <select
              value={countId}
              onChange={(e) => setCountId(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
            >
              <option value="">Laufende Inventur waehlen...</option>
              {inProgressCounts.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.store?.name} - {TYPE_LABELS[c.countType]} ({new Date(c.countDate).toLocaleDateString('de-DE')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
              CSV-Datei
            </label>
            <p className="text-small text-kore-mid mb-sm">
              Spalten: SKU, Produkt, Soll (oder expectedQty), Preis (optional), Kategorie (optional)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFileChange}
              className="w-full text-small text-kore-ink"
            />
          </div>

          {parseError && <p className="text-small text-red-600">{parseError}</p>}

          {parsedItems.length > 0 && (
            <div className="border border-kore-border bg-kore-bg p-md">
              <p className="text-small text-kore-ink font-medium">
                {parsedItems.length} Positionen erkannt
              </p>
              <p className="text-small text-kore-mid mt-xs">
                Vorschau: {parsedItems.slice(0, 3).map((i) => i.sku).join(', ')}
                {parsedItems.length > 3 ? '...' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-md mt-xl">
          <button
            onClick={onClose}
            className="px-lg py-md-sm text-small font-medium uppercase tracking-widest border border-kore-border text-kore-ink hover:bg-kore-bg transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleImport}
            disabled={!countId || parsedItems.length === 0 || batchMut.isPending}
            className="px-lg py-md-sm text-small font-medium uppercase tracking-widest bg-kore-ink text-kore-white hover:bg-kore-brass transition-colors disabled:opacity-40"
          >
            {batchMut.isPending ? 'Importiere...' : `${parsedItems.length} Positionen importieren`}
          </button>
        </div>

        {batchMut.isError && (
          <p className="text-small text-red-600 mt-md">
            Fehler: {(batchMut.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}
