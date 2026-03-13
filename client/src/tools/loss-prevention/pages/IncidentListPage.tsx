import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLossIncidents, useLossStores } from '../../../hooks/useLossPrevention';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export function IncidentListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const { data: stores } = useLossStores();
  const { data, isLoading } = useLossIncidents(page, storeId || undefined, status || undefined, category || undefined);
  const incidents = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/loss-prevention" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Vorfaelle</h1>
          <p className="text-body text-kore-mid mt-xs">Alle gemeldeten Vorfaelle</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-md mb-xl">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="OPEN">Offen</option>
          <option value="INVESTIGATING">In Untersuchung</option>
          <option value="RESOLVED">Geloest</option>
          <option value="CLOSED">Geschlossen</option>
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Kategorien</option>
          <option value="THEFT">Diebstahl</option>
          <option value="FRAUD">Betrug</option>
          <option value="DAMAGE">Beschaedigung</option>
          <option value="ADMIN_ERROR">Verwaltungsfehler</option>
          <option value="VENDOR">Lieferant</option>
          <option value="OTHER">Sonstige</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : incidents.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Vorfaelle gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {incidents.map((i: any) => (
              <Link key={i.id} to={`/tools/loss-prevention/incidents/${i.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-body font-medium text-kore-ink">{i.title}</span>
                    <div className="flex items-center gap-md mt-xs">
                      <span className="text-small text-kore-mid">{(i.store as any)?.name}</span>
                      <SeverityBadge severity={i.severity} />
                      <span className="text-small text-kore-faint capitalize">{(i.category).replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-lg">
                    {i.estimatedLoss != null && (
                      <span className="text-body font-medium text-red-600">{Number(i.estimatedLoss).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
                    )}
                    <StatusBadge status={i.status} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Vorfaelle &middot; Seite {page} von {totalPages}</span>
              <div className="flex gap-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
