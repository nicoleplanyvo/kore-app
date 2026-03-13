import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { useStdEvaluation, useStdDefinitions } from '../../../hooks/useStoreStandards';
import { OperatorBadge } from '../components/OperatorBadge';
import { api } from '../../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function ConductEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: evaluation, isLoading } = useStdEvaluation(id);
  const { data: definitions } = useStdDefinitions();
  const [values, setValues] = useState<Record<string, { actualValue: string; comment: string }>>({});
  const [saving, setSaving] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (defId: string) => {
      const v = values[defId];
      if (!v || !v.actualValue) return;
      return api(`/api/tools/store-standards/evaluations/${id}/scores/${defId}`, {
        method: 'PUT',
        body: JSON.stringify({ actualValue: parseFloat(v.actualValue), comment: v.comment || undefined }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['standards', 'evaluation', id] }),
  });

  const completeMutation = useMutation({
    mutationFn: () => api(`/api/tools/store-standards/evaluations/${id}/complete`, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['standards'] }); navigate(`/tools/store-standards/evaluations/${id}`); },
  });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!evaluation) return <div className="p-xl text-body text-kore-mid">Bewertung nicht gefunden.</div>;

  const activeDefs = (definitions ?? []).filter(d => d.isActive);

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/tools/store-standards" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Bewertung: {evaluation.store?.name}</h1>
          <p className="text-body text-kore-mid mt-xs">Periode: {evaluation.period}</p>
        </div>
        <button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending} className="flex items-center gap-sm bg-emerald-600 text-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-emerald-700 transition-colors disabled:opacity-50"><CheckCircle size={16} /> Abschließen</button>
      </div>

      <div className="space-y-md">
        {activeDefs.map(def => {
          const existing = evaluation.scores?.find(s => s.definitionId === def.id);
          const val = values[def.id] || { actualValue: existing?.actualValue?.toString() ?? '', comment: existing?.comment ?? '' };

          return (
            <div key={def.id} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <span className="text-body font-medium text-kore-ink">{def.name}</span>
                  {def.description && <p className="text-small text-kore-mid mt-xs">{def.description}</p>}
                </div>
                <OperatorBadge operator={def.operator} targetValue={def.targetValue} unit={def.unit} />
              </div>
              <div className="flex items-end gap-md">
                <div className="flex-1">
                  <label className="text-small text-kore-mid">Ist-Wert</label>
                  <input type="number" step="0.01" value={val.actualValue} onChange={e => setValues(prev => ({ ...prev, [def.id]: { ...val, actualValue: e.target.value } }))} className="w-full border border-kore-border px-md py-sm text-body focus:outline-none focus:border-kore-brass mt-xs" placeholder={`Ziel: ${def.targetValue}${def.unit ? ' ' + def.unit : ''}`} />
                </div>
                <div className="flex-1">
                  <label className="text-small text-kore-mid">Kommentar</label>
                  <input type="text" value={val.comment} onChange={e => setValues(prev => ({ ...prev, [def.id]: { ...val, comment: e.target.value } }))} className="w-full border border-kore-border px-md py-sm text-body focus:outline-none focus:border-kore-brass mt-xs" placeholder="Optional..." />
                </div>
                <button onClick={() => { setValues(prev => ({ ...prev, [def.id]: val })); saveMutation.mutate(def.id); }} disabled={!val.actualValue || saveMutation.isPending} className="flex items-center gap-sm border border-kore-border text-kore-ink px-md py-sm text-small hover:bg-kore-bg transition-colors disabled:opacity-30"><Save size={14} /></button>
              </div>
              {existing && (
                <div className="mt-sm flex items-center gap-md">
                  <span className={`text-small font-medium ${existing.passed ? 'text-emerald-600' : 'text-red-600'}`}>{existing.passed ? '✓ Bestanden' : '✗ Nicht bestanden'}</span>
                  <span className="text-small text-kore-faint">Score: {Math.round(existing.score)}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
