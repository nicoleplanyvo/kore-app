import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Send } from 'lucide-react';
import { useVmComplianceStores } from '../../../hooks/useVmCompliance';
import { useCreateSpotCheck } from '../../../hooks/useSpotChecks';
/* eslint-disable @typescript-eslint/no-explicit-any */

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SpotCheckCreatePage() {
  const navigate = useNavigate();
  const { data: stores } = useVmComplianceStores();
  const createMutation = useCreateSpotCheck();

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('');
  const [deadline, setDeadline] = useState('');
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allStores = stores ?? [];
  const allSelected = allStores.length > 0 && storeIds.length === allStores.length;

  const setQuickDeadline = (minutes: number) => setDeadline(toLocalInput(new Date(Date.now() + minutes * 60_000)));

  const toggleStore = (id: string) =>
    setStoreIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !deadline || storeIds.length === 0) return;

    const fd = new FormData();
    fd.append('title', title);
    if (instructions) fd.append('instructions', instructions);
    if (category) fd.append('category', category);
    fd.append('deadline', new Date(deadline).toISOString());
    fd.append('storeIds', JSON.stringify(storeIds));
    if (file) fd.append('referencePhoto', file);

    createMutation.mutate(fd, {
      onSuccess: (created: any) => navigate(`/app/tools/vm-compliance/spot-checks/${created.id}`),
      onError: (err: Error) => setError(err.message),
    });
  };

  return (
    <div className="p-xl max-w-3xl">
      <Link to="/app/tools/vm-compliance/spot-checks" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Spot-Checks
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">Neue Foto-Anfrage</h1>
      <p className="text-body text-kore-mid mb-2xl">Die Stores werden benachrichtigt und reichen bis zur Deadline ein Foto ein.</p>

      <form onSubmit={handleSubmit} className="space-y-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Anfrage</h2>
          <div className="space-y-lg">
            <div>
              <label className="text-small text-kore-mid block mb-sm">Titel *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='z. B. "Foto Haupttisch Erdgeschoss"' className="w-full border border-kore-border px-md py-sm text-small bg-kore-white" required />
            </div>
            <div>
              <label className="text-small text-kore-mid block mb-sm">Anweisung</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Was genau soll fotografiert werden? Bitte keine Personen im Bild." className="w-full border border-kore-border px-md py-sm text-small resize-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="text-small text-kore-mid block mb-sm">Bereich</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="z. B. Schaufenster, Eingang, Kasse" className="w-full border border-kore-border px-md py-sm text-small bg-kore-white" />
              </div>
              <div>
                <label className="text-small text-kore-mid block mb-sm">Deadline *</label>
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small bg-kore-white" required />
                <div className="flex gap-sm mt-sm">
                  <button type="button" onClick={() => setQuickDeadline(60)} className="border border-kore-border px-md py-xs text-caption uppercase tracking-widest text-kore-mid hover:border-kore-brass">+1 Std.</button>
                  <button type="button" onClick={() => setQuickDeadline(240)} className="border border-kore-border px-md py-xs text-caption uppercase tracking-widest text-kore-mid hover:border-kore-brass">+4 Std.</button>
                  <button type="button" onClick={() => { const d = new Date(); d.setHours(18, 0, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1); setDeadline(toLocalInput(d)); }} className="border border-kore-border px-md py-xs text-caption uppercase tracking-widest text-kore-mid hover:border-kore-brass">18:00</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-xl">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-display text-h3 text-kore-ink">Stores *</h2>
            <button
              type="button"
              onClick={() => setStoreIds(allSelected ? [] : allStores.map((s: any) => s.id))}
              className="text-small text-kore-brass hover:text-kore-ink"
            >
              {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
            {allStores.map((s: any) => (
              <label key={s.id} className={`flex items-center gap-md border px-md py-sm cursor-pointer transition-colors ${storeIds.includes(s.id) ? 'border-kore-brass bg-kore-bg' : 'border-kore-border'}`}>
                <input type="checkbox" checked={storeIds.includes(s.id)} onChange={() => toggleStore(s.id)} className="accent-kore-brass" />
                <span className="text-small text-kore-ink">{s.name}{s.city ? ` (${s.city})` : ''}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Referenzfoto (optional)</h2>
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Referenz" className="w-full max-h-72 object-contain border border-kore-border" />
              <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute top-sm right-sm bg-kore-ink text-kore-white px-md py-xs text-caption uppercase tracking-widest">Entfernen</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-kore-border p-2xl cursor-pointer hover:border-kore-brass transition-colors">
              <Camera size={32} className="text-kore-faint mb-md" />
              <span className="text-small text-kore-mid">So soll es aussehen — Referenzbild hochladen</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        {error && <p className="text-small text-red-600">{error}</p>}

        <div className="flex gap-md">
          <button
            type="submit"
            disabled={!title || !deadline || storeIds.length === 0 || createMutation.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Send size={16} /> {createMutation.isPending ? 'Wird gesendet...' : 'Anfrage senden'}
          </button>
          <Link to="/app/tools/vm-compliance/spot-checks" className="flex items-center gap-sm border border-kore-border text-kore-ink px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
