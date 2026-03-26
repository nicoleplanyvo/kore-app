import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera } from 'lucide-react';
import { useVmComplianceStores, useVmComplianceGuidelines, useSubmitVmCheck } from '../../../hooks/useVmCompliance';

export function SubmitPage() {
  const navigate = useNavigate();
  const { data: stores } = useVmComplianceStores();
  const { data: guidelines } = useVmComplianceGuidelines();
  const submitMutation = useSubmitVmCheck();

  const [storeId, setStoreId] = useState('');
  const [guidelineId, setGuidelineId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !guidelineId || !file) return;

    const fd = new FormData();
    fd.append('storeId', storeId);
    fd.append('guidelineId', guidelineId);
    fd.append('photo', file);
    if (notes) fd.append('notes', notes);

    submitMutation.mutate(fd, {
      onSuccess: () => navigate('/app/tools/vm-compliance'),
    });
  };

  return (
    <div className="p-xl max-w-3xl">
      <Link to="/app/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurück
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">Neuen Check einreichen</h1>
      <p className="text-body text-kore-mid mb-2xl">Laden Sie ein Foto hoch und wählen Sie den Bereich für den VM-Compliance-Check.</p>

      <form onSubmit={handleSubmit} className="space-y-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Zuordnung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="text-small text-kore-mid block mb-sm">Store *</label>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small bg-kore-white" required>
                <option value="">Store wählen...</option>
                {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-small text-kore-mid block mb-sm">Bereich / Guideline *</label>
              <select value={guidelineId} onChange={(e) => setGuidelineId(e.target.value)} className="w-full border border-kore-border px-md py-sm text-small bg-kore-white" required>
                <option value="">Bereich wählen...</option>
                {(guidelines ?? []).map((g: any) => <option key={g.id} value={g.id}>{g.name} {g.category ? `(${g.category})` : ''}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Foto</h2>
          {preview ? (
            <div className="relative mb-lg">
              <img src={preview} alt="Vorschau" className="w-full max-h-96 object-contain border border-kore-border" />
              <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute top-sm right-sm bg-kore-ink text-kore-white px-md py-xs text-caption uppercase tracking-widest">Entfernen</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-kore-border p-3xl cursor-pointer hover:border-kore-brass transition-colors">
              <Camera size={36} className="text-kore-faint mb-md" />
              <span className="text-body text-kore-mid">Foto hochladen</span>
              <span className="text-small text-kore-faint mt-xs">JPG, PNG bis 10 MB</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Anmerkungen</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-kore-border px-md py-sm text-small resize-none"
            rows={3}
            placeholder="Optionale Anmerkungen zum Check..."
          />
        </div>

        <div className="flex gap-md">
          <button
            type="submit"
            disabled={!storeId || !guidelineId || !file || submitMutation.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Upload size={16} /> {submitMutation.isPending ? 'Wird eingereicht...' : 'Check einreichen'}
          </button>
          <Link to="/app/tools/vm-compliance" className="flex items-center gap-sm border border-kore-border text-kore-ink px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
