import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, Send, ShieldAlert } from 'lucide-react';
import { useSpotCheck, useRespondSpotCheck, formatDeadline } from '../../../hooks/useSpotChecks';
import { AuthImage } from '../../../components/AuthImage';
/* eslint-disable @typescript-eslint/no-explicit-any */

export function SpotCheckRespondPage() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const storeIdParam = params.get('store');
  const { data: request, isLoading } = useSpotCheck(id);
  const respondMutation = useRespondSpotCheck();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <div className="p-xl"><p className="text-small text-kore-mid">Lädt...</p></div>;
  if (!request) return <div className="p-xl"><p className="text-small text-kore-mid">Anfrage nicht gefunden.</p></div>;

  // Ziel-Store: aus Query-Param oder einziger eigener Target
  const targets = request.targets ?? [];
  const target = storeIdParam ? targets.find((t: any) => t.storeId === storeIdParam) : targets[0];
  const dl = formatDeadline(request.deadline);

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
    if (!file || !target) return;
    const fd = new FormData();
    fd.append('storeId', target.storeId);
    fd.append('photo', file);
    if (comment) fd.append('comment', comment);
    respondMutation.mutate(
      { id: request.id, formData: fd },
      {
        onSuccess: () => navigate('/app/tools/vm-compliance/spot-checks'),
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  return (
    <div className="p-xl max-w-3xl">
      <Link to="/app/tools/vm-compliance/spot-checks" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Spot-Checks
      </Link>

      <div className="flex items-start justify-between mb-sm">
        <h1 className="font-display text-h1 text-kore-ink">{request.title}</h1>
        <span className={`px-md py-xs text-caption uppercase tracking-widest shrink-0 mt-sm ${dl.overdue ? 'text-red-700 bg-red-100' : dl.urgent ? 'text-amber-700 bg-amber-100' : 'text-kore-mid bg-kore-bg'}`}>{dl.label}</span>
      </div>
      <p className="text-body text-kore-mid mb-xl">
        {target ? `${target.store.name} · ` : ''}angefragt von {request.creator?.name}
        {request.category ? ` · ${request.category}` : ''}
      </p>

      {target?.status === 'REJECTED' && target?.reviewNote && (
        <div className="border border-red-200 bg-red-50 p-lg mb-xl">
          <p className="text-small text-red-700"><span className="font-medium uppercase tracking-widest text-caption">Nachbesserung:</span> {target.reviewNote}</p>
        </div>
      )}

      {request.instructions && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <p className="text-small text-kore-mid whitespace-pre-wrap">{request.instructions}</p>
        </div>
      )}

      {request.referencePhoto && (
        <div className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">So soll es aussehen</h2>
          <AuthImage src={request.referencePhoto} alt="Referenzfoto" className="max-h-72 object-contain border border-kore-border" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Ihr Foto</h2>
          {preview ? (
            <div className="relative mb-lg">
              <img src={preview} alt="Vorschau" className="w-full max-h-96 object-contain border border-kore-border" />
              <button type="button" onClick={() => { setFile(null); setPreview(null); }} className="absolute top-sm right-sm bg-kore-ink text-kore-white px-md py-xs text-caption uppercase tracking-widest">Entfernen</button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-kore-border p-3xl cursor-pointer hover:border-kore-brass transition-colors">
              <Camera size={36} className="text-kore-faint mb-md" />
              <span className="text-body text-kore-mid">Foto aufnehmen</span>
              <span className="text-small text-kore-faint mt-xs">JPG, PNG, HEIC bis 10 MB</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
            </label>
          )}
          <div className="flex items-start gap-sm text-kore-faint mt-md">
            <ShieldAlert size={16} className="shrink-0 mt-px" />
            <p className="text-caption">Bitte keine Personen im Bild aufnehmen (Datenschutz).</p>
          </div>
        </div>

        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Anmerkung (optional)</h2>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full border border-kore-border px-md py-sm text-small resize-none" placeholder="z. B. Besonderheiten vor Ort..." />
        </div>

        {error && <p className="text-small text-red-600">{error}</p>}

        <div className="flex gap-md">
          <button
            type="submit"
            disabled={!file || !target || respondMutation.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Send size={16} /> {respondMutation.isPending ? 'Wird gesendet...' : 'Foto einreichen'}
          </button>
          <Link to="/app/tools/vm-compliance/spot-checks" className="flex items-center gap-sm border border-kore-border text-kore-ink px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
