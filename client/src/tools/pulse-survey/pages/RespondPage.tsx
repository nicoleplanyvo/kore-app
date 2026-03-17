import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Lock } from 'lucide-react';
import { usePulseSurvey, useRespondPulseSurvey, usePulseStores } from '../../../hooks/usePulseSurvey';

export function RespondPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: survey, isLoading } = usePulseSurvey(id);
  const { data: stores } = usePulseStores();
  const respond = useRespondPulseSurvey();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [storeId, setStoreId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (stores?.length && !storeId) setStoreId(stores[0].id);
  }, [stores, storeId]);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!survey) return <div className="p-xl text-body text-kore-mid">Umfrage nicht gefunden.</div>;

  if (survey.status !== 'ACTIVE') {
    return (
      <div className="p-xl max-w-3xl">
        <div className="flex items-center gap-md mb-2xl">
          <Link to={`/tools/pulse-survey/surveys/${id}`} className="text-kore-mid hover:text-kore-ink"><ArrowLeft size={20} /></Link>
          <h1 className="font-display text-h1 text-kore-ink">{survey.title}</h1>
        </div>
        <div className="bg-kore-white border border-kore-border p-2xl text-center">
          <Lock size={48} className="text-kore-faint mx-auto mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Umfrage nicht verfuegbar</h2>
          <p className="text-body text-kore-mid">Diese Umfrage ist derzeit nicht aktiv und kann nicht beantwortet werden.</p>
        </div>
      </div>
    );
  }

  const updateAnswer = (questionId: string, field: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...(prev[questionId] ?? {}), questionId, [field]: value },
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = survey.questions?.length ?? 0;
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    respond.mutate(
      { surveyId: survey.id, storeId: storeId || undefined, answers: Object.values(answers) },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => {/* error handled via respond.isError */},
      },
    );
  };

  if (submitted) {
    return (
      <div className="p-xl max-w-3xl">
        <div className="bg-kore-white border border-kore-border p-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-lg">
            <Send size={32} className="text-emerald-600" />
          </div>
          <h2 className="font-display text-h2 text-kore-ink mb-md">Vielen Dank!</h2>
          <p className="text-body text-kore-mid mb-xl">
            Ihre Antworten wurden erfolgreich uebermittelt.
            {survey.isAnonymous && ' Die Teilnahme war anonym.'}
          </p>
          <Link
            to="/tools/pulse-survey"
            className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            Zurueck zur Uebersicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-xl max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to={`/tools/pulse-survey/surveys/${id}`} className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">{survey.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            Bitte beantworten Sie alle Fragen. {survey.isAnonymous && 'Ihre Teilnahme ist anonym.'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-kore-white border border-kore-border p-md mb-lg">
        <div className="flex items-center justify-between text-small text-kore-mid mb-xs">
          <span>Fortschritt</span>
          <span>{answeredCount} / {totalQuestions} Fragen</span>
        </div>
        <div className="w-full bg-kore-bg h-2">
          <div
            className="bg-kore-brass h-2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <div className="mb-lg">
          <label className="block text-small text-kore-mid mb-xs">Ihr Store</label>
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="border border-kore-border px-md py-sm text-body"
          >
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* Questions */}
      <form onSubmit={handleSubmit} className="space-y-md">
        {survey.questions?.map((q: any, i: number) => (
          <div key={q.id} className="bg-kore-white border border-kore-border p-lg">
            <label className="block font-medium text-kore-ink mb-md">{i + 1}. {q.text}</label>

            {q.type === 'RATING' && (
              <div>
                <div className="flex gap-sm mb-sm">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateAnswer(q.id, 'valueRating', v)}
                      className={`w-12 h-12 border text-body font-medium transition-colors ${
                        answers[q.id]?.valueRating === v
                          ? 'bg-kore-ink text-kore-white border-kore-ink'
                          : 'border-kore-border text-kore-mid hover:border-kore-ink'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-kore-mid px-1">
                  <span>Trifft nicht zu</span>
                  <span>Trifft voll zu</span>
                </div>
              </div>
            )}

            {q.type === 'TEXT' && (
              <textarea
                value={answers[q.id]?.valueText ?? ''}
                onChange={e => updateAnswer(q.id, 'valueText', e.target.value)}
                rows={3}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder="Ihre Antwort..."
              />
            )}

            {q.type === 'CHOICE' && q.options && (
              <div className="space-y-sm">
                {q.options.split(',').map((opt: string) => {
                  const trimmed = opt.trim();
                  return (
                    <label key={trimmed} className="flex items-center gap-sm text-body text-kore-ink cursor-pointer p-sm hover:bg-kore-bg transition-colors">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[q.id]?.valueChoice === trimmed}
                        onChange={() => updateAnswer(q.id, 'valueChoice', trimmed)}
                        className="w-4 h-4 accent-kore-ink"
                      />
                      {trimmed}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Submit */}
        <div className="flex items-center justify-between pt-md">
          <span className="text-small text-kore-mid">
            {answeredCount} von {totalQuestions} Fragen beantwortet
          </span>
          <button
            type="submit"
            disabled={respond.isPending}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} /> {respond.isPending ? 'Wird gesendet...' : 'Antworten absenden'}
          </button>
        </div>
        {respond.isError && (
          <p className="text-small text-red-600 mt-sm">{(respond.error as Error).message}</p>
        )}
      </form>
    </div>
  );
}
