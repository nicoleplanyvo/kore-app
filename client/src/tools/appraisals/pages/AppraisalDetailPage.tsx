import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ClipboardCheck, Save, Star } from 'lucide-react';
import { useAppraisal, useUpdateAppraisal } from '../../../hooks/useAppraisals';

const STATUS_LABELS: Record<string, string> = { PENDING: 'Ausstehend', SELF_REVIEW: 'Selbstbewertung', MANAGER_REVIEW: 'Managerbewertung', COMPLETED: 'Abgeschlossen' };

export function AppraisalDetailPage() {
  const { id } = useParams();
  const { data: appraisal, isLoading } = useAppraisal(id);
  const update = useUpdateAppraisal();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!appraisal) return <div className="p-xl text-body text-kore-mid">Bewertung nicht gefunden.</div>;

  const startEdit = () => {
    setForm({
      status: appraisal.status,
      selfRating: appraisal.selfRating ?? '',
      managerRating: appraisal.managerRating ?? '',
      overallRating: appraisal.overallRating ?? '',
      strengths: appraisal.strengths ?? '',
      improvements: appraisal.improvements ?? '',
      goals: appraisal.goals ?? '',
      meetingNotes: appraisal.meetingNotes ?? '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    update.mutate({
      id: appraisal.id,
      ...form,
      selfRating: form.selfRating ? Number(form.selfRating) : null,
      managerRating: form.managerRating ? Number(form.managerRating) : null,
      overallRating: form.overallRating ? Number(form.overallRating) : null,
    }, { onSuccess: () => setEditing(false) });
  };

  const renderStars = (value: number | null) => {
    if (!value) return '—';
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < value ? 'text-amber-400 fill-amber-400' : 'text-kore-border'} />
    ));
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/appraisals" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><ClipboardCheck size={24} /> Bewertung</h1>
          <p className="text-body text-kore-mid mt-xs">
            {appraisal.employee?.name ?? 'Unbekannt'} · {STATUS_LABELS[appraisal.status] ?? appraisal.status}
            {appraisal.cycle && ` · ${appraisal.cycle.name}`}
          </p>
        </div>
        {!editing && (
          <button onClick={startEdit} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">Bearbeiten</button>
        )}
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Mitarbeiter</span>
            <p className="text-body text-kore-ink">{appraisal.employee?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Manager</span>
            <p className="text-body text-kore-ink">{appraisal.manager?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Status</span>
            {editing ? (
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="PENDING">Ausstehend</option>
                <option value="SELF_REVIEW">Selbstbewertung</option>
                <option value="MANAGER_REVIEW">Managerbewertung</option>
                <option value="COMPLETED">Abgeschlossen</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{STATUS_LABELS[appraisal.status] ?? appraisal.status}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Gesamtbewertung</span>
            {editing ? (
              <select value={form.overallRating} onChange={e => setForm({ ...form, overallRating: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="">—</option>
                {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}/5</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-xs mt-xs">{renderStars(appraisal.overallRating)}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <h3 className="text-small text-kore-mid mb-sm">Selbstbewertung</h3>
          {editing ? (
            <select value={form.selfRating} onChange={e => setForm({ ...form, selfRating: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
              <option value="">—</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}/5</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-xs">{renderStars(appraisal.selfRating)}</div>
          )}
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <h3 className="text-small text-kore-mid mb-sm">Managerbewertung</h3>
          {editing ? (
            <select value={form.managerRating} onChange={e => setForm({ ...form, managerRating: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
              <option value="">—</option>
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}/5</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-xs">{renderStars(appraisal.managerRating)}</div>
          )}
        </div>
      </div>

      {['strengths', 'improvements', 'goals', 'meetingNotes'].map(field => {
        const labels: Record<string, string> = { strengths: 'Stärken', improvements: 'Verbesserungsbereiche', goals: 'Ziele', meetingNotes: 'Gesprächsnotizen' };
        return (
          <div key={field} className="bg-kore-white border border-kore-border p-lg mb-md">
            <h3 className="font-display text-h3 text-kore-ink mb-sm">{labels[field]}</h3>
            {editing ? (
              <textarea value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} rows={3} className="w-full border border-kore-border px-md py-sm text-body" />
            ) : (
              <p className="text-body text-kore-mid whitespace-pre-wrap">{(appraisal as any)[field] || '—'}</p>
            )}
          </div>
        );
      })}

      {editing && (
        <div className="flex gap-sm mt-xl">
          <button onClick={handleSave} disabled={update.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Save size={14} /> {update.isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button onClick={() => setEditing(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">Abbrechen</button>
        </div>
      )}
    </div>
  );
}
