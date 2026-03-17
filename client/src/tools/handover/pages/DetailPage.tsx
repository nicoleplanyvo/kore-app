import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Send,
  Edit3,
  Clock,
  FileText,
  AlertTriangle,
  ChevronRight,
  Save,
  Store,
} from 'lucide-react';
import { useState } from 'react';
import {
  useHandover,
  useAcknowledgeHandover,
  useSubmitHandover,
  useUpdateHandover,
  useHandoverUsers,
} from '../../../hooks/useHandover';
import { useAuthStore } from '../../../stores/authStore';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  SUBMITTED: 'Eingereicht',
  ACKNOWLEDGED: 'Bestaetigt',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid border-kore-border',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  ACKNOWLEDGED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const SHIFT_LABELS: Record<string, string> = {
  'FRUEH_SPAET': 'Frueh \u2192 Spaet',
  'SPAET_NACHT': 'Spaet \u2192 Nacht',
  'NACHT_FRUEH': 'Nacht \u2192 Frueh',
};

const SECTIONS = [
  { key: 'salesUpdate', label: 'Umsatz-Update', icon: FileText },
  { key: 'openTasks', label: 'Offene Aufgaben', icon: FileText },
  { key: 'incidents', label: 'Vorfaelle', icon: AlertTriangle },
  { key: 'customerNotes', label: 'Kunden-Hinweise', icon: FileText },
  { key: 'stockNotes', label: 'Warenbestand', icon: FileText },
  { key: 'generalNotes', label: 'Allgemein', icon: FileText },
];

export function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: handover, isLoading } = useHandover(id);
  const acknowledge = useAcknowledgeHandover();
  const submit = useSubmitHandover();
  const update = useUpdateHandover();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [editToUserId, setEditToUserId] = useState('');

  const { data: storeUsers } = useHandoverUsers(
    isEditing && handover ? handover.storeId : undefined
  );

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!handover) return <div className="p-xl text-body text-kore-mid">Uebergabe nicht gefunden.</div>;

  const isCreator = user?.id === handover.fromUserId;
  const isRecipient = user?.id === handover.toUserId;
  const canEdit = handover.status === 'DRAFT' && isCreator;
  const canSubmit = handover.status === 'DRAFT' && isCreator;
  const canAcknowledge = handover.status === 'SUBMITTED' && isRecipient;

  const startEdit = () => {
    setEditData({
      salesUpdate: handover.salesUpdate || '',
      openTasks: handover.openTasks || '',
      incidents: handover.incidents || '',
      customerNotes: handover.customerNotes || '',
      stockNotes: handover.stockNotes || '',
      generalNotes: handover.generalNotes || '',
    });
    setEditToUserId(handover.toUserId || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const payload: Record<string, string | undefined> = {};
    for (const section of SECTIONS) {
      const val = editData[section.key]?.trim();
      payload[section.key] = val || undefined;
    }
    payload['toUserId'] = editToUserId || undefined;
    await update.mutateAsync({ id: handover.id, ...payload });
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    await submit.mutateAsync(handover.id);
  };

  const handleAcknowledge = async () => {
    await acknowledge.mutateAsync(handover.id);
  };

  const isPriority = (value: string | null) => {
    return value?.startsWith('[PRIORITAET]') ?? false;
  };

  const cleanValue = (value: string | null) => {
    if (!value) return '';
    return value.replace(/^\[PRIORITAET\]\s*/, '');
  };

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/handover" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ArrowRightLeft size={24} /> Schichtuebergabe
          </h1>
          <div className="flex items-center gap-sm mt-xs flex-wrap">
            <span className="text-body text-kore-ink">
              {new Date(handover.shiftDate).toLocaleDateString('de-DE', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {handover.shiftType && (
              <span className="text-small text-kore-brass">
                {SHIFT_LABELS[handover.shiftType] ?? handover.shiftType}
              </span>
            )}
            <span
              className={`px-sm py-xs text-small border ${
                STATUS_COLORS[handover.status] ?? 'bg-kore-bg text-kore-mid border-kore-border'
              }`}
            >
              {STATUS_LABELS[handover.status] ?? handover.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-sm">
          {canEdit && !isEditing && (
            <button
              onClick={startEdit}
              className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
            >
              <Edit3 size={16} /> Bearbeiten
            </button>
          )}
          {canSubmit && !isEditing && (
            <button
              onClick={handleSubmit}
              disabled={submit.isPending}
              className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <Send size={16} /> Einreichen
            </button>
          )}
          {canAcknowledge && (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledge.isPending}
              className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <Check size={16} /> Bestaetigen
            </button>
          )}
        </div>
      </div>

      {/* Meta card */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Von</span>
            <p className="text-body text-kore-ink font-medium">
              {handover.fromUser?.name ?? 'Unbekannt'}
            </p>
          </div>
          <div>
            <span className="text-small text-kore-mid">An</span>
            {isEditing ? (
              <select
                value={editToUserId}
                onChange={(e) => setEditToUserId(e.target.value)}
                className="w-full border border-kore-border px-sm py-xs text-body bg-kore-white mt-xs"
              >
                <option value="">Nicht zugewiesen</option>
                {storeUsers?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-body text-kore-ink font-medium">
                {handover.toUser?.name ?? 'Nicht zugewiesen'}
              </p>
            )}
          </div>
          <div>
            <span className="flex items-center gap-xs text-small text-kore-mid">
              <Store size={12} /> Store
            </span>
            <p className="text-body text-kore-ink">{handover.store?.name ?? '---'}</p>
          </div>
          <div>
            <span className="flex items-center gap-xs text-small text-kore-mid">
              <Clock size={12} /> Zeitstempel
            </span>
            <p className="text-small text-kore-ink">
              Erstellt:{' '}
              {new Date(handover.createdAt).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            {handover.status !== 'DRAFT' && (
              <p className="text-small text-kore-ink">
                Aktualisiert:{' '}
                {new Date(handover.updatedAt).toLocaleString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sections */}
      {isEditing ? (
        <>
          <div className="space-y-md mb-lg">
            {SECTIONS.map((section) => (
              <div key={section.key} className="bg-kore-white border border-kore-border p-lg">
                <label className="font-display text-body font-medium text-kore-ink mb-sm block">
                  {section.label}
                </label>
                <textarea
                  value={editData[section.key] || ''}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, [section.key]: e.target.value }))
                  }
                  rows={3}
                  className="w-full border border-kore-border px-md py-sm text-body resize-y"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-kore-border pt-lg">
            <button
              onClick={() => setIsEditing(false)}
              className="text-small text-kore-mid hover:text-kore-ink transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={update.isPending}
              className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <Save size={16} /> Speichern
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-md">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const value = (handover as any)[key];
            if (!value) return null;
            const hasPriority = isPriority(value);
            const displayValue = cleanValue(value);

            return (
              <div
                key={key}
                className={`bg-kore-white border p-lg ${
                  hasPriority ? 'border-amber-400 border-l-4' : 'border-kore-border'
                }`}
              >
                <div className="flex items-center gap-sm mb-sm">
                  <Icon size={16} className={hasPriority ? 'text-amber-500' : 'text-kore-mid'} />
                  <h3 className="font-display text-body font-medium text-kore-ink">{label}</h3>
                  {hasPriority && (
                    <span className="flex items-center gap-xs text-small text-amber-600 bg-amber-50 px-sm py-xs">
                      <AlertTriangle size={12} /> Prioritaet
                    </span>
                  )}
                </div>
                <p className="text-body text-kore-mid whitespace-pre-wrap pl-md">{displayValue}</p>
              </div>
            );
          })}

          {SECTIONS.every(({ key }) => !(handover as any)[key]) && (
            <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">
              Keine Notizen in dieser Uebergabe.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
