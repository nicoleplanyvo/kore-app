import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useLossStores, useLossAreas, useCreateIncident } from '../../../hooks/useLossPrevention';

/* ── Constants ──────────────────────────────────────────────── */

const CATEGORIES = [
  { value: 'THEFT', label: 'Diebstahl extern' },
  { value: 'ADMIN_ERROR', label: 'Kassenfehlbuchung' },
  { value: 'DAMAGE', label: 'Beschaedigung' },
  { value: 'SUPPLIER', label: 'WE-Differenz' },
  { value: 'OTHER', label: 'Sonstige' },
];

const SUBCATEGORIES: Record<string, string[]> = {
  THEFT: ['Ladendiebstahl', 'Bandendiebstahl', 'Taschendiebstahl'],
  ADMIN_ERROR: ['Kassenfehlbuchung', 'Retoure-Betrug', 'Preismanipulation'],
  DAMAGE: ['Transportschaden', 'Kundenbeschaedigung', 'Lagerschaden'],
  SUPPLIER: ['WE-Differenz', 'Falschlieferung', 'Mengenabweichung'],
  OTHER: ['Organisationsversagen', 'Schwund unbekannt', 'Sonstiges'],
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'text-emerald-600',
  MEDIUM: 'text-amber-600',
  HIGH: 'text-red-600',
  CRITICAL: 'text-red-800 font-bold',
};

function calcSeverity(amount: number): string {
  if (amount >= 2000) return 'CRITICAL';
  if (amount >= 500) return 'HIGH';
  if (amount >= 100) return 'MEDIUM';
  return 'LOW';
}

/* ── Component ──────────────────────────────────────────────── */

export function ReportPage() {
  const navigate = useNavigate();
  const { data: stores } = useLossStores();
  const { data: areas } = useLossAreas();
  const createMutation = useCreateIncident();

  const [storeId, setStoreId] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  const [incidentTime, setIncidentTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [area, setArea] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [policeInformed, setPoliceInformed] = useState(false);
  const [policeRef, setPoliceRef] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [photoPath, setPhotoPath] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const autoSeverity = useMemo(() => calcSeverity(amountNum), [amountNum]);

  const canSubmit = storeId && category && incidentDate && description.length >= 5;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    // Build description with area and metadata
    let fullDescription = '';
    if (area) fullDescription += `[Bereich: ${area}] `;
    fullDescription += description;
    if (subcategory) fullDescription += `\n[Unterkategorie: ${subcategory}]`;
    if (policeInformed) {
      fullDescription += `\n[Polizei informiert]`;
      if (policeRef) fullDescription += ` Aktenzeichen: ${policeRef}`;
    }

    const dateStr = incidentDate; // YYYY-MM-DD format

    try {
      await createMutation.mutateAsync({
        storeId,
        category,
        incidentDate: dateStr,
        amount: amountNum,
        description: fullDescription,
        anonymous,
        photoPath: photoPath || undefined,
      });
      navigate('/tools/loss-prevention');
    } catch {
      // Error handled by mutation state
    }
  }

  const inputClass = 'w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass transition-colors';
  const labelClass = 'block text-caption text-kore-mid uppercase tracking-widest mb-xs';

  return (
    <div className="p-xl max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/loss-prevention"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Vorfall melden</h1>
          <p className="text-body text-kore-mid mt-xs">Neuen Schwundvorfall erfassen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl">
        {/* Store */}
        <div>
          <label className={labelClass}>Store *</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Store waehlen...</option>
            {(stores ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.city ? `(${s.city})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Category + Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className={labelClass}>Kategorie *</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory('');
              }}
              className={inputClass}
              required
            >
              <option value="">Kategorie waehlen...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Unterkategorie</label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className={inputClass}
              disabled={!category}
            >
              <option value="">Optional...</option>
              {(SUBCATEGORIES[category] ?? []).map((sub) => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div>
            <label className={labelClass}>Datum *</label>
            <input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Uhrzeit</label>
            <input
              type="time"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Store Area */}
        <div>
          <label className={labelClass}>Bereich im Store</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className={inputClass}
          >
            <option value="">Bereich waehlen...</option>
            {(areas ?? []).map((a: string) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Amount with auto priority */}
        <div>
          <label className={labelClass}>Schadensbetrag (EUR)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          {amountNum > 0 && (
            <div className="mt-xs flex items-center gap-sm">
              <AlertTriangle size={14} className={SEVERITY_COLORS[autoSeverity]} />
              <span className={`text-small ${SEVERITY_COLORS[autoSeverity]}`}>
                Automatische Prioritaet: {SEVERITY_LABELS[autoSeverity]}
                {amountNum >= 2000 && ' (Sofort-Eskalation)'}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Beschreibung *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${inputClass} min-h-[120px] resize-y`}
            placeholder="Was ist passiert? Bitte so detailliert wie moeglich beschreiben..."
            required
            minLength={5}
          />
          <span className="text-small text-kore-mid mt-xs block">
            {description.length} / min. 5 Zeichen
          </span>
        </div>

        {/* Police Section */}
        <div className="bg-kore-white border border-kore-border p-lg space-y-md">
          <div className="flex items-center gap-md">
            <input
              type="checkbox"
              id="policeInformed"
              checked={policeInformed}
              onChange={(e) => setPoliceInformed(e.target.checked)}
              className="w-4 h-4 accent-kore-brass"
            />
            <label htmlFor="policeInformed" className="text-body text-kore-ink cursor-pointer">
              Polizei informiert
            </label>
          </div>
          {policeInformed && (
            <div>
              <label className={labelClass}>Aktenzeichen</label>
              <input
                type="text"
                value={policeRef}
                onChange={(e) => setPoliceRef(e.target.value)}
                className={inputClass}
                placeholder="z.B. 2026-LP-12345"
              />
            </div>
          )}
        </div>

        {/* Photo Upload Placeholder */}
        <div>
          <label className={labelClass}>Beweise / Fotos</label>
          <input
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx"
            multiple
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                const paths = Array.from(files).map((f) => f.name).join(',');
                setPhotoPath(paths);
              }
            }}
            className="block w-full text-small text-kore-mid file:mr-md file:py-sm file:px-lg file:border file:border-kore-border file:text-small file:font-medium file:bg-kore-white file:text-kore-ink hover:file:bg-kore-bg file:cursor-pointer file:transition-colors"
          />
          <span className="text-small text-kore-mid mt-xs block">
            Fotos, Videos oder Dokumente (optional)
          </span>
        </div>

        {/* Anonymous Toggle */}
        <div className="flex items-center gap-md bg-kore-white border border-kore-border p-lg">
          <input
            type="checkbox"
            id="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 accent-kore-brass"
          />
          <label htmlFor="anonymous" className="text-body text-kore-ink cursor-pointer">
            Anonym melden
          </label>
          <span className="text-small text-kore-mid ml-auto">
            Ihr Name wird nicht gespeichert
          </span>
        </div>

        {/* Error */}
        {createMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-lg py-md text-small">
            Fehler: {(createMutation.error as Error)?.message || 'Vorfall konnte nicht gespeichert werden.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-md pt-md">
          <button
            type="submit"
            disabled={!canSubmit || createMutation.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShieldAlert size={16} />
            {createMutation.isPending ? 'Wird gespeichert...' : 'Vorfall melden'}
          </button>
          <Link
            to="/tools/loss-prevention"
            className="px-xl py-md-sm text-small font-medium uppercase tracking-widest text-kore-mid hover:text-kore-ink transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
