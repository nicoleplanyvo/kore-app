import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, ClipboardCheck, Save, CheckCircle2, Target, Plus, Trash2 } from 'lucide-react';
import { useAppraisal, useUpdateAppraisal, useSubmitSelfAssessment, useCompleteAppraisal } from '../../../hooks/useAppraisals';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Entwurf',
  SELF_REVIEW: 'Selbsteinschaetzung',
  MANAGER_REVIEW: 'Durchgefuehrt',
  COMPLETED: 'Abgeschlossen',
};

const RATING_LABELS: Record<number, string> = {
  5: 'Uebertrifft Erwartungen',
  4: 'Erreicht voll',
  3: 'Erreicht',
  2: 'Teilweise erreicht',
  1: 'Nicht erreicht',
};

interface CategoryRating {
  name: string;
  managerRating: number | null;
  selfRating: number | null;
  comment: string;
  selfComment?: string;
}

interface SmartGoal {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

export function AppraisalDetailPage() {
  const { id } = useParams();
  const { data: appraisal, isLoading } = useAppraisal(id);
  const update = useUpdateAppraisal();
  const submitSelf = useSubmitSelfAssessment();
  const complete = useCompleteAppraisal();

  const [editing, setEditing] = useState(false);
  const [selfMode, setSelfMode] = useState(false);
  const [categories, setCategories] = useState<CategoryRating[]>([]);
  const [smartGoals, setSmartGoals] = useState<SmartGoal[]>([]);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!appraisal) return <div className="p-xl text-body text-kore-mid">Beurteilung nicht gefunden.</div>;

  const detail = appraisal.parsedDetail || {};
  const isCompleted = appraisal.status === 'COMPLETED';

  const startEdit = () => {
    setCategories(detail.categories?.map((c: CategoryRating) => ({ ...c })) || []);
    setSmartGoals(detail.smartGoals?.map((g: SmartGoal) => ({ ...g })) || []);
    setStrengths(appraisal.strengths || '');
    setImprovements(appraisal.improvements || '');
    setEditing(true);
    setSelfMode(false);
  };

  const startSelfAssessment = () => {
    setCategories(detail.categories?.map((c: CategoryRating) => ({ ...c })) || []);
    setSelfMode(true);
    setEditing(false);
  };

  const handleSave = () => {
    update.mutate({
      id: appraisal.id,
      categories,
      smartGoals,
      strengths,
      improvements,
    }, { onSuccess: () => setEditing(false) });
  };

  const handleSelfSubmit = () => {
    submitSelf.mutate({
      id: appraisal.id,
      categories: categories.map(c => ({ name: c.name, selfRating: c.selfRating, selfComment: c.selfComment || '' })),
    }, { onSuccess: () => setSelfMode(false) });
  };

  const handleComplete = () => {
    if (confirm('Beurteilung abschliessen? Dies kann nicht rueckgaengig gemacht werden.')) {
      complete.mutate(appraisal.id);
    }
  };

  const updateCategory = (idx: number, field: string, value: unknown) => {
    setCategories(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const addGoal = () => {
    setSmartGoals(prev => [...prev, { title: '', specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' }]);
  };

  const removeGoal = (idx: number) => {
    setSmartGoals(prev => prev.filter((_, i) => i !== idx));
  };

  const updateGoal = (idx: number, field: string, value: string) => {
    setSmartGoals(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  const renderRatingSelect = (value: number | null, onChange: (v: number | null) => void, disabled = false) => (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      disabled={disabled}
      className="border border-kore-border px-md py-sm text-body bg-kore-white disabled:opacity-50 w-full"
    >
      <option value="">--</option>
      {[5, 4, 3, 2, 1].map(v => (
        <option key={v} value={v}>{v} - {RATING_LABELS[v]}</option>
      ))}
    </select>
  );

  const renderRatingBadge = (value: number | null) => {
    if (value == null) return <span className="text-small text-kore-faint">--</span>;
    const colors: Record<number, string> = {
      5: 'bg-emerald-100 text-emerald-700',
      4: 'bg-emerald-50 text-emerald-600',
      3: 'bg-kore-bg text-kore-ink',
      2: 'bg-amber-100 text-amber-700',
      1: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-sm py-xs text-small ${colors[value] || 'bg-kore-bg text-kore-mid'}`}>
        {value}/5 - {RATING_LABELS[value] ?? ''}
      </span>
    );
  };

  const displayCategories: CategoryRating[] = detail.categories || [];

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/appraisals" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ClipboardCheck size={24} /> Beurteilung
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {appraisal.employee?.name ?? 'Unbekannt'} -- {STATUS_LABELS[appraisal.status] ?? appraisal.status}
            {appraisal.cycle && ` -- ${appraisal.cycle.name}`}
          </p>
        </div>
        {!isCompleted && !editing && !selfMode && (
          <div className="flex gap-sm">
            {appraisal.status === 'SELF_REVIEW' && !detail.selfAssessmentCompleted && (
              <button onClick={startSelfAssessment} className="px-md py-sm border border-amber-300 bg-amber-50 text-amber-700 text-small hover:bg-amber-100 transition-colors">
                Selbsteinschaetzung
              </button>
            )}
            <button onClick={startEdit} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-colors">
              Bearbeiten
            </button>
            {appraisal.status === 'MANAGER_REVIEW' && (
              <button onClick={handleComplete} className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:bg-emerald-700 transition-colors">
                <CheckCircle2 size={14} /> Abschliessen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Meta Info */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div>
            <span className="text-small text-kore-mid uppercase tracking-widest">Mitarbeiter</span>
            <p className="text-body text-kore-ink mt-xs">{appraisal.employee?.name ?? '--'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid uppercase tracking-widest">Manager</span>
            <p className="text-body text-kore-ink mt-xs">{appraisal.manager?.name ?? '--'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid uppercase tracking-widest">Store</span>
            <p className="text-body text-kore-ink mt-xs">{appraisal.store?.name ?? '--'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid uppercase tracking-widest">Gesamtbewertung</span>
            <div className="mt-xs">{renderRatingBadge(appraisal.overallRating)}</div>
          </div>
        </div>
      </div>

      {/* Self-Assessment Mode */}
      {selfMode && (
        <div className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Selbsteinschaetzung</h2>
          <p className="text-body text-kore-mid mb-lg">Bitte bewerten Sie sich selbst in jeder Kategorie (1-5).</p>
          <div className="space-y-md">
            {categories.map((cat, idx) => (
              <div key={cat.name} className="bg-kore-white border border-kore-border p-lg">
                <div className="flex items-center justify-between mb-md">
                  <span className="font-medium text-kore-ink">{cat.name}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div>
                    <label className="block text-small text-kore-mid mb-xs">Bewertung</label>
                    {renderRatingSelect(cat.selfRating, v => updateCategory(idx, 'selfRating', v))}
                  </div>
                  <div>
                    <label className="block text-small text-kore-mid mb-xs">Kommentar</label>
                    <input
                      value={cat.selfComment || ''}
                      onChange={e => updateCategory(idx, 'selfComment', e.target.value)}
                      className="w-full border border-kore-border px-md py-sm text-body"
                      placeholder="Optionaler Freitext..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-sm mt-lg">
            <button
              onClick={handleSelfSubmit}
              disabled={submitSelf.isPending}
              className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
            >
              <Save size={14} /> {submitSelf.isPending ? 'Sende...' : 'Selbsteinschaetzung absenden'}
            </button>
            <button onClick={() => setSelfMode(false)} className="px-xl py-md-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Category Ratings — View or Edit */}
      {!selfMode && (
        <div className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Kategorien-Bewertung</h2>
          <div className="space-y-md">
            {(editing ? categories : displayCategories).map((cat, idx) => (
              <div key={cat.name} className="bg-kore-white border border-kore-border p-lg">
                <h3 className="font-medium text-kore-ink mb-md">{cat.name}</h3>

                {/* Side-by-side if self-assessment exists */}
                <div className={`grid gap-md ${detail.selfAssessmentCompleted ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Manager Rating */}
                  <div>
                    <label className="block text-small text-kore-mid mb-xs uppercase tracking-widest">Manager-Bewertung</label>
                    {editing ? (
                      <>
                        {renderRatingSelect(cat.managerRating, v => updateCategory(idx, 'managerRating', v))}
                        <label className="block text-small text-kore-mid mb-xs mt-md">Freitext</label>
                        <textarea
                          value={cat.comment || ''}
                          onChange={e => updateCategory(idx, 'comment', e.target.value)}
                          rows={2}
                          className="w-full border border-kore-border px-md py-sm text-body"
                          placeholder="Optionaler Kommentar..."
                        />
                      </>
                    ) : (
                      <>
                        <div className="mt-xs">{renderRatingBadge(cat.managerRating)}</div>
                        {cat.comment && <p className="text-small text-kore-mid mt-sm">{cat.comment}</p>}
                      </>
                    )}
                  </div>

                  {/* Self Rating (side-by-side comparison) */}
                  {detail.selfAssessmentCompleted && (
                    <div className="border-l border-kore-border pl-md">
                      <label className="block text-small text-kore-mid mb-xs uppercase tracking-widest">Selbsteinschaetzung</label>
                      <div className="mt-xs">{renderRatingBadge(cat.selfRating)}</div>
                      {cat.selfComment && <p className="text-small text-kore-mid mt-sm">{cat.selfComment}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SMART Goals */}
      {!selfMode && (
        <div className="mb-xl">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm">
              <Target size={20} /> SMART-Ziele
            </h2>
            {editing && (
              <button onClick={addGoal} className="flex items-center gap-xs text-small text-kore-ink hover:text-kore-brass transition-colors">
                <Plus size={14} /> Ziel hinzufuegen
              </button>
            )}
          </div>

          {(editing ? smartGoals : (detail.smartGoals || [])).length === 0 ? (
            <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">
              Keine SMART-Ziele definiert.
            </div>
          ) : (
            <div className="space-y-md">
              {(editing ? smartGoals : (detail.smartGoals || [])).map((goal: SmartGoal, idx: number) => (
                <div key={idx} className="bg-kore-white border border-kore-border p-lg">
                  {editing ? (
                    <>
                      <div className="flex items-center justify-between mb-md">
                        <input
                          value={goal.title}
                          onChange={e => updateGoal(idx, 'title', e.target.value)}
                          placeholder="Zieltitel"
                          className="flex-1 border border-kore-border px-md py-sm text-body font-medium"
                        />
                        <button onClick={() => removeGoal(idx)} className="ml-md text-kore-mid hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                        {(['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as const).map(field => {
                          const labels: Record<string, string> = {
                            specific: 'Spezifisch (S)',
                            measurable: 'Messbar (M)',
                            achievable: 'Erreichbar (A)',
                            relevant: 'Relevant (R)',
                            timeBound: 'Terminiert (T)',
                          };
                          return (
                            <div key={field}>
                              <label className="block text-small text-kore-mid mb-xs">{labels[field]}</label>
                              <input
                                value={goal[field]}
                                onChange={e => updateGoal(idx, field, e.target.value)}
                                className="w-full border border-kore-border px-md py-sm text-body"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-medium text-kore-ink mb-sm">{goal.title || `Ziel ${idx + 1}`}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm text-small">
                        {goal.specific && <div><span className="text-kore-mid">S:</span> <span className="text-kore-ink">{goal.specific}</span></div>}
                        {goal.measurable && <div><span className="text-kore-mid">M:</span> <span className="text-kore-ink">{goal.measurable}</span></div>}
                        {goal.achievable && <div><span className="text-kore-mid">A:</span> <span className="text-kore-ink">{goal.achievable}</span></div>}
                        {goal.relevant && <div><span className="text-kore-mid">R:</span> <span className="text-kore-ink">{goal.relevant}</span></div>}
                        {goal.timeBound && <div><span className="text-kore-mid">T:</span> <span className="text-kore-ink">{goal.timeBound}</span></div>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Strengths / Improvements */}
      {!selfMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
          <div className="bg-kore-white border border-kore-border p-lg">
            <h3 className="font-display text-h3 text-kore-ink mb-sm">Staerken</h3>
            {editing ? (
              <textarea value={strengths} onChange={e => setStrengths(e.target.value)} rows={4} className="w-full border border-kore-border px-md py-sm text-body" />
            ) : (
              <p className="text-body text-kore-mid whitespace-pre-wrap">{appraisal.strengths || '--'}</p>
            )}
          </div>
          <div className="bg-kore-white border border-kore-border p-lg">
            <h3 className="font-display text-h3 text-kore-ink mb-sm">Verbesserungsbereiche</h3>
            {editing ? (
              <textarea value={improvements} onChange={e => setImprovements(e.target.value)} rows={4} className="w-full border border-kore-border px-md py-sm text-body" />
            ) : (
              <p className="text-body text-kore-mid whitespace-pre-wrap">{appraisal.improvements || '--'}</p>
            )}
          </div>
        </div>
      )}

      {/* Save / Cancel (editing) */}
      {editing && (
        <div className="flex gap-sm">
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Save size={14} /> {update.isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button onClick={() => setEditing(false)} className="px-xl py-md-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors">
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
}
