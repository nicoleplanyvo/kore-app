import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRightLeft,
  Save,
  Send,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  useHandoverStores,
  useHandoverUsers,
  useCreateHandover,
  useSubmitHandover,
} from '../../../hooks/useHandover';

const SHIFT_TYPES = [
  { value: 'FRUEH_SPAET', label: 'Frueh \u2192 Spaet' },
  { value: 'SPAET_NACHT', label: 'Spaet \u2192 Nacht' },
  { value: 'NACHT_FRUEH', label: 'Nacht \u2192 Frueh' },
];

interface SectionField {
  key: string;
  label: string;
  placeholder: string;
  priorityKey: string;
}

const SECTIONS: SectionField[] = [
  {
    key: 'salesUpdate',
    label: 'Umsatz-Update',
    placeholder: 'Umsatzzahlen, Zielerreichung, besondere Verkaeufe...',
    priorityKey: 'salesPriority',
  },
  {
    key: 'openTasks',
    label: 'Offene Aufgaben',
    placeholder: 'Noch zu erledigende Aufgaben fuer die naechste Schicht...',
    priorityKey: 'tasksPriority',
  },
  {
    key: 'incidents',
    label: 'Vorfaelle',
    placeholder: 'Besondere Vorkommnisse, Reklamationen, Probleme...',
    priorityKey: 'incidentsPriority',
  },
  {
    key: 'customerNotes',
    label: 'Kunden-Hinweise',
    placeholder: 'Kundenanfragen, VIP-Besuche, Rueckgaben...',
    priorityKey: 'customerPriority',
  },
  {
    key: 'stockNotes',
    label: 'Warenbestand',
    placeholder: 'Lieferungen, Fehlbestaende, Retouren...',
    priorityKey: 'stockPriority',
  },
  {
    key: 'generalNotes',
    label: 'Allgemein',
    placeholder: 'Sonstige Hinweise fuer die naechste Schicht...',
    priorityKey: 'generalPriority',
  },
];

export function CreatePage() {
  const navigate = useNavigate();
  const { data: stores } = useHandoverStores();
  const createHandover = useCreateHandover();
  const submitHandover = useSubmitHandover();

  const [storeId, setStoreId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('FRUEH_SPAET');
  const [toUserId, setToUserId] = useState('');
  const [sections, setSections] = useState<Record<string, string>>({
    salesUpdate: '',
    openTasks: '',
    incidents: '',
    customerNotes: '',
    stockNotes: '',
    generalNotes: '',
  });
  const [priorities, setPriorities] = useState<Record<string, boolean>>({
    salesPriority: false,
    tasksPriority: false,
    incidentsPriority: false,
    customerPriority: false,
    stockPriority: false,
    generalPriority: false,
  });
  const [error, setError] = useState('');

  // Auto-select first store
  const effectiveStoreId = storeId || (stores && stores.length === 1 ? stores[0].id : '');
  const { data: users } = useHandoverUsers(effectiveStoreId || undefined);

  const handleSectionChange = (key: string, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }));
  };

  const handlePriorityToggle = (key: string) => {
    setPriorities((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const buildPayload = () => {
    // Encode priorities into the text fields with a marker
    const data: Record<string, string | undefined> = {};
    for (const section of SECTIONS) {
      let value = sections[section.key]?.trim() || '';
      if (value && priorities[section.priorityKey]) {
        value = `[PRIORITAET] ${value}`;
      }
      if (value) data[section.key] = value;
    }
    return {
      storeId: effectiveStoreId,
      shiftDate,
      shiftType,
      toUserId: toUserId || undefined,
      ...data,
    };
  };

  const handleSaveDraft = async () => {
    setError('');
    if (!effectiveStoreId) {
      setError('Bitte waehlen Sie einen Store aus.');
      return;
    }
    try {
      const result = await createHandover.mutateAsync(buildPayload());
      navigate(`/tools/handover/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!effectiveStoreId) {
      setError('Bitte waehlen Sie einen Store aus.');
      return;
    }
    try {
      const result = await createHandover.mutateAsync(buildPayload());
      await submitHandover.mutateAsync(result.id);
      navigate(`/tools/handover/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einreichen.');
    }
  };

  const isPending = createHandover.isPending || submitHandover.isPending;

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/handover" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ArrowRightLeft size={24} /> Neue Uebergabe
          </h1>
          <p className="text-body text-kore-mid mt-xs">Schichtuebergabe erstellen und einreichen.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-md py-sm text-small mb-lg flex items-center gap-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Meta fields */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Store selector */}
          <div>
            <label className="flex items-center gap-xs text-small text-kore-mid mb-xs">
              <Store size={14} /> Store
            </label>
            {stores && stores.length > 1 ? (
              <select
                value={effectiveStoreId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  setToUserId('');
                }}
                className="w-full border border-kore-border px-md py-sm text-body bg-kore-white"
                required
              >
                <option value="">Store waehlen...</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.city ? ` (${s.city})` : ''}
                  </option>
                ))}
              </select>
            ) : stores && stores.length === 1 ? (
              <div className="border border-kore-border px-md py-sm text-body bg-kore-bg text-kore-ink">
                {stores[0].name}
                {stores[0].city ? ` (${stores[0].city})` : ''}
              </div>
            ) : (
              <div className="border border-kore-border px-md py-sm text-body bg-kore-bg text-kore-mid">
                Lade Stores...
              </div>
            )}
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-small text-kore-mid mb-xs">Datum</label>
            <input
              type="date"
              value={shiftDate}
              onChange={(e) => setShiftDate(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body"
              required
            />
          </div>

          {/* Shift type */}
          <div>
            <label className="block text-small text-kore-mid mb-xs">Schichttyp</label>
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white"
            >
              {SHIFT_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient */}
          <div>
            <label className="block text-small text-kore-mid mb-xs">Empfaenger</label>
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white"
              disabled={!effectiveStoreId}
            >
              <option value="">Empfaenger waehlen (optional)</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section fields */}
      <div className="space-y-md mb-xl">
        {SECTIONS.map((section) => (
          <div
            key={section.key}
            className={`bg-kore-white border p-lg transition-colors ${
              priorities[section.priorityKey]
                ? 'border-amber-400 bg-amber-50/30'
                : 'border-kore-border'
            }`}
          >
            <div className="flex items-center justify-between mb-sm">
              <label className="font-display text-body font-medium text-kore-ink">
                {section.label}
              </label>
              <label className="flex items-center gap-xs text-small text-kore-mid cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={priorities[section.priorityKey]}
                  onChange={() => handlePriorityToggle(section.priorityKey)}
                  className="accent-amber-500"
                />
                <AlertTriangle
                  size={14}
                  className={priorities[section.priorityKey] ? 'text-amber-500' : 'text-kore-mid'}
                />
                Prioritaet
              </label>
            </div>
            <textarea
              value={sections[section.key]}
              onChange={(e) => handleSectionChange(section.key, e.target.value)}
              placeholder={section.placeholder}
              rows={3}
              className="w-full border border-kore-border px-md py-sm text-body resize-y placeholder:text-kore-mid/50"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-kore-border pt-lg">
        <Link
          to="/tools/handover"
          className="text-small text-kore-mid hover:text-kore-ink transition-colors"
        >
          Abbrechen
        </Link>
        <div className="flex items-center gap-sm">
          <button
            onClick={handleSaveDraft}
            disabled={isPending}
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg disabled:opacity-50 transition-colors"
          >
            <Save size={16} /> Als Entwurf speichern
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} /> Einreichen
          </button>
        </div>
      </div>
    </div>
  );
}
