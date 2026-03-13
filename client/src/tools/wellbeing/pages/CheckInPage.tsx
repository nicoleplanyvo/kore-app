import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Send } from 'lucide-react';
import { useCreateWellbeingCheckIn } from '../../../hooks/useWellbeing';

const MOOD_EMOJI = ['', '😞', '😐', '🙂', '😊', '🤩'];
const MOOD_LABELS = ['', 'Schlecht', 'Mäßig', 'Ok', 'Gut', 'Sehr gut'];

function RatingSelector({ label, value, onChange, inverted }: { label: string; value: number; onChange: (v: number) => void; inverted?: boolean }) {
  return (
    <div className="bg-kore-white border border-kore-border p-lg">
      <label className="block font-medium text-kore-ink mb-md">{label}</label>
      <div className="flex gap-sm">
        {[1,2,3,4,5].map(v => (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`flex-1 py-md border text-center transition-colors ${value === v
              ? (inverted ? (v > 3 ? 'bg-red-500 text-white border-red-500' : v > 2 ? 'bg-amber-500 text-white border-amber-500' : 'bg-emerald-500 text-white border-emerald-500')
                : (v >= 4 ? 'bg-emerald-500 text-white border-emerald-500' : v >= 3 ? 'bg-amber-500 text-white border-amber-500' : 'bg-red-500 text-white border-red-500'))
              : 'border-kore-border text-kore-mid hover:border-kore-ink'}`}>
            <div className="font-medium">{v}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckInPage() {
  const navigate = useNavigate();
  const create = useCreateWellbeingCheckIn();
  const [form, setForm] = useState({ moodScore: 0, energyLevel: 0, stressLevel: 0, workloadRating: 0, notes: '', isAnonymous: false });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.moodScore) return;
    create.mutate(form, { onSuccess: () => navigate('/tools/wellbeing') });
  };

  return (
    <div className="p-xl max-w-3xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/wellbeing" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Heart size={24} /> Check-In</h1>
          <p className="text-body text-kore-mid mt-xs">Wie geht es dir heute?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-md">
        {/* Mood */}
        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="block font-medium text-kore-ink mb-md">Stimmung</label>
          <div className="flex gap-md justify-center">
            {[1,2,3,4,5].map(v => (
              <button key={v} type="button" onClick={() => setForm({ ...form, moodScore: v })}
                className={`flex flex-col items-center gap-xs p-md border transition-colors ${form.moodScore === v ? 'border-kore-ink bg-kore-bg' : 'border-kore-border hover:border-kore-ink'}`}>
                <span className="text-2xl">{MOOD_EMOJI[v]}</span>
                <span className="text-small text-kore-mid">{MOOD_LABELS[v]}</span>
              </button>
            ))}
          </div>
        </div>

        <RatingSelector label="Energielevel" value={form.energyLevel} onChange={v => setForm({ ...form, energyLevel: v })} />
        <RatingSelector label="Stresslevel" value={form.stressLevel} onChange={v => setForm({ ...form, stressLevel: v })} inverted />
        <RatingSelector label="Workload-Bewertung" value={form.workloadRating} onChange={v => setForm({ ...form, workloadRating: v })} />

        <div className="bg-kore-white border border-kore-border p-lg">
          <label className="block font-medium text-kore-ink mb-md">Anmerkungen (optional)</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full border border-kore-border px-md py-sm text-body" placeholder="Gibt es etwas, das du mitteilen möchtest?" />
        </div>

        <label className="flex items-center gap-sm text-body text-kore-ink bg-kore-white border border-kore-border p-md">
          <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm({ ...form, isAnonymous: e.target.checked })} />
          Anonym abgeben
        </label>

        <button type="submit" disabled={create.isPending || !form.moodScore} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
          <Send size={16} /> {create.isPending ? 'Wird gespeichert...' : 'Check-In absenden'}
        </button>
      </form>
    </div>
  );
}
