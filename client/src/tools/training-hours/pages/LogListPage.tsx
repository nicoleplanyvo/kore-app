import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, User } from 'lucide-react';
import { useTrainingLogs, useTrainingStores } from '../../../hooks/useTrainingHours';

const CATEGORY_LABELS: Record<string, string> = { PRODUCT: 'Produkt', SALES: 'Verkauf', SERVICE: 'Service', COMPLIANCE: 'Compliance', ONBOARDING: 'Onboarding', OTHER: 'Sonstiges' };

export function LogListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [category, setCategory] = useState('');
  const { data: stores } = useTrainingStores();
  const { data, isLoading } = useTrainingLogs({ page, storeId: storeId || undefined, category: category || undefined });

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/training-hours" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Alle Einträge</h1>
          <p className="text-body text-kore-mid mt-xs">Übersicht aller Training-Einträge</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Kategorien</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !data?.data?.length ? (
        <div className="text-body text-kore-mid">Keine Einträge gefunden.</div>
      ) : (
        <>
          <div className="space-y-sm">
            {data.data.map((log: any) => (
              <div key={log.id} className="bg-kore-white border border-kore-border p-md">
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <User size={14} className="text-kore-mid" />
                    <span className="font-medium text-kore-ink">{log.user?.name ?? 'Unbekannt'}</span>
                    {log.store && <span className="text-small text-kore-mid">· {log.store.name}</span>}
                  </div>
                  <span className="text-small text-kore-mid">{new Date(log.date).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex gap-lg text-small text-kore-mid">
                  <span className="flex items-center gap-xs"><Clock size={12} /> {log.durationMinutes} Min</span>
                  <span>{CATEGORY_LABELS[log.category] ?? log.category}</span>
                  {log.topic && <span>{log.topic}</span>}
                </div>
                {log.notes && <p className="text-small text-kore-mid mt-xs">{log.notes}</p>}
              </div>
            ))}
          </div>
          {data.total > data.pageSize && (
            <div className="flex gap-sm mt-lg">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Zurück</button>
              <span className="px-md py-sm text-small text-kore-mid">Seite {data.page} / {Math.ceil(data.total / data.pageSize)}</span>
              <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
