import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Wrench, Package } from 'lucide-react';
import { useRmAlerts } from '../../../hooks/useRmDashboard';

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export function AlertsPage() {
  const { data: alerts, isLoading } = useRmAlerts();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/rm-dashboard" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><AlertTriangle size={24} /> Alerts</h1>
          <p className="text-body text-kore-mid mt-xs">Kritische Themen, die Aufmerksamkeit erfordern.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Alerts...</div>
      ) : !alerts?.length ? (
        <div className="bg-emerald-50 border border-emerald-200 p-2xl text-center text-body text-emerald-700">Keine kritischen Alerts vorhanden — alles im grünen Bereich.</div>
      ) : (
        <div className="space-y-sm">
          {alerts.map((a: any, i: number) => (
            <div key={i} className="bg-kore-white border border-kore-border p-md flex items-start gap-md">
              {a.type === 'MAINTENANCE' ? <Wrench size={18} className="text-amber-500 mt-1" /> : <Package size={18} className="text-blue-500 mt-1" />}
              <div className="flex-1">
                <div className="flex items-center gap-sm mb-xs">
                  <span className="font-medium text-kore-ink">{a.title}</span>
                  <span className={`px-sm py-xs text-small ${SEVERITY_COLORS[a.severity] ?? 'bg-kore-bg text-kore-mid'}`}>{a.severity}</span>
                </div>
                <div className="flex gap-md text-small text-kore-mid">
                  <span>{a.type === 'MAINTENANCE' ? 'Wartung' : 'Stock'}</span>
                  <span>{a.store}</span>
                  <span>{new Date(a.createdAt).toLocaleDateString('de-DE')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
