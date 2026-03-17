import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Send } from 'lucide-react';
import { useCreateWellbeingCheckIn, useWellbeingStores } from '../../../hooks/useWellbeing';

const MOOD_LABELS = ['', 'Schlecht', 'Maessig', 'Ok', 'Gut', 'Sehr gut'];

function RatingSelector({
  label,
  value,
  onChange,
  inverted,
  labels,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  inverted?: boolean;
  labels?: string[];
}) {
  return (
    <div className="bg-kore-white border border-kore-border p-lg">
      <label className="block font-medium text-kore-ink mb-md">{label}</label>
      <div className="flex gap-sm">
        {[1, 2, 3, 4, 5].map((v) => {
          const isSelected = value === v;
          let selectedColor = '';
          if (isSelected) {
            if (inverted) {
              selectedColor = v > 3 ? 'bg-red-500 text-white border-red-500' : v > 2 ? 'bg-amber-500 text-white border-amber-500' : 'bg-emerald-500 text-white border-emerald-500';
            } else {
              selectedColor = v >= 4 ? 'bg-emerald-500 text-white border-emerald-500' : v >= 3 ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-500 text-white border-red-500';
            }
          }
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(v)}
              className={`flex-1 py-md border text-center transition-colors ${
                isSelected ? selectedColor : 'border-kore-border text-kore-mid hover:border-kore-ink'
              }`}
            >
              <div className="font-medium text-lg">{v}</div>
              {labels && labels[v] && (
                <div className="text-small mt-xs">{labels[v]}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CheckInPage() {
  const navigate = useNavigate();
  const { data: stores } = useWellbeingStores();
  const create = useCreateWellbeingCheckIn();
  const [form, setForm] = useState({
    storeId: '',
    moodScore: 0,
    energyLevel: 0,
    stressLevel: 0,
    workloadRating: 0,
    notes: '',
    isAnonymous: false,
  });

  const storeId = form.storeId || stores?.[0]?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.moodScore || !form.energyLevel || !form.stressLevel || !form.workloadRating) return;
    create.mutate(
      {
        storeId: storeId || undefined,
        moodScore: form.moodScore,
        energyLevel: form.energyLevel,
        stressLevel: form.stressLevel,
        workloadRating: form.workloadRating,
        notes: form.notes || undefined,
        isAnonymous: form.isAnonymous,
      },
      { onSuccess: () => navigate('/tools/wellbeing') },
    );
  };

  const isComplete = form.moodScore > 0 && form.energyLevel > 0 && form.stressLevel > 0 && form.workloadRating > 0;

  return (
    <div className="p-xl max-w-3xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/wellbeing" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Heart size={24} /> Check-In
          </h1>
          <p className="text-body text-kore-mid mt-xs">Wie geht es dir heute?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-md">
        {/* Store selector */}
        {stores && stores.length > 1 && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <label className="block font-medium text-kore-ink mb-md">Store</label>
            <select
              value={storeId}
              onChange={(e) => setForm({ ...form, storeId: e.target.value })}
              className="w-full border border-kore-border px-md py-sm text-body"
            >
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.city ? ` (${s.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Mood */}
        <RatingSelector
          label="Stimmung"
          value={form.moodScore}
          onChange={(v) => setForm({ ...form, moodScore: v })}
          labels={MOOD_LABELS}
        />

        {/* Energy */}
        <RatingSelector
          label="Energielevel"
          value={form.energyLevel}
          onChange={(v) => setForm({ ...form, energyLevel: v })}
        />

        {/* Stress */}
        <RatingSelector
          label="Stresslevel"
          value={form.stressLevel}
          onChange={(v) => setForm({ ...form, stressLevel: v })}
          inverted
        />

        {/* Workload */}
        <RatingSelector
          label="Workload-Bewertung"
          value={form.workloadRating}
          onChange={(v) => setForm({ ...form, workloadRating: v })}
        />

        {/* Notes */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="block font-medium text-kore-ink mb-md">Anmerkungen (optional)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full border border-kore-border px-md py-sm text-body"
            placeholder="Gibt es etwas, das du mitteilen moechtest?"
          />
        </div>

        {/* Anonymous */}
        <label className="flex items-center gap-sm text-body text-kore-ink bg-kore-white border border-kore-border p-md cursor-pointer">
          <input
            type="checkbox"
            checked={form.isAnonymous}
            onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
          />
          Anonym abgeben
        </label>
        {form.isAnonymous && (
          <p className="text-small text-kore-mid ml-md">
            Dein Name wird nicht gespeichert. Bei kritischen Werten wird das Management informiert, jedoch ohne persoenliche Zuordnung.
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={create.isPending || !isComplete}
          className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} /> {create.isPending ? 'Wird gespeichert...' : 'Check-In absenden'}
        </button>
        {create.isError && (
          <p className="text-small text-red-600 mt-sm">{(create.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
