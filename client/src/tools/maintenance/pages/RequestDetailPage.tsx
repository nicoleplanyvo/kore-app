import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle,
  CircleDot,
  User,
  MapPin,
  Euro,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import {
  useMaintenanceRequest,
  useUpdateMaintenanceRequest,
  useMaintenanceUsers,
} from '../../../hooks/useMaintenance';

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Arbeit',
  RESOLVED: 'Geloest',
  CLOSED: 'Geschlossen',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-kore-bg text-kore-mid border-kore-border',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICAL: 'Elektrik',
  PLUMBING: 'Sanitaer',
  HVAC: 'Heizung/Klima',
  FIXTURE: 'Einrichtung',
  IT: 'IT',
  OTHER: 'Sonstiges',
};

const CATEGORY_OPTIONS = [
  { value: 'ELECTRICAL', label: 'Elektrik' },
  { value: 'PLUMBING', label: 'Sanitaer' },
  { value: 'HVAC', label: 'Heizung/Klima' },
  { value: 'FIXTURE', label: 'Einrichtung' },
  { value: 'IT', label: 'IT' },
  { value: 'OTHER', label: 'Sonstiges' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
] as const;

// SLA in hours
const SLA_HOURS: Record<string, number> = { URGENT: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };

function formatSla(priority: string): string {
  const h = SLA_HOURS[priority];
  if (!h) return '-';
  if (h < 24) return `${h}h`;
  if (h < 168) return `${h / 24}d`;
  return '1W';
}

function isOverdue(createdAt: string, priority: string, status: string): boolean {
  if (status === 'RESOLVED' || status === 'CLOSED') return false;
  const limitHours = SLA_HOURS[priority] ?? 168;
  const hoursElapsed = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  return hoursElapsed > limitHours;
}

export function RequestDetailPage() {
  const { id } = useParams();
  const { data: req, isLoading } = useMaintenanceRequest(id);
  const update = useUpdateMaintenanceRequest();
  const { data: users } = useMaintenanceUsers();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    assignedTo: '',
    estimatedCost: '',
    actualCost: '',
    resolution: '',
  });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!req) return <div className="p-xl text-body text-kore-mid">Meldung nicht gefunden.</div>;

  const overdue = isOverdue(req.createdAt, req.priority, req.status);

  const startEdit = () => {
    setEditForm({
      title: req.title,
      description: req.description,
      category: req.category,
      priority: req.priority,
      assignedTo: req.assignedTo ?? '',
      estimatedCost: req.estimatedCost != null ? String(req.estimatedCost) : '',
      actualCost: req.actualCost != null ? String(req.actualCost) : '',
      resolution: '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    const payload: Record<string, unknown> = { id: req.id };
    if (editForm.title !== req.title) payload['title'] = editForm.title;
    if (editForm.description !== req.description) payload['description'] = editForm.description;
    if (editForm.category !== req.category) payload['category'] = editForm.category;
    if (editForm.priority !== req.priority) payload['priority'] = editForm.priority;
    if (editForm.assignedTo !== (req.assignedTo ?? '')) payload['assignedTo'] = editForm.assignedTo || undefined;
    if (editForm.estimatedCost !== (req.estimatedCost != null ? String(req.estimatedCost) : '')) {
      payload['estimatedCost'] = editForm.estimatedCost ? Number(editForm.estimatedCost) : undefined;
    }
    if (editForm.actualCost !== (req.actualCost != null ? String(req.actualCost) : '')) {
      payload['actualCost'] = editForm.actualCost ? Number(editForm.actualCost) : undefined;
    }
    if (editForm.resolution) payload['resolution'] = editForm.resolution;

    update.mutate(payload as any, {
      onSuccess: () => setIsEditing(false),
    });
  };

  const handleStatusChange = (status: string) => {
    update.mutate({ id: req.id, status });
  };

  const handleAssign = (assignedTo: string) => {
    update.mutate({ id: req.id, assignedTo });
  };

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/maintenance" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Wrench size={24} />
            <span className="truncate">{req.title}</span>
          </h1>
          <div className="flex items-center gap-sm mt-xs flex-wrap">
            <span className="text-body text-kore-mid">{req.store?.name}</span>
            <span className="text-small text-kore-faint">
              {new Date(req.createdAt).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className={`px-sm py-xs text-small border ${STATUS_STYLES[req.status] ?? 'bg-kore-bg text-kore-mid border-kore-border'}`}>
              {STATUS_LABELS[req.status] ?? req.status}
            </span>
            {overdue && (
              <span className="flex items-center gap-xs px-sm py-xs text-small bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle size={12} /> Ueberfaellig
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-sm">
          {req.status !== 'CLOSED' && !isEditing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
            >
              <Edit3 size={16} /> Bearbeiten
            </button>
          )}
        </div>
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Kategorie</div>
          {isEditing ? (
            <select
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              className="w-full border border-kore-border px-sm py-xs text-body"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          ) : (
            <div className="text-body font-medium text-kore-ink">{CATEGORY_LABELS[req.category] ?? req.category}</div>
          )}
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="text-small text-kore-mid mb-xs">Prioritaet</div>
          {isEditing ? (
            <select
              value={editForm.priority}
              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
              className="w-full border border-kore-border px-sm py-xs text-body"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-xs">
              <span className={`text-body font-medium px-sm py-px border ${PRIORITY_BADGE[req.priority] ?? 'text-kore-ink'}`}>
                {PRIORITY_LABELS[req.priority] ?? req.priority}
              </span>
            </div>
          )}
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs">
            <Clock size={12} /> SLA-Zeitlimit
          </div>
          <div className="text-body font-medium text-kore-ink">{formatSla(req.priority)}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs">
            <MapPin size={12} /> Store
          </div>
          <div className="text-body font-medium text-kore-ink">{req.store?.name ?? '-'}</div>
          {req.store?.city && <div className="text-small text-kore-mid">{req.store.city}</div>}
        </div>
      </div>

      {/* Cost section */}
      <div className="grid grid-cols-2 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs">
            <Euro size={12} /> Geschaetzte Kosten
          </div>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editForm.estimatedCost}
              onChange={(e) => setEditForm({ ...editForm, estimatedCost: e.target.value })}
              className="w-full border border-kore-border px-sm py-xs text-body"
              placeholder="0.00"
            />
          ) : (
            <div className="text-body font-medium text-kore-ink">
              {req.estimatedCost != null ? `${Number(req.estimatedCost).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR` : '-'}
            </div>
          )}
        </div>
        <div className="bg-kore-white border border-kore-border p-md">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs">
            <Euro size={12} /> Tatsaechliche Kosten
          </div>
          {isEditing ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={editForm.actualCost}
              onChange={(e) => setEditForm({ ...editForm, actualCost: e.target.value })}
              className="w-full border border-kore-border px-sm py-xs text-body"
              placeholder="0.00"
            />
          ) : (
            <div className="text-body font-medium text-kore-ink">
              {req.actualCost != null ? `${Number(req.actualCost).toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR` : '-'}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-kore-white border border-kore-border p-xl mb-xl">
        <h3 className="text-body font-medium text-kore-ink mb-sm">Beschreibung</h3>
        {isEditing ? (
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={4}
            className="w-full border border-kore-border px-md py-sm text-body resize-y"
          />
        ) : (
          <p className="text-body text-kore-mid whitespace-pre-wrap">{req.description}</p>
        )}
      </div>

      {/* Assignment */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <h3 className="flex items-center gap-xs text-body font-medium text-kore-ink mb-md">
          <User size={16} /> Zuweisung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Gemeldet von</span>
            <p className="text-body text-kore-ink font-medium mt-xs">{req.reporter?.name ?? req.reportedBy}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Zugewiesen an</span>
            {isEditing ? (
              <select
                value={editForm.assignedTo}
                onChange={(e) => setEditForm({ ...editForm, assignedTo: e.target.value })}
                className="w-full border border-kore-border px-sm py-xs text-body mt-xs"
              >
                <option value="">Nicht zugewiesen</option>
                {users?.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            ) : req.assignee ? (
              <p className="text-body text-kore-ink font-medium mt-xs">{req.assignee.name}</p>
            ) : req.status !== 'CLOSED' ? (
              <div className="mt-xs">
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) handleAssign(e.target.value); }}
                  className="border border-kore-border px-sm py-xs text-small"
                >
                  <option value="" disabled>Mitarbeiter zuweisen...</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-body text-kore-mid mt-xs">-</p>
            )}
          </div>
        </div>
        {req.resolvedAt && (
          <div className="mt-md pt-md border-t border-kore-border">
            <span className="text-small text-kore-mid">Geloest am</span>
            <p className="text-body text-kore-ink mt-xs">
              {new Date(req.resolvedAt).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>

      {/* Resolution field (when editing and status is being resolved) */}
      {isEditing && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="text-body font-medium text-kore-ink mb-sm">Loesungsbeschreibung (optional)</h3>
          <textarea
            value={editForm.resolution}
            onChange={(e) => setEditForm({ ...editForm, resolution: e.target.value })}
            rows={3}
            className="w-full border border-kore-border px-md py-sm text-body resize-y"
            placeholder="Beschreibung der durchgefuehrten Reparatur..."
          />
        </div>
      )}

      {/* Edit save/cancel */}
      {isEditing && (
        <div className="flex items-center justify-between border-t border-kore-border pt-lg mb-xl">
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            <X size={16} /> Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
          >
            <Save size={16} /> Speichern
          </button>
        </div>
      )}

      {/* Status workflow buttons */}
      {req.status !== 'CLOSED' && !isEditing && (
        <div className="bg-kore-white border border-kore-border p-lg">
          <h3 className="text-body font-medium text-kore-ink mb-md">Status aendern</h3>
          <div className="flex gap-sm flex-wrap">
            {req.status === 'OPEN' && (
              <button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                disabled={update.isPending}
                className="flex items-center gap-xs px-md py-sm bg-blue-600 text-kore-white text-small hover:bg-blue-700 disabled:opacity-50"
              >
                <Clock size={14} /> In Arbeit nehmen
              </button>
            )}
            {req.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                disabled={update.isPending}
                className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle size={14} /> Als geloest markieren
              </button>
            )}
            {req.status === 'RESOLVED' && (
              <button
                onClick={() => handleStatusChange('CLOSED')}
                disabled={update.isPending}
                className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-dark disabled:opacity-50"
              >
                <CircleDot size={14} /> Abschliessen (bestaetigen)
              </button>
            )}
            {(req.status === 'IN_PROGRESS' || req.status === 'RESOLVED') && (
              <button
                onClick={() => handleStatusChange('OPEN')}
                disabled={update.isPending}
                className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg disabled:opacity-50"
              >
                <AlertTriangle size={14} /> Zurueck auf Offen
              </button>
            )}
          </div>
          {update.isError && (
            <p className="text-small text-red-600 mt-sm">{(update.error as Error).message}</p>
          )}
        </div>
      )}
    </div>
  );
}
