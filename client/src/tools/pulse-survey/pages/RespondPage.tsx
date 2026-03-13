import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { usePulseSurvey, useRespondPulseSurvey } from '../../../hooks/usePulseSurvey';

export function RespondPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: survey, isLoading } = usePulseSurvey(id);
  const respond = useRespondPulseSurvey();
  const [answers, setAnswers] = useState<Record<string, any>>({});

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!survey) return <div className="p-xl text-body text-kore-mid">Umfrage nicht gefunden.</div>;

  const updateAnswer = (questionId: string, field: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: { ...(prev[questionId] ?? {}), questionId, [field]: value } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    respond.mutate({ surveyId: survey.id, answers: Object.values(answers) }, { onSuccess: () => navigate(`/tools/pulse-survey/surveys/${id}`) });
  };

  return (
    <div className="p-xl max-w-3xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to={`/tools/pulse-survey/surveys/${id}`} className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">{survey.title}</h1>
          <p className="text-body text-kore-mid mt-xs">Bitte beantworten Sie alle Fragen.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-md">
        {survey.questions?.map((q: any, i: number) => (
          <div key={q.id} className="bg-kore-white border border-kore-border p-lg">
            <label className="block font-medium text-kore-ink mb-md">{i + 1}. {q.text}</label>

            {q.type === 'RATING' && (
              <div className="flex gap-sm">
                {[1,2,3,4,5].map(v => (
                  <button key={v} type="button" onClick={() => updateAnswer(q.id, 'valueRating', v)}
                    className={`w-12 h-12 border text-body font-medium transition-colors ${answers[q.id]?.valueRating === v ? 'bg-kore-ink text-kore-white border-kore-ink' : 'border-kore-border text-kore-mid hover:border-kore-ink'}`}>
                    {v}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'TEXT' && (
              <textarea value={answers[q.id]?.valueText ?? ''} onChange={e => updateAnswer(q.id, 'valueText', e.target.value)}
                rows={3} className="w-full border border-kore-border px-md py-sm text-body" placeholder="Ihre Antwort..." />
            )}

            {q.type === 'CHOICE' && q.options?.map((opt: string) => (
              <label key={opt} className="flex items-center gap-sm mb-sm text-body text-kore-ink cursor-pointer">
                <input type="radio" name={`q-${q.id}`} checked={answers[q.id]?.valueChoice === opt}
                  onChange={() => updateAnswer(q.id, 'valueChoice', opt)} className="accent-kore-ink" />
                {opt}
              </label>
            ))}
          </div>
        ))}

        <button type="submit" disabled={respond.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
          <Send size={16} /> {respond.isPending ? 'Wird gesendet...' : 'Antworten absenden'}
        </button>
      </form>
    </div>
  );
}
