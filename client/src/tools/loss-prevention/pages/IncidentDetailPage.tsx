import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLossIncident } from '../../../hooks/useLossPrevention';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading } = useLossIncident(id ?? '');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!incident) return <div className="p-xl text-body text-kore-mid">Vorfall nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/loss-prevention/incidents" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">{incident.title}</h1>
          <div className="flex items-center gap-md mt-xs">
            <span className="text-body text-kore-mid">{incident.store?.name}</span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Kategorie</span>
          <div className="text-body font-medium text-kore-ink mt-sm capitalize">{(incident.category ?? '').replace(/_/g, ' ')}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Geschaetzter Verlust</span>
          <div className="font-display text-h2 text-red-600 mt-sm">{incident.estimatedLoss != null ? Number(incident.estimatedLoss).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Tatsaechlicher Verlust</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{incident.actualLoss != null ? Number(incident.actualLoss).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) : '–'}</div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
        <span className="text-caption text-kore-mid uppercase tracking-widest">Beschreibung</span>
        <p className="text-body text-kore-ink mt-sm whitespace-pre-wrap">{incident.description || 'Keine Beschreibung vorhanden.'}</p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Vorfall-Datum</span>
          <div className="text-body text-kore-ink mt-sm">{new Date(incident.occurredAt).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gemeldet am</span>
          <div className="text-body text-kore-ink mt-sm">{new Date(incident.reportedAt).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gemeldet von</span>
          <div className="text-body text-kore-ink mt-sm">{incident.reporter?.name ?? '–'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Zugewiesen an</span>
          <div className="text-body text-kore-ink mt-sm">{incident.assignee?.name ?? '–'}</div>
        </div>
      </div>

      {/* Resolution */}
      {incident.resolution && (
        <div className="bg-kore-white border border-kore-border p-xl mt-2xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Loesung</span>
          <p className="text-body text-kore-ink mt-sm whitespace-pre-wrap">{incident.resolution}</p>
          {incident.resolvedAt && (
            <p className="text-small text-kore-mid mt-md">Geloest am: {new Date(incident.resolvedAt).toLocaleDateString('de-DE')}</p>
          )}
        </div>
      )}
    </div>
  );
}
