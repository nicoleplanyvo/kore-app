import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Wrench, Package, ShieldAlert } from 'lucide-react';
import { useRmAlerts } from '../../../hooks/useRmDashboard';

const SEVERITY_COLORS: Record<string, string> = {
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

const TYPE_ICONS: Record<string, typeof Wrench> = {
  MAINTENANCE: Wrench,
  STOCK: Package,
  LOSS: ShieldAlert,
};

const TYPE_LABELS: Record<string, string> = {
  MAINTENANCE: 'Wartung',
  STOCK: 'Stock',
  LOSS: 'Verlust',
};

export function AlertsPage() {
  const { data: alerts, isLoading } = useRmAlerts();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/rm-dashboard" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <AlertTriangle size={24} /> Alerts
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Kritische Themen, die sofortige Aufmerksamkeit erfordern.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Alerts...</div>
      ) : !alerts?.length ? (
        <div className="bg-emerald-50 border border-emerald-200 p-2xl text-center text-body text-emerald-700">
          Keine kritischen Alerts vorhanden -- alles im gruenen Bereich.
        </div>
      ) : (
        <>
          <div className="text-small text-kore-mid mb-md">{alerts.length} aktive Alerts</div>
          <div className="space-y-sm">
            {alerts.map((a, i) => {
              const Icon = TYPE_ICONS[a.type] ?? AlertTriangle;
              return (
                <div key={i} className="bg-kore-white border border-kore-border p-md flex items-start gap-md">
                  <Icon
                    size={18}
                    className={`mt-0.5 ${a.type === 'MAINTENANCE' ? 'text-amber-500' : a.type === 'STOCK' ? 'text-blue-500' : 'text-red-500'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm mb-xs flex-wrap">
                      <span className="font-medium text-kore-ink">{a.title}</span>
                      <span
                        className={`px-sm py-xs text-small ${SEVERITY_COLORS[a.severity] ?? 'bg-kore-bg text-kore-mid'}`}
                      >
                        {a.severity}
                      </span>
                    </div>
                    <div className="flex gap-md text-small text-kore-mid flex-wrap">
                      <span>{TYPE_LABELS[a.type] ?? a.type}</span>
                      <Link
                        to={`/tools/rm-dashboard/store/${a.storeId}`}
                        className="hover:text-kore-ink transition-colors"
                      >
                        {a.store}
                      </Link>
                      <span>{new Date(a.createdAt).toLocaleDateString('de-DE')}</span>
                      <span className="text-kore-faint">{a.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
