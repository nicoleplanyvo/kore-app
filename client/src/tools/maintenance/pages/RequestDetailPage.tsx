import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMaintenanceRequest, useUpdateMaintenanceRequest } from '../../../hooks/useMaintenance';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Arbeit',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

export function RequestDetailPage() {
  const { id } = useParams();
  const { data: req, isLoading } = useMaintenanceRequest(id);
  const update = useUpdateMaintenanceRequest();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!req) return <div className="p-xl text-body text-kore-mid">Request nicht gefunden.</div>;

  const handleStatusChange = (status: string) => {
    update.mutate({ id: req.id, status });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/maintenance/requests" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">{req.title}</h1>
          <div className="flex items-center gap-md mt-xs">
            <span className="text-small text-kore-mid">{req.store?.name}</span>
            <span className="text-small text-kore-faint">{new Date(req.createdAt).toLocaleDateString('de-DE')}</span>
          </div>
        </div>
        <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[req.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
          {STATUS_LABELS[req.status] ?? String(req.status)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid">Kategorie</div>
          <div className="text-body font-medium text-kore-ink mt-xs">{req.category}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid">Priorität</div>
          <div className="text-body font-medium text-kore-ink mt-xs">{req.priority}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid">Geschätzte Kosten</div>
          <div className="text-body font-medium text-kore-ink mt-xs">{req.estimatedCost != null ? `${Number(req.estimatedCost).toLocaleString('de-DE')} €` : '-'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid">Tatsächliche Kosten</div>
          <div className="text-body font-medium text-kore-ink mt-xs">{req.actualCost != null ? `${Number(req.actualCost).toLocaleString('de-DE')} €` : '-'}</div>
        </div>
      </div>

      <div className="bg-kore-white border border-kore-border p-xl mb-xl">
        <h3 className="text-body font-medium text-kore-ink mb-sm">Beschreibung</h3>
        <p className="text-body text-kore-mid whitespace-pre-wrap">{req.description}</p>
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="flex items-center gap-lg text-small text-kore-mid">
          <span>Gemeldet von: {req.reporter?.name ?? req.reportedBy}</span>
          {req.assignee && <span>Zugewiesen an: {req.assignee.name}</span>}
          {req.resolvedAt && <span>Gelöst am: {new Date(req.resolvedAt).toLocaleDateString('de-DE')}</span>}
        </div>
      </div>

      {req.status !== 'CLOSED' && (
        <div className="flex gap-sm">
          {req.status === 'OPEN' && (
            <button onClick={() => handleStatusChange('IN_PROGRESS')} className="px-md py-sm bg-blue-600 text-kore-white text-small hover:bg-blue-700">
              In Arbeit nehmen
            </button>
          )}
          {req.status === 'IN_PROGRESS' && (
            <button onClick={() => handleStatusChange('RESOLVED')} className="px-md py-sm bg-emerald-600 text-kore-white text-small hover:bg-emerald-700">
              Als gelöst markieren
            </button>
          )}
          {req.status === 'RESOLVED' && (
            <button onClick={() => handleStatusChange('CLOSED')} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-dark">
              Abschließen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
