import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, Download, Users } from 'lucide-react';
import { usePulseSurveyResults, usePulseStores } from '../../../hooks/usePulseSurvey';

function ratingColor(avg: number | null): string {
  if (avg === null) return 'text-kore-mid';
  if (avg >= 4) return 'text-emerald-600';
  if (avg >= 3) return 'text-amber-600';
  return 'text-red-600';
}

function ratingBarColor(avg: number | null): string {
  if (avg === null) return 'bg-kore-faint';
  if (avg >= 4) return 'bg-emerald-500';
  if (avg >= 3) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ResultsPage() {
  const { id } = useParams();
  const { data: stores } = usePulseStores();
  const [storeId, setStoreId] = useState('');
  const { data: results, isLoading } = usePulseSurveyResults(id, storeId || undefined);

  useEffect(() => {
    // Don't auto-select store — show all by default
  }, []);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Ergebnisse...</div>;
  if (!results) return <div className="p-xl text-body text-kore-mid">Keine Ergebnisse verfuegbar.</div>;

  const totalResponses = results.totalResponses ?? 0;
  const questionResults = results.questionResults ?? [];

  // CSV export
  const exportCSV = () => {
    let csv = 'Frage,Typ,Antworten,Durchschnitt\n';
    questionResults.forEach((qr: any) => {
      const avg = qr.avgRating != null ? qr.avgRating.toFixed(1) : '';
      csv += `"${qr.text}",${qr.type},${qr.totalAnswers},${avg}\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `pulse-results-${id}.csv`;
    a.click();
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to={`/tools/pulse-survey/surveys/${id}`} className="text-kore-mid hover:text-kore-ink">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Ergebnisse: {results.survey?.title}
          </h1>
          <div className="flex items-center gap-md mt-xs text-body text-kore-mid">
            <span className="flex items-center gap-xs">
              <Users size={14} /> {totalResponses} Teilnehmer
            </span>
            {results.survey?.isAnonymous && <span className="text-indigo-600">Anonym</span>}
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {stores && stores.length > 1 && (
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="border border-kore-border px-md py-sm text-small"
            >
              <option value="">Alle Stores</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={exportCSV}
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-kore-brass">{totalResponses}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Teilnehmer</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-blue-600">{questionResults.length}</div>
          <div className="text-xs text-kore-mid uppercase mt-1">Fragen</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className={`text-2xl font-bold ${ratingColor(
            (() => {
              const ratings = questionResults.filter((q: any) => q.avgRating != null);
              return ratings.length > 0
                ? Math.round(ratings.reduce((s: number, q: any) => s + q.avgRating, 0) / ratings.length * 10) / 10
                : null;
            })()
          )}`}>
            {(() => {
              const ratings = questionResults.filter((q: any) => q.avgRating != null);
              return ratings.length > 0
                ? (ratings.reduce((s: number, q: any) => s + q.avgRating, 0) / ratings.length).toFixed(1)
                : '--';
            })()}
          </div>
          <div className="text-xs text-kore-mid uppercase mt-1">Durchschnitt</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-md text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(results.participationByStore ?? {}).length}
          </div>
          <div className="text-xs text-kore-mid uppercase mt-1">Stores</div>
        </div>
      </div>

      {/* Question Results */}
      <div className="space-y-md">
        {questionResults.map((qr: any, i: number) => (
          <div key={qr.questionId} className="bg-kore-white border border-kore-border p-lg">
            <div className="flex items-start justify-between mb-md">
              <span className="font-medium text-kore-ink">{i + 1}. {qr.text}</span>
              <span className="text-small text-kore-mid flex-shrink-0 ml-md">{qr.totalAnswers} Antworten</span>
            </div>

            {/* Rating results */}
            {qr.type === 'RATING' && (
              <div>
                <div className="flex items-center gap-md mb-md">
                  <div className={`text-3xl font-bold ${ratingColor(qr.avgRating)}`}>
                    {qr.avgRating != null ? qr.avgRating.toFixed(1) : '--'}
                  </div>
                  <div className="text-small text-kore-mid">von 5.0</div>
                  <div className="flex-1">
                    <div className="w-full bg-kore-bg h-3">
                      <div
                        className={`h-3 transition-all ${ratingBarColor(qr.avgRating)}`}
                        style={{ width: `${(qr.avgRating ?? 0) / 5 * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                {/* Rating distribution */}
                {qr.ratingDistribution && (
                  <div className="space-y-xs">
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = qr.ratingDistribution[rating] ?? 0;
                      const pct = qr.totalAnswers > 0 ? (count / qr.totalAnswers) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-sm text-small">
                          <span className="w-4 text-right text-kore-mid font-medium">{rating}</span>
                          <div className="flex-1 bg-kore-bg h-2">
                            <div
                              className={`h-2 ${rating >= 4 ? 'bg-emerald-400' : rating >= 3 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-kore-mid">{count}</span>
                          <span className="w-10 text-right text-kore-mid">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Choice results */}
            {qr.type === 'CHOICE' && qr.choiceDistribution && (
              <div className="space-y-sm">
                {Object.entries(qr.choiceDistribution)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([choice, count]) => {
                    const pct = qr.totalAnswers > 0 ? ((count as number) / qr.totalAnswers) * 100 : 0;
                    return (
                      <div key={choice} className="flex items-center gap-sm text-small">
                        <span className="w-32 text-kore-mid truncate" title={choice}>{choice}</span>
                        <div className="flex-1 bg-kore-bg h-3">
                          <div className="bg-indigo-500 h-3" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-kore-ink font-medium">{count as number}</span>
                        <span className="w-10 text-right text-kore-mid">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Text results */}
            {qr.type === 'TEXT' && qr.textResponses && (
              <div>
                {qr.textResponses.length === 0 ? (
                  <p className="text-small text-kore-mid italic">Keine Freitext-Antworten.</p>
                ) : (
                  <div className="space-y-sm max-h-64 overflow-y-auto">
                    {qr.textResponses.map((t: string, j: number) => (
                      <div key={j} className="bg-kore-bg p-sm text-small text-kore-ink italic">
                        &ldquo;{t}&rdquo;
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Store participation */}
      {results.participationByStore && Object.keys(results.participationByStore).length > 1 && (
        <div className="bg-kore-white border border-kore-border p-lg mt-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Teilnahme nach Store</h2>
          <div className="space-y-sm">
            {Object.entries(results.participationByStore)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([sid, count]) => {
                const store = stores?.find((s: any) => s.id === sid);
                const pct = totalResponses > 0 ? ((count as number) / totalResponses) * 100 : 0;
                return (
                  <div key={sid} className="flex items-center gap-sm text-small">
                    <span className="w-32 text-kore-mid truncate">{store?.name ?? sid}</span>
                    <div className="flex-1 bg-kore-bg h-2">
                      <div className="bg-kore-brass h-2" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-kore-ink font-medium">{count as number}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {totalResponses === 0 && (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-kore-mid mt-xl">
          Noch keine Antworten vorhanden.
        </div>
      )}
    </div>
  );
}
