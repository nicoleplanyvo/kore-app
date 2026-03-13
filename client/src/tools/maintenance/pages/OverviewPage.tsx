import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, List, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import { useMaintenanceStores, useMaintenanceSummary } from '../../../hooks/useMaintenance';

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const { data: stores } = useMaintenanceStores();
  const { data: summary, isLoading } = useMaintenanceSummary(storeId || undefined);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/maintenance" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Maintenance</h1>
          <p className="text-body text-kore-mid mt-xs">Store-Wartung und Reparatur-Management</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <Link to="/tools/maintenance/requests" className="px-md py-sm border border-kore-border text-small hover:bg-kore-bg transition-colors flex items-center gap-xs">
          <List size={14} /> Alle Requests
        </Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !summary ? (
        <div className="text-body text-kore-mid">Keine Daten verfügbar.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-xl">
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-xs text-small text-kore-mid mb-xs"><Wrench size={14} /> Gesamt</div>
              <div className="text-h2 font-display text-kore-ink">{summary.total}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-xs text-small text-amber-600 mb-xs"><AlertTriangle size={14} /> Offen</div>
              <div className="text-h2 font-display text-amber-600">{summary.byStatus?.OPEN ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-xs text-small text-blue-600 mb-xs"><Wrench size={14} /> In Arbeit</div>
              <div className="text-h2 font-display text-blue-600">{summary.byStatus?.IN_PROGRESS ?? 0}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center gap-xs text-small text-emerald-600 mb-xs"><CheckCircle size={14} /> Erledigt</div>
              <div className="text-h2 font-display text-emerald-600">{(summary.byStatus?.RESOLVED ?? 0) + (summary.byStatus?.CLOSED ?? 0)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="text-body font-medium text-kore-ink mb-md">Nach Priorität</h3>
              {Object.entries(summary.byPriority as Record<string, number>).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-xs">
                  <span className="text-small text-kore-mid">{k}</span>
                  <span className="text-small font-medium text-kore-ink">{v as number}</span>
                </div>
              ))}
            </div>
            <div className="bg-kore-white border border-kore-border p-lg">
              <h3 className="text-body font-medium text-kore-ink mb-md">Nach Kategorie</h3>
              {Object.entries(summary.byCategory as Record<string, number>).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-xs">
                  <span className="text-small text-kore-mid">{k}</span>
                  <span className="text-small font-medium text-kore-ink">{v as number}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
