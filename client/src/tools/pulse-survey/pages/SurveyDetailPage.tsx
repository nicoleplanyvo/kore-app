import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ClipboardList, Plus, MessageSquare, BarChart3, Trash2, GripVertical, Pencil, Check, X } from 'lucide-react';
import {
  usePulseSurvey,
  useAddPulseQuestion,
  useDeletePulseQuestion,
  useUpdatePulseQuestion,
  useUpdatePulseSurvey,
} from '../../../hooks/usePulseSurvey';

const QUESTION_TYPES: Record<string, string> = { RATING: 'Bewertung (1-5)', TEXT: 'Freitext', CHOICE: 'Auswahl' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', CLOSED: 'Geschlossen' };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-blue-100 text-blue-700',
};

export function SurveyDetailPage() {
  const { id } = useParams();
  const { data: survey, isLoading } = usePulseSurvey(id);
  const addQuestion = useAddPulseQuestion();
  const deleteQuestion = useDeletePulseQuestion();
  const updateQuestion = useUpdatePulseQuestion();
  const updateSurvey = useUpdatePulseSurvey();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: '', type: 'RATING', options: '' });
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ text: '', type: 'RATING', options: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!survey) return <div className="p-xl text-body text-kore-mid">Umfrage nicht gefunden.</div>;

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      surveyId: survey.id,
      text: form.text,
      type: form.type,
      sortOrder: (survey.questions?.length ?? 0),
    };
    if (form.type === 'CHOICE' && form.options) {
      data['options'] = form.options;
    }
    addQuestion.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ text: '', type: 'RATING', options: '' });
      },
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!confirm('Frage wirklich loeschen?')) return;
    deleteQuestion.mutate({ surveyId: survey.id, questionId });
  };

  const handleEditSave = (questionId: string) => {
    const data: Record<string, unknown> = {
      surveyId: survey.id,
      questionId,
      text: editForm.text,
      type: editForm.type,
    };
    if (editForm.type === 'CHOICE') {
      data['options'] = editForm.options;
    }
    updateQuestion.mutate(data, {
      onSuccess: () => setEditingQuestion(null),
    });
  };

  const handleStatusChange = (newStatus: string) => {
    updateSurvey.mutate({ id: survey.id, status: newStatus });
  };

  const canEdit = survey.status === 'DRAFT';

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/pulse-survey" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ClipboardList size={24} /> {survey.title}
          </h1>
          <div className="flex items-center gap-md mt-xs">
            <span className={`px-sm py-xs text-xs ${STATUS_COLORS[survey.status] ?? ''}`}>
              {STATUS_LABELS[survey.status] ?? survey.status}
            </span>
            {survey.startDate && survey.endDate && (
              <span className="text-body text-kore-mid">
                {new Date(survey.startDate).toLocaleDateString('de-DE')} – {new Date(survey.endDate).toLocaleDateString('de-DE')}
              </span>
            )}
            {survey.isAnonymous && <span className="text-body text-indigo-600">Anonym</span>}
            <span className="text-body text-kore-mid">{survey._count?.responses ?? 0} Antworten</span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          {survey.status === 'DRAFT' && (
            <button
              onClick={() => handleStatusChange('ACTIVE')}
              className="px-md py-sm text-small bg-emerald-600 text-kore-white hover:opacity-90"
            >
              Aktivieren
            </button>
          )}
          {survey.status === 'ACTIVE' && (
            <>
              <Link
                to={`/tools/pulse-survey/surveys/${id}/respond`}
                className="flex items-center gap-xs px-md py-sm bg-kore-brass text-kore-white text-small hover:opacity-90"
              >
                <MessageSquare size={14} /> Teilnehmen
              </Link>
              <button
                onClick={() => handleStatusChange('CLOSED')}
                className="px-md py-sm text-small bg-blue-600 text-kore-white hover:opacity-90"
              >
                Schliessen
              </button>
            </>
          )}
          {(survey.status === 'ACTIVE' || survey.status === 'CLOSED') && (
            <Link
              to={`/tools/pulse-survey/surveys/${id}/results`}
              className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
            >
              <BarChart3 size={14} /> Ergebnisse
            </Link>
          )}
        </div>
      </div>

      {/* Questions Section */}
      <div className="flex items-center justify-between mb-md">
        <h2 className="font-display text-h3 text-kore-ink">
          Fragen ({survey.questions?.length ?? 0})
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={14} /> Frage hinzufuegen
          </button>
        )}
      </div>

      {/* Add Question Form */}
      {showForm && canEdit && (
        <form onSubmit={handleAddQuestion} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Fragetext</label>
            <input
              value={form.text}
              onChange={e => setForm({ ...form, text: e.target.value })}
              className="w-full border border-kore-border px-md py-sm text-body"
              placeholder="z.B. Wie zufrieden sind Sie mit der Arbeitsatmosphaere?"
              required
            />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Fragentyp</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full border border-kore-border px-md py-sm text-body"
            >
              <option value="RATING">Bewertung (1-5)</option>
              <option value="TEXT">Freitext</option>
              <option value="CHOICE">Auswahl (Multiple Choice)</option>
            </select>
          </div>
          {form.type === 'CHOICE' && (
            <div>
              <label className="block text-small text-kore-mid mb-xs">Optionen (kommagetrennt)</label>
              <input
                value={form.options}
                onChange={e => setForm({ ...form, options: e.target.value })}
                placeholder="Sehr zufrieden, Zufrieden, Neutral, Unzufrieden, Sehr unzufrieden"
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
          )}
          <div className="flex items-center gap-md">
            <button
              type="submit"
              disabled={addQuestion.isPending}
              className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              Frage hinzufuegen
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-md py-sm border border-kore-border text-kore-mid text-small hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Question List */}
      {!survey.questions?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid mb-xl">
          Noch keine Fragen definiert. Fuegen Sie Fragen hinzu, um die Umfrage nutzen zu koennen.
        </div>
      ) : (
        <div className="space-y-sm mb-xl">
          {survey.questions.map((q: any, i: number) => (
            <div key={q.id} className="bg-kore-white border border-kore-border p-md">
              {editingQuestion === q.id ? (
                /* Edit mode */
                <div className="space-y-md">
                  <input
                    value={editForm.text}
                    onChange={e => setEditForm({ ...editForm, text: e.target.value })}
                    className="w-full border border-kore-border px-md py-sm text-body"
                  />
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                    className="border border-kore-border px-md py-sm text-small"
                  >
                    <option value="RATING">Bewertung (1-5)</option>
                    <option value="TEXT">Freitext</option>
                    <option value="CHOICE">Auswahl</option>
                  </select>
                  {editForm.type === 'CHOICE' && (
                    <input
                      value={editForm.options}
                      onChange={e => setEditForm({ ...editForm, options: e.target.value })}
                      placeholder="Optionen (kommagetrennt)"
                      className="w-full border border-kore-border px-md py-sm text-body"
                    />
                  )}
                  <div className="flex items-center gap-sm">
                    <button
                      onClick={() => handleEditSave(q.id)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="text-kore-mid hover:text-kore-ink"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-sm">
                    <GripVertical size={16} className="text-kore-faint mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-kore-ink">{i + 1}. {q.text}</span>
                      <div className="flex items-center gap-md mt-xs">
                        <span className="text-small text-kore-mid">{QUESTION_TYPES[q.type] ?? q.type}</span>
                        {q.type === 'CHOICE' && q.options && (
                          <div className="flex gap-xs flex-wrap">
                            {q.options.split(',').map((o: string, j: number) => (
                              <span key={j} className="px-xs py-0.5 bg-kore-bg text-xs text-kore-mid">
                                {o.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-xs flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingQuestion(q.id);
                          setEditForm({ text: q.text, type: q.type, options: q.options || '' });
                        }}
                        className="text-kore-mid hover:text-kore-ink p-xs"
                        title="Bearbeiten"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-kore-mid hover:text-red-600 p-xs"
                        title="Loeschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Survey Info */}
      <div className="bg-kore-white border border-kore-border p-lg">
        <h3 className="font-display text-h3 text-kore-ink mb-md">Umfrage-Details</h3>
        <div className="grid grid-cols-2 gap-md text-small">
          <div>
            <span className="text-kore-mid">Status</span>
            <div className="font-medium text-kore-ink mt-xs">{STATUS_LABELS[survey.status] ?? survey.status}</div>
          </div>
          <div>
            <span className="text-kore-mid">Anonymitaet</span>
            <div className="font-medium text-kore-ink mt-xs">{survey.isAnonymous ? 'Ja' : 'Nein'}</div>
          </div>
          <div>
            <span className="text-kore-mid">Zeitraum</span>
            <div className="font-medium text-kore-ink mt-xs">
              {survey.startDate && survey.endDate
                ? `${new Date(survey.startDate).toLocaleDateString('de-DE')} – ${new Date(survey.endDate).toLocaleDateString('de-DE')}`
                : 'Nicht festgelegt'}
            </div>
          </div>
          <div>
            <span className="text-kore-mid">Erstellt am</span>
            <div className="font-medium text-kore-ink mt-xs">
              {new Date(survey.createdAt).toLocaleDateString('de-DE')}
            </div>
          </div>
          <div>
            <span className="text-kore-mid">Fragen</span>
            <div className="font-medium text-kore-ink mt-xs">{survey.questions?.length ?? 0}</div>
          </div>
          <div>
            <span className="text-kore-mid">Antworten</span>
            <div className="font-medium text-kore-ink mt-xs">{survey._count?.responses ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
