import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, User, Users, Store, Target, Zap } from 'lucide-react';
import { useCreateChallenge } from '../../../hooks/useChallenges';

const TYPE_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Einzel', desc: 'Einzelne Mitarbeiter treten gegeneinander an', Icon: User },
  { value: 'TEAM', label: 'Team', desc: 'Teams messen sich untereinander', Icon: Users },
  { value: 'STORE', label: 'Store-vs-Store', desc: 'Stores treten gegeneinander an', Icon: Store },
];

const MODE_OPTIONS = [
  { value: 'KPI', label: 'KPI-basiert', desc: 'Fortschritt wird anhand messbarer Werte erfasst' },
  { value: 'VOTING', label: 'Voting / Kreativ', desc: 'Teilnehmer stimmen ueber die besten Beitraege ab' },
];

export function CreatePage() {
  const navigate = useNavigate();
  const createChallenge = useCreateChallenge();

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'INDIVIDUAL',
    mode: 'KPI',
    metric: '',
    targetValue: '',
    startDate: '',
    endDate: '',
    recurring: 'NONE',
    reward: '',
    rewardType: '',
    anonymized: false,
  });

  const update = (field: string, value: string | boolean | number) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      mode: form.mode,
      startDate: form.startDate,
      endDate: form.endDate,
      anonymized: form.anonymized,
    };
    if (form.metric) data.metric = form.metric;
    if (form.targetValue) data.targetValue = Number(form.targetValue);
    if (form.recurring !== 'NONE') data.recurring = form.recurring;
    if (form.reward) data.reward = form.reward;
    if (form.rewardType) data.rewardType = form.rewardType;

    createChallenge.mutate(data, {
      onSuccess: (result: any) => navigate(`/tools/challenges/${result.id}`),
    });
  };

  const isValid = form.title.length >= 2 && form.startDate && form.endDate;

  return (
    <div className="p-xl max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/challenges" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Neue Challenge</h1>
          <p className="text-body text-kore-mid mt-xs">Erstellen Sie einen neuen Wettbewerb</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl">
        {/* Type Selector */}
        <div>
          <label className="text-caption text-kore-mid uppercase tracking-widest mb-md block">Typ</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('type', opt.value)}
                className={`border-2 p-lg text-left transition-colors ${form.type === opt.value ? 'border-kore-ink bg-kore-white' : 'border-kore-border bg-kore-white hover:border-kore-mid'}`}
              >
                <opt.Icon size={20} className={form.type === opt.value ? 'text-kore-ink' : 'text-kore-mid'} />
                <div className="font-medium text-kore-ink mt-sm">{opt.label}</div>
                <div className="text-caption text-kore-mid mt-xs">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="text-caption text-kore-mid uppercase tracking-widest mb-md block">Modus</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update('mode', opt.value)}
                className={`border-2 p-lg text-left transition-colors ${form.mode === opt.value ? 'border-kore-ink bg-kore-white' : 'border-kore-border bg-kore-white hover:border-kore-mid'}`}
              >
                {opt.value === 'KPI' ? <Target size={20} className={form.mode === opt.value ? 'text-kore-ink' : 'text-kore-mid'} /> : <Zap size={20} className={form.mode === opt.value ? 'text-kore-ink' : 'text-kore-mid'} />}
                <div className="font-medium text-kore-ink mt-sm">{opt.label}</div>
                <div className="text-caption text-kore-mid mt-xs">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Description */}
        <div className="bg-kore-white border border-kore-border p-lg space-y-md">
          <div>
            <label className="text-caption text-kore-mid uppercase tracking-widest mb-sm block">Titel *</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="z.B. Umsatz-Sprint Maerz 2026"
              className="w-full border border-kore-border px-md py-sm text-body"
              required
            />
          </div>
          <div>
            <label className="text-caption text-kore-mid uppercase tracking-widest mb-sm block">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Regeln, Ziel und Details der Challenge..."
              rows={4}
              className="w-full border border-kore-border px-md py-sm text-body"
            />
          </div>
        </div>

        {/* Metric & Target (KPI mode) */}
        {form.mode === 'KPI' && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <label className="text-caption text-kore-mid uppercase tracking-widest mb-md block">KPI / Metrik</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <div>
                <label className="text-small text-kore-mid mb-xs block">Metrik-Name</label>
                <input
                  value={form.metric}
                  onChange={(e) => update('metric', e.target.value)}
                  placeholder="z.B. Umsatz, Conversion, Stueckzahl"
                  className="w-full border border-kore-border px-md py-sm text-small"
                />
              </div>
              <div>
                <label className="text-small text-kore-mid mb-xs block">Zielwert</label>
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={(e) => update('targetValue', e.target.value)}
                  placeholder="z.B. 10000"
                  className="w-full border border-kore-border px-md py-sm text-small"
                />
              </div>
            </div>
          </div>
        )}

        {/* Time */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="text-caption text-kore-mid uppercase tracking-widest mb-md block">Zeitraum</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="text-small text-kore-mid mb-xs block">Startdatum *</label>
              <input type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="w-full border border-kore-border px-md py-sm text-small" required />
            </div>
            <div>
              <label className="text-small text-kore-mid mb-xs block">Enddatum *</label>
              <input type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className="w-full border border-kore-border px-md py-sm text-small" required />
            </div>
            <div>
              <label className="text-small text-kore-mid mb-xs block">Wiederholung</label>
              <select value={form.recurring} onChange={(e) => update('recurring', e.target.value)} className="w-full border border-kore-border px-md py-sm text-small bg-kore-white">
                <option value="NONE">Keine</option>
                <option value="WEEKLY">Woechentlich</option>
                <option value="MONTHLY">Monatlich</option>
                <option value="QUARTERLY">Quartalsweise</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="text-caption text-kore-mid uppercase tracking-widest mb-md block">Belohnung (optional)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="text-small text-kore-mid mb-xs block">Belohnung</label>
              <input
                value={form.reward}
                onChange={(e) => update('reward', e.target.value)}
                placeholder="z.B. Gutschein, Sondertag, Pokal"
                className="w-full border border-kore-border px-md py-sm text-small"
              />
            </div>
            <div>
              <label className="text-small text-kore-mid mb-xs block">Art</label>
              <select value={form.rewardType} onChange={(e) => update('rewardType', e.target.value)} className="w-full border border-kore-border px-md py-sm text-small bg-kore-white">
                <option value="">Keine Angabe</option>
                <option value="HONOUR">Ehre</option>
                <option value="PRIZE">Preis</option>
                <option value="POINTS">Punkte</option>
                <option value="BADGE">Badge</option>
              </select>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="text-caption text-kore-mid uppercase tracking-widest mb-md block">Einstellungen</label>
          <label className="flex items-center gap-md cursor-pointer">
            <input
              type="checkbox"
              checked={form.anonymized}
              onChange={(e) => update('anonymized', e.target.checked)}
              className="w-4 h-4 accent-kore-ink"
            />
            <div>
              <div className="text-small text-kore-ink font-medium">Anonymisiertes Leaderboard</div>
              <div className="text-caption text-kore-mid">Teilnehmernamen werden im Leaderboard nicht angezeigt</div>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-md">
          <button
            type="submit"
            disabled={!isValid || createChallenge.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Trophy size={16} /> Challenge erstellen
          </button>
          <Link to="/tools/challenges" className="px-xl py-md-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">Abbrechen</Link>
        </div>

        {createChallenge.isError && (
          <div className="text-small text-red-600">Fehler: {(createChallenge.error as Error).message}</div>
        )}
      </form>
    </div>
  );
}
