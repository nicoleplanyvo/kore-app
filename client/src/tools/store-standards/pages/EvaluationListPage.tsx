import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStdEvaluations } from '../../../hooks/useStoreStandards';
import { ScoreBar } from '../components/ScoreBar';

export function EvaluationListPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStdEvaluations(page);
  const items = data?.data ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Alle Bewertungen</h1>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : (
        <div className="space-y-md">
          {items.map(ev => (
            <Link key={ev.id} to={`/tools/store-standards/evaluations/${ev.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-body font-medium text-kore-ink">{ev.store?.name}</span>
                  <div className="flex items-center gap-md mt-xs">
                    <span className="text-small text-kore-mid">{ev.period}</span>
                    <span className="text-small text-kore-faint">{new Date(ev.evaluatedAt).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
                {ev.overallScore !== null && <div className="w-32"><ScoreBar score={ev.overallScore} /></div>}
              </div>
            </Link>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-small text-kore-mid disabled:opacity-30">Zurück</button>
              <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="text-small text-kore-mid disabled:opacity-30">Weiter</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
