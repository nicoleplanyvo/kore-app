import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStdEvaluation } from '../../../hooks/useStoreStandards';
import { ScoreBar } from '../components/ScoreBar';
import { OperatorBadge } from '../components/OperatorBadge';

export function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: ev, isLoading } = useStdEvaluation(id);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!ev) return <div className="p-xl text-body text-kore-mid">Bewertung nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <Link to="/tools/store-standards/evaluations" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>

      <div className="bg-kore-white border border-kore-border">
        <div className="p-xl border-b border-kore-border">
          <h1 className="font-display text-h1 text-kore-ink">{ev.store?.name}</h1>
          <div className="flex items-center gap-md mt-md">
            <span className="text-small text-kore-mid">{ev.period}</span>
            <span className="text-small text-kore-faint">{new Date(ev.evaluatedAt).toLocaleDateString('de-DE')}</span>
            <span className={`text-small font-medium px-md py-xs border ${ev.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{ev.status === 'COMPLETED' ? 'Abgeschlossen' : 'In Arbeit'}</span>
          </div>
          {ev.overallScore !== null && <div className="mt-lg w-64"><ScoreBar score={ev.overallScore} label="Gesamtscore" /></div>}
        </div>

        <div className="divide-y divide-kore-border">
          {(ev.scores ?? []).map(score => (
            <div key={score.id} className="p-lg flex items-center justify-between">
              <div>
                <span className="text-body font-medium text-kore-ink">{score.definition?.name}</span>
                {score.comment && <p className="text-small text-kore-mid mt-xs">{score.comment}</p>}
              </div>
              <div className="flex items-center gap-lg flex-shrink-0">
                <OperatorBadge operator={score.definition?.operator || 'GTE'} targetValue={score.definition?.targetValue || 0} unit={score.definition?.unit || null} />
                <span className="text-body font-medium text-kore-ink">{score.actualValue}{score.definition?.unit ? ` ${score.definition.unit}` : ''}</span>
                <span className={`text-small font-medium ${score.passed ? 'text-emerald-600' : 'text-red-600'}`}>{score.passed ? '✓' : '✗'}</span>
                <div className="w-20"><ScoreBar score={score.score} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
