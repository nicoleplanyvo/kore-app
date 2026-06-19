import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Check } from 'lucide-react';
import { useFollowUpsList, useFollowUpMetrics, useResolveFollowUpWithProof, useUpdateFollowUp } from '../../../hooks/useFollowUps';
import { useAuditStores } from '../../../hooks/useAudit';
import { AuthImage } from '../../../components/AuthImage';
/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_LABELS: Record<string, string> = { OPEN: 'Offen', IN_PROGRESS: 'In Arbeit', DONE: 'Erledigt', CANCELLED: 'Abgebrochen' };
const STATUS_COLORS: Record<string, string> = {
  OPEN: 'text-amber-600 bg-amber-50', IN_PROGRESS: 'text-sky-700 bg-sky-50',
  DONE: 'text-emerald-600 bg-emerald-50', CANCELLED: 'text-kore-mid bg-kore-bg',
};

export function FollowUpsPage() {
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');
  const { data: stores } = useAuditStores();
  const { data: result, isLoading } = useFollowUpsList({ storeId: storeId || undefined, status: status || undefined });
  const { data: metrics } = useFollowUpMetrics();
  const followUps = result?.data ?? [];

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/sea" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Store Excellence Audit
      </Link>

      <div className="mb-2xl">
        <h1 className="font-display text-h1 text-kore-ink">Follow-ups</h1>
        <p className="text-body text-kore-mid mt-xs">Maßnahmen aus Store-Visits — vom Befund bis zur nachgewiesenen Erledigung</p>
      </div>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? (
        <p className="text-small text-kore-mid">Lädt...</p>
      ) : followUps.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center mb-2xl">
          <p className="text-body text-kore-mid">Keine Follow-ups gefunden. Maßnahmen werden direkt im Audit angelegt.</p>
        </div>
      ) : (
        <div className="space-y-md mb-2xl">
          {followUps.map((f: any) => <FollowUpCard key={f.id} followUp={f} />)}
        </div>
      )}

      {(metrics ?? []).length > 0 && (
        <>
          <div className="flex items-baseline justify-between mb-lg gap-md">
            <h2 className="font-display text-h3 text-kore-ink">Erledigung je Store</h2>
            <span className="text-caption text-kore-faint sm:hidden shrink-0">horizontal wischen →</span>
          </div>
          <div className="bg-kore-white border border-kore-border overflow-x-auto">
            <table className="w-full min-w-[640px] text-small">
              <thead>
                <tr className="border-b border-kore-border text-left text-kore-mid">
                  <th className="px-lg py-md font-medium">Store</th>
                  <th className="px-lg py-md font-medium text-right">Offen</th>
                  <th className="px-lg py-md font-medium text-right">Überfällig</th>
                  <th className="px-lg py-md font-medium text-right">Erledigt</th>
                  <th className="px-lg py-md font-medium text-right">Quote</th>
                  <th className="px-lg py-md font-medium text-right">Ø Durchlaufzeit</th>
                </tr>
              </thead>
              <tbody>
                {(metrics ?? []).map((m: any) => (
                  <tr key={m.storeId} className="border-b border-kore-border last:border-0">
                    <td className="px-lg py-md text-kore-ink">{m.storeName}</td>
                    <td className="px-lg py-md text-right text-kore-mid">{m.open}</td>
                    <td className={`px-lg py-md text-right ${m.overdue > 0 ? 'text-red-600' : 'text-kore-mid'}`}>{m.overdue}</td>
                    <td className="px-lg py-md text-right text-kore-mid">{m.done}</td>
                    <td className="px-lg py-md text-right text-kore-mid">{m.completionRate != null ? `${m.completionRate} %` : '—'}</td>
                    <td className="px-lg py-md text-right text-kore-mid">{m.avgResolutionDays != null ? `${m.avgResolutionDays} Tg.` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-caption text-kore-faint mt-sm">Kennzahlen werden ausschließlich auf Store-Ebene erhoben — keine personenbezogene Auswertung.</p>
        </>
      )}
    </div>
  );
}

function FollowUpCard({ followUp: f }: { followUp: any }) {
  const resolveWithProof = useResolveFollowUpWithProof();
  const updateMutation = useUpdateFollowUp();
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const isOpen = f.status === 'OPEN' || f.status === 'IN_PROGRESS';
  const overdue = isOpen && f.dueDate && new Date(f.dueDate).getTime() < Date.now();

  const handleResolve = () => {
    const fd = new FormData();
    fd.append('status', 'DONE');
    if (resolution) fd.append('resolution', resolution);
    if (file) fd.append('proofPhoto', file);
    resolveWithProof.mutate({ id: f.id, formData: fd }, { onSuccess: () => setResolving(false) });
  };

  return (
    <div className="bg-kore-white border border-kore-border p-lg">
      <div className="flex items-start justify-between gap-md flex-wrap">
        <div className="min-w-0">
          <p className="text-body text-kore-ink">{f.description}</p>
          <p className="text-small text-kore-mid mt-xs">
            {f.store?.name}
            {f.response?.criterion?.name ? ` · ${f.response.criterion.name}` : ''}
            {f.session?.template?.name ? ` · ${f.session.template.name}` : ''}
            {f.assignee?.name ? ` · ${f.assignee.name}` : ''}
            {f.dueDate ? ` · fällig ${new Date(f.dueDate).toLocaleDateString('de-DE')}` : ''}
          </p>
          {f.resolution && <p className="text-small text-kore-mid mt-xs">Erledigt: {f.resolution}</p>}
        </div>
        <span className={`px-md py-xs text-caption uppercase tracking-widest shrink-0 ${overdue ? 'text-red-700 bg-red-100' : STATUS_COLORS[f.status] ?? ''}`}>
          {overdue ? 'Überfällig' : STATUS_LABELS[f.status] ?? f.status}
        </span>
      </div>

      {f.proofPhotoPath && (
        <div className="mt-md">
          <p className="text-caption text-kore-faint uppercase tracking-widest mb-sm">Nachweis</p>
          <AuthImage src={f.proofPhotoPath} alt="Erledigungs-Nachweis" className="max-h-48 object-contain border border-kore-border" />
        </div>
      )}

      {isOpen && (
        <div className="mt-md border-t border-kore-border pt-md">
          {resolving ? (
            <div className="space-y-md">
              <input
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Was wurde gemacht?"
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
              />
              <div className="flex gap-md items-center flex-wrap">
                <label className="flex items-center gap-sm border border-kore-border px-md py-sm text-small text-kore-mid cursor-pointer hover:border-kore-brass">
                  <Camera size={14} /> {file ? file.name.slice(0, 24) : 'Nachweis-Foto'}
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                </label>
                <button onClick={handleResolve} disabled={resolveWithProof.isPending} className="bg-kore-ink text-kore-white px-lg py-sm text-caption uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {resolveWithProof.isPending ? 'Speichert...' : 'Als erledigt melden'}
                </button>
                <button onClick={() => setResolving(false)} className="border border-kore-border px-lg py-sm text-caption uppercase tracking-widest text-kore-mid">Abbrechen</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-md">
              <button onClick={() => setResolving(true)} className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-sm text-caption uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-700 transition-colors">
                <Check size={14} /> Erledigen
              </button>
              {f.status === 'OPEN' && (
                <button onClick={() => updateMutation.mutate({ id: f.id, status: 'IN_PROGRESS' })} className="border border-kore-border text-kore-mid px-lg py-sm text-caption uppercase tracking-widest hover:text-kore-ink transition-colors">
                  In Arbeit
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
