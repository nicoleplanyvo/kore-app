import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldAlert,
  UserPlus,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Euro,
  User,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  useLossIncident,
  useLossUsers,
  useAssignIncident,
  useEscalateIncident,
  useResolveIncident,
  useUpdateIncident,
} from '../../../hooks/useLossPrevention';

/* ── Maps ───────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  THEFT: 'Diebstahl extern',
  ADMIN_ERROR: 'Kassenfehlbuchung',
  DAMAGE: 'Beschaedigung',
  SUPPLIER: 'WE-Differenz',
  OTHER: 'Sonstige',
};

const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  INVESTIGATING: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  INVESTIGATING: 'In Untersuchung',
  RESOLVED: 'Geloest',
  CLOSED: 'Geschlossen',
};

function formatEUR(val: number) {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

/* ── Component ──────────────────────────────────────────────── */

export function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: incident, isLoading } = useLossIncident(id);
  const { data: users } = useLossUsers(incident?.storeId);
  const assignMutation = useAssignIncident();
  const escalateMutation = useEscalateIncident();
  const resolveMutation = useResolveIncident();
  const updateMutation = useUpdateIncident();

  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [resolution, setResolution] = useState('');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Vorfall...</div>;
  if (!incident) return <div className="p-xl text-body text-kore-mid">Vorfall nicht gefunden.</div>;

  // Parse metadata from description
  const areaMatch = incident.description?.match(/\[Bereich:\s*([^\]]+)\]/);
  const area = areaMatch ? areaMatch[1] : null;
  const subcatMatch = incident.description?.match(/\[Unterkategorie:\s*([^\]]+)\]/);
  const subcategory = subcatMatch ? subcatMatch[1] : null;
  const policeMatch = incident.description?.match(/\[Polizei informiert\](?:\s*Aktenzeichen:\s*(.+))?/);
  const policeInformed = !!policeMatch;
  const policeRef = policeMatch?.[1] || null;
  const escalationMatch = incident.description?.match(/\[ESKALIERT am ([^\]]+)\]/g);

  // Clean description
  const cleanDesc = incident.description
    ?.replace(/\[Bereich:[^\]]+\]\s*/g, '')
    ?.replace(/\n\[Unterkategorie:[^\]]+\]/g, '')
    ?.replace(/\n\[Polizei informiert\](?:\s*Aktenzeichen:\s*.+)?/g, '')
    ?.replace(/\n\n\[ESKALIERT am [^\]]+\]/g, '')
    ?.trim();

  const isOpen = incident.status === 'OPEN';
  const isInvestigating = incident.status === 'INVESTIGATING';
  const isResolved = incident.status === 'RESOLVED';
  const isClosed = incident.status === 'CLOSED';
  const canAct = !isClosed;

  async function handleAssign() {
    if (!id || !assignUserId) return;
    await assignMutation.mutateAsync({ id, assignedTo: assignUserId });
    setShowAssign(false);
    setAssignUserId('');
  }

  async function handleEscalate() {
    if (!id) return;
    await escalateMutation.mutateAsync(id);
  }

  async function handleResolve() {
    if (!id || !resolution) return;
    await resolveMutation.mutateAsync({ id, resolution });
    setShowResolve(false);
    setResolution('');
  }

  async function handleClose() {
    if (!id) return;
    await updateMutation.mutateAsync({ id, status: 'CLOSED' });
  }

  const isAnonymous = incident.reportedBy === 'anonymous' || !incident.reporter;

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/loss-prevention"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-md flex-wrap">
            <h1 className="font-display text-h1 text-kore-ink">
              {CATEGORY_LABELS[incident.category] ?? incident.category}
            </h1>
            <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[incident.status] ?? ''}`}>
              {STATUS_LABELS[incident.status] ?? incident.status}
            </span>
            <span className={`text-small font-medium px-sm py-px border ${SEVERITY_STYLES[incident.severity] ?? ''}`}>
              {SEVERITY_LABELS[incident.severity] ?? incident.severity}
            </span>
          </div>
          <p className="text-body text-kore-mid mt-xs">
            {incident.store?.name} {incident.store?.city ? `(${incident.store.city})` : ''}
            {' '}&middot;{' '}
            {new Date(incident.incidentDate).toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-kore-white border border-kore-border p-xl mb-xl">
        <div className="flex items-center gap-sm mb-md">
          <FileText size={16} className="text-kore-mid" />
          <span className="text-caption text-kore-mid uppercase tracking-widest">Beschreibung</span>
        </div>
        <p className="text-body text-kore-ink whitespace-pre-wrap">{cleanDesc || 'Keine Beschreibung vorhanden.'}</p>
        {subcategory && (
          <div className="mt-md pt-md border-t border-kore-border">
            <span className="text-small text-kore-mid">Unterkategorie: </span>
            <span className="text-small text-kore-ink font-medium">{subcategory}</span>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-sm mb-sm">
            <Euro size={14} className="text-kore-mid" />
            <span className="text-caption text-kore-mid uppercase tracking-widest">Schadensbetrag</span>
          </div>
          <div className="font-display text-h2 text-red-600">
            {formatEUR(Number(incident.amount))}
          </div>
        </div>

        {area && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <MapPin size={14} className="text-kore-mid" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Bereich</span>
            </div>
            <div className="text-body text-kore-ink font-medium">{area}</div>
          </div>
        )}

        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-sm mb-sm">
            <User size={14} className="text-kore-mid" />
            <span className="text-caption text-kore-mid uppercase tracking-widest">Gemeldet von</span>
          </div>
          <div className="text-body text-kore-ink font-medium">
            {isAnonymous ? 'Anonym' : incident.reporter?.name ?? '--'}
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-sm mb-sm">
            <UserPlus size={14} className="text-kore-mid" />
            <span className="text-caption text-kore-mid uppercase tracking-widest">Zugewiesen an</span>
          </div>
          <div className="text-body text-kore-ink font-medium">
            {incident.assignee?.name ?? 'Nicht zugewiesen'}
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-sm mb-sm">
            <Calendar size={14} className="text-kore-mid" />
            <span className="text-caption text-kore-mid uppercase tracking-widest">Erstellt am</span>
          </div>
          <div className="text-body text-kore-ink">
            {new Date(incident.createdAt).toLocaleDateString('de-DE')}
          </div>
        </div>

        {incident.resolvedAt && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-center gap-sm mb-sm">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="text-caption text-kore-mid uppercase tracking-widest">Geloest am</span>
            </div>
            <div className="text-body text-kore-ink">
              {new Date(incident.resolvedAt).toLocaleDateString('de-DE')}
            </div>
          </div>
        )}
      </div>

      {/* Police Info */}
      {policeInformed && (
        <div className="bg-blue-50 border border-blue-200 p-lg mb-xl">
          <div className="flex items-center gap-sm">
            <ShieldAlert size={16} className="text-blue-700" />
            <span className="text-body font-medium text-blue-700">Polizei informiert</span>
          </div>
          {policeRef && (
            <p className="text-small text-blue-600 mt-sm">Aktenzeichen: {policeRef}</p>
          )}
        </div>
      )}

      {/* Escalation Timeline */}
      {escalationMatch && escalationMatch.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-lg mb-xl">
          <span className="text-caption text-amber-700 uppercase tracking-widest font-medium">Eskalationshistorie</span>
          <div className="mt-sm space-y-xs">
            {escalationMatch.map((esc, idx) => {
              const dateMatch = esc.match(/\[ESKALIERT am ([^\]]+)\]/);
              return (
                <div key={idx} className="flex items-center gap-sm text-small text-amber-700">
                  <ArrowUpRight size={14} />
                  <span>Eskaliert am {dateMatch?.[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolution */}
      {incident.resolution && (
        <div className="bg-emerald-50 border border-emerald-200 p-xl mb-xl">
          <div className="flex items-center gap-sm mb-md">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span className="text-caption text-emerald-700 uppercase tracking-widest font-medium">Loesung</span>
          </div>
          <p className="text-body text-emerald-800 whitespace-pre-wrap">{incident.resolution}</p>
        </div>
      )}

      {/* Photo Evidence */}
      {incident.photoPath && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest mb-md block">Beweise / Anhang</span>
          <div className="flex flex-wrap gap-sm">
            {incident.photoPath.split(',').map((path: string, idx: number) => (
              <span key={idx} className="text-small text-kore-brass border border-kore-border px-md py-xs">
                {path.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {canAct && (
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest mb-lg block">Aktionen</span>

          <div className="flex flex-wrap gap-md">
            {/* Assign */}
            {(isOpen || isInvestigating) && (
              <button
                onClick={() => setShowAssign(!showAssign)}
                className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest text-kore-ink hover:bg-kore-bg transition-colors"
              >
                <UserPlus size={16} />
                Zuweisen
              </button>
            )}

            {/* Escalate */}
            {(isOpen || isInvestigating) && incident.severity !== 'CRITICAL' && (
              <button
                onClick={handleEscalate}
                disabled={escalateMutation.isPending}
                className="flex items-center gap-sm border border-amber-300 bg-amber-50 px-lg py-md-sm text-small font-medium uppercase tracking-widest text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40"
              >
                <ArrowUpRight size={16} />
                {escalateMutation.isPending ? 'Eskaliert...' : 'Eskalieren'}
              </button>
            )}

            {/* Resolve */}
            {(isOpen || isInvestigating) && (
              <button
                onClick={() => setShowResolve(!showResolve)}
                className="flex items-center gap-sm bg-emerald-600 text-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 size={16} />
                Loesen
              </button>
            )}

            {/* Close */}
            {isResolved && (
              <button
                onClick={handleClose}
                disabled={updateMutation.isPending}
                className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-40"
              >
                <XCircle size={16} />
                {updateMutation.isPending ? 'Wird geschlossen...' : 'Schliessen'}
              </button>
            )}
          </div>

          {/* Assign Form */}
          {showAssign && (
            <div className="mt-lg pt-lg border-t border-kore-border">
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Mitarbeiter zuweisen
              </label>
              <div className="flex gap-md">
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="flex-1 border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
                >
                  <option value="">Mitarbeiter waehlen...</option>
                  {(users ?? []).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!assignUserId || assignMutation.isPending}
                  className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-40"
                >
                  {assignMutation.isPending ? 'Wird zugewiesen...' : 'Zuweisen'}
                </button>
              </div>
            </div>
          )}

          {/* Resolve Form */}
          {showResolve && (
            <div className="mt-lg pt-lg border-t border-kore-border">
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">
                Loesung beschreiben
              </label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass min-h-[100px] resize-y mb-md"
                placeholder="Beschreiben Sie die Massnahmen und das Ergebnis..."
              />
              <button
                onClick={handleResolve}
                disabled={!resolution || resolveMutation.isPending}
                className="bg-emerald-600 text-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-40"
              >
                {resolveMutation.isPending ? 'Wird gespeichert...' : 'Vorfall loesen'}
              </button>
            </div>
          )}

          {/* Error display */}
          {(assignMutation.isError || escalateMutation.isError || resolveMutation.isError || updateMutation.isError) && (
            <div className="mt-md bg-red-50 border border-red-200 text-red-700 px-lg py-md text-small">
              Fehler bei der Aktion. Bitte versuchen Sie es erneut.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
