import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, BarChart3, Plus, MessageSquare } from 'lucide-react';
import { usePulseSurvey, useAddPulseQuestion, usePulseSurveyResults } from '../../../hooks/usePulseSurvey';

const QUESTION_TYPES: Record<string, string> = { RATING: 'Bewertung (1-5)', TEXT: 'Freitext', CHOICE: 'Auswahl' };

export function SurveyDetailPage() {
  const { id } = useParams();
  const { data: survey, isLoading } = usePulseSurvey(id);
  const { data: results } = usePulseSurveyResults(id);
  const addQuestion = useAddPulseQuestion();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: '', type: 'RATING', options: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!survey) return <div className="p-xl text-body text-kore-mid">Umfrage nicht gefunden.</div>;

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { surveyId: survey.id, text: form.text, type: form.type };
    if (form.type === 'CHOICE' && form.options) data.options = form.options.split(',').map((o: string) => o.trim());
    addQuestion.mutate(data, { onSuccess: () => { setShowForm(false); setForm({ text: '', type: 'RATING', options: '' }); } });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/pulse-survey" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><BarChart3 size={24} /> {survey.title}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {survey.status} · {new Date(survey.startDate).toLocaleDateString('de-DE')} – {new Date(survey.endDate).toLocaleDateString('de-DE')}
            {survey.isAnonymous && ' · Anonym'}
          </p>
        </div>
        {survey.status === 'ACTIVE' && (
          <Link to={`/tools/pulse-survey/surveys/${id}/respond`} className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90">
            <MessageSquare size={16} /> Teilnehmen
          </Link>
        )}
      </div>

      {/* Questions */}
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-display text-h3 text-kore-ink">Fragen ({survey.questions?.length ?? 0})</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={14} /> Frage hinzufügen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddQuestion} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Fragetext</label>
            <input value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Typ</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
              <option value="RATING">Bewertung (1-5)</option>
              <option value="TEXT">Freitext</option>
              <option value="CHOICE">Auswahl</option>
            </select>
          </div>
          {form.type === 'CHOICE' && (
            <div>
              <label className="block text-small text-kore-mid mb-xs">Optionen (kommagetrennt)</label>
              <input value={form.options} onChange={e => setForm({ ...form, options: e.target.value })} placeholder="Option A, Option B, Option C" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          )}
          <button type="submit" disabled={addQuestion.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Frage hinzufügen</button>
        </form>
      )}

      {!survey.questions?.length ? (
        <p className="text-body text-kore-mid mb-xl">Keine Fragen definiert.</p>
      ) : (
        <div className="space-y-sm mb-xl">
          {survey.questions.map((q: any, i: number) => (
            <div key={q.id} className="bg-kore-white border border-kore-border p-md">
              <div className="flex items-center justify-between">
                <span className="font-medium text-kore-ink">{i + 1}. {q.text}</span>
                <span className="text-small text-kore-mid">{QUESTION_TYPES[q.type] ?? q.type}</span>
              </div>
              {q.options?.length > 0 && (
                <div className="flex gap-sm mt-xs">
                  {q.options.map((o: string, j: number) => (
                    <span key={j} className="px-sm py-xs bg-kore-bg text-small text-kore-mid">{o}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          <h2 className="font-display text-h3 text-kore-ink mb-md">Ergebnisse ({results.responseCount ?? 0} Antworten)</h2>
          {results.questionResults?.map((qr: any) => (
            <div key={qr.questionId} className="bg-kore-white border border-kore-border p-md mb-sm">
              <span className="font-medium text-kore-ink">{qr.text}</span>
              {qr.type === 'RATING' && qr.averageRating != null && (
                <div className="mt-sm">
                  <div className="flex items-center gap-sm">
                    <div className="w-full bg-kore-bg rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(qr.averageRating / 5) * 100}%` }} />
                    </div>
                    <span className="font-medium text-kore-ink">{qr.averageRating.toFixed(1)}/5</span>
                  </div>
                </div>
              )}
              {qr.type === 'CHOICE' && qr.choiceDistribution && (
                <div className="mt-sm space-y-xs">
                  {Object.entries(qr.choiceDistribution).map(([choice, count]) => (
                    <div key={choice} className="flex items-center gap-sm text-small">
                      <span className="w-24 text-kore-mid">{choice}</span>
                      <div className="flex-1 bg-kore-bg rounded-full h-2">
                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${((count as number) / (results.responseCount || 1)) * 100}%` }} />
                      </div>
                      <span className="text-kore-ink">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
              {qr.type === 'TEXT' && qr.textResponses?.length > 0 && (
                <div className="mt-sm space-y-xs">
                  {qr.textResponses.slice(0, 5).map((t: string, i: number) => (
                    <p key={i} className="text-small text-kore-mid italic">&ldquo;{t}&rdquo;</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
