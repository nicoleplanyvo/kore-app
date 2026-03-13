import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useInventoryCount } from '../../../hooks/useInventory';

const STATUS_LABELS: any = {
  IN_PROGRESS: 'In Arbeit',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

const STATUS_STYLES: any = {
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const TYPE_LABELS: any = {
  FULL: 'Vollinventur',
  CYCLE: 'Stichprobe',
  SPOT: 'Spot-Check',
};

export function CountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: count, isLoading } = useInventoryCount(id ?? '');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!count) return <div className="p-xl text-body text-kore-mid">Inventur nicht gefunden.</div>;

  const items = (count.items ?? []) as Array<any>;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/inventory/counts" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Inventur Detail</h1>
          <div className="flex items-center gap-md mt-xs">
            <span className="text-body text-kore-mid">{count.store?.name}</span>
            <span className="text-small px-sm py-px border border-kore-border bg-kore-bg text-kore-ink">{TYPE_LABELS[count.countType] ?? count.countType}</span>
            <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[count.status] ?? ''}`}>{STATUS_LABELS[count.status] ?? count.status}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Positionen</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{items.length}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtabweichung</span>
          <div className={`font-display text-h2 mt-sm ${count.totalVariance != null && Number(count.totalVariance) !== 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {count.totalVariance != null ? `${Number(count.totalVariance) > 0 ? '+' : ''}${Number(count.totalVariance).toLocaleString('de-DE')}` : '–'}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Datum</span>
          <div className="text-body text-kore-ink mt-sm">{new Date(count.countedAt).toLocaleDateString('de-DE')}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Durchgefuehrt von</span>
          <div className="text-body text-kore-ink mt-sm">{count.conductor?.name ?? '–'}</div>
        </div>
      </div>

      {/* Notes */}
      {count.notes && (
        <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Notizen</span>
          <p className="text-body text-kore-ink mt-sm">{count.notes}</p>
        </div>
      )}

      {/* Items */}
      <div>
        <h2 className="font-display text-h2 text-kore-ink mb-lg">Positionen</h2>
        {items.length === 0 ? (
          <div className="text-body text-kore-mid">Keine Positionen erfasst.</div>
        ) : (
          <div className="border border-kore-border bg-kore-white">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">SKU</th>
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Artikel</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Soll</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Ist</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Differenz</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const expected = Number(item.expectedQty ?? 0);
                  const actual = Number(item.actualQty ?? 0);
                  const diff = actual - expected;
                  return (
                    <tr key={item.id} className="border-b border-kore-border last:border-0">
                      <td className="px-lg py-md text-kore-ink font-mono text-small">{item.sku}</td>
                      <td className="px-lg py-md text-kore-ink">{(item.productName) || '-'}</td>
                      <td className="px-lg py-md text-right text-kore-mid">{expected}</td>
                      <td className="px-lg py-md text-right text-kore-ink">{actual}</td>
                      <td className={`px-lg py-md text-right font-medium ${diff !== 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
