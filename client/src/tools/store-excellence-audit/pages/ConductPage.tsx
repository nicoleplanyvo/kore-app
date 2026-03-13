import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { api, apiUpload, API_URL } from '../../../lib/api';
import { PassFailToggle } from '../components/PassFailToggle';
import { PhotoUploader } from '../components/PhotoUploader';
import type { AuditSession, AuditCategory, AuditCriterion, AuditResponse } from '@shared/types';

interface CriterionState {
  criterionId: string;
  scorePercent: number | null;
  passed: boolean | null;
  comment: string;
  photoPath: string | null;
  saving: boolean;
}

export function ConductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<AuditSession | null>(null);
  const [categories, setCategories] = useState<AuditCategory[]>([]);
  const [currentCatIdx, setCurrentCatIdx] = useState(0);
  const [responses, setResponses] = useState<Map<string, CriterionState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    api<AuditSession>(`/api/tools/sea/sessions/${id}`)
      .then((data) => {
        setSession(data);
        const cats = data.template?.categories ?? [];
        setCategories(cats);

        const resMap = new Map<string, CriterionState>();
        for (const cat of cats) {
          for (const crit of cat.criteria ?? []) {
            const existing = data.responses?.find(
              (r: AuditResponse) => r.criterionId === crit.id,
            );
            resMap.set(crit.id, {
              criterionId: crit.id,
              scorePercent: existing?.scorePercent ?? null,
              passed: existing?.passed ?? null,
              comment: existing?.comment ?? '',
              photoPath: existing?.photoPath ?? null,
              saving: false,
            });
          }
        }
        setResponses(resMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const saveResponse = useCallback(
    async (criterionId: string, updates: Partial<CriterionState>) => {
      setResponses((prev) => {
        const next = new Map(prev);
        const current = next.get(criterionId);
        if (current) next.set(criterionId, { ...current, ...updates, saving: true });
        return next;
      });

      try {
        await api(`/api/tools/sea/sessions/${id}/responses/${criterionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            scorePercent: updates.scorePercent,
            passed: updates.passed,
            comment: updates.comment,
          }),
        });
      } catch (error) {
        console.error('Response speichern fehlgeschlagen:', error);
      } finally {
        setResponses((prev) => {
          const next = new Map(prev);
          const current = next.get(criterionId);
          if (current) next.set(criterionId, { ...current, saving: false });
          return next;
        });
      }
    },
    [id],
  );

  const handlePhotoUpload = async (criterionId: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const result = await apiUpload<AuditResponse>(
        `/api/tools/sea/sessions/${id}/responses/${criterionId}/photo`,
        formData,
      );
      setResponses((prev) => {
        const next = new Map(prev);
        const current = next.get(criterionId);
        if (current) next.set(criterionId, { ...current, photoPath: result.photoPath });
        return next;
      });
    } catch (error) {
      console.error('Foto-Upload fehlgeschlagen:', error);
    }
  };

  const handlePhotoRemove = async (criterionId: string) => {
    try {
      await api(`/api/tools/sea/sessions/${id}/responses/${criterionId}/photo`, {
        method: 'DELETE',
      });
      setResponses((prev) => {
        const next = new Map(prev);
        const current = next.get(criterionId);
        if (current) next.set(criterionId, { ...current, photoPath: null });
        return next;
      });
    } catch (error) {
      console.error('Foto löschen fehlgeschlagen:', error);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api(`/api/tools/sea/sessions/${id}/complete`, {
        method: 'POST',
      });
      navigate(`/tools/sea/sessions/${id}`);
    } catch (error) {
      console.error('Audit abschließen fehlgeschlagen:', error);
      setCompleting(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="p-xl">
        <div className="text-body text-kore-mid">Lade Audit...</div>
      </div>
    );
  }

  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    navigate(`/tools/sea/sessions/${id}`);
    return null;
  }

  const currentCategory = categories[currentCatIdx];
  const criteria = currentCategory?.criteria ?? [];
  const isLastCategory = currentCatIdx === categories.length - 1;
  const isFirstCategory = currentCatIdx === 0;

  const totalCriteria = categories.reduce(
    (sum, cat) => sum + (cat.criteria?.length ?? 0),
    0,
  );
  const answeredCriteria = Array.from(responses.values()).filter(
    (r) => r.scorePercent !== null || r.passed !== null,
  ).length;
  const progressPct = totalCriteria > 0 ? Math.round((answeredCriteria / totalCriteria) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-kore-white border-b border-kore-border px-lg py-md-sm">
        <div className="flex items-center justify-between mb-sm">
          <span className="text-caption text-kore-mid uppercase tracking-widest">
            {session.template?.name}
          </span>
          <span className="text-small text-kore-mid">
            {answeredCriteria}/{totalCriteria} bewertet
          </span>
        </div>
        <div className="w-full h-1 bg-kore-border rounded-full overflow-hidden">
          <div
            className="h-full bg-kore-brass transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-sm mt-md-sm overflow-x-auto">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => setCurrentCatIdx(idx)}
              className={`whitespace-nowrap px-md-sm py-xs text-caption uppercase tracking-widest transition-colors ${
                idx === currentCatIdx
                  ? 'text-kore-brass border-b-2 border-kore-brass'
                  : 'text-kore-faint hover:text-kore-mid'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Criteria List */}
      <div className="flex-1 p-lg md:p-xl space-y-lg max-w-3xl">
        <h2 className="font-display text-h2 text-kore-ink">
          {currentCategory?.name}
        </h2>
        {currentCategory?.description && (
          <p className="text-small text-kore-mid">{currentCategory.description}</p>
        )}

        {criteria.map((criterion: AuditCriterion) => {
          const state = responses.get(criterion.id);
          if (!state) return null;

          return (
            <div
              key={criterion.id}
              className="bg-kore-white border border-kore-border p-lg space-y-md"
            >
              <div className="flex items-start justify-between gap-md">
                <div>
                  <h3 className="text-body text-kore-ink font-medium">
                    {criterion.name}
                  </h3>
                  {criterion.description && (
                    <p className="text-small text-kore-mid mt-xs">
                      {criterion.description}
                    </p>
                  )}
                </div>
                {criterion.isRequired && (
                  <span className="text-caption text-kore-brass shrink-0">Pflicht</span>
                )}
              </div>

              {/* Score Slider */}
              <div>
                <label className="label-default">
                  Score: {state.scorePercent ?? '—'}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={state.scorePercent ?? 50}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setResponses((prev) => {
                      const next = new Map(prev);
                      next.set(criterion.id, { ...state, scorePercent: val });
                      return next;
                    });
                  }}
                  onMouseUp={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    saveResponse(criterion.id, { scorePercent: val });
                  }}
                  onTouchEnd={(e) => {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    saveResponse(criterion.id, { scorePercent: val });
                  }}
                  className="w-full accent-kore-brass h-2"
                />
              </div>

              {/* Pass/Fail + Photo */}
              <div className="flex items-center gap-lg">
                <div>
                  <label className="label-default">Bestanden?</label>
                  <PassFailToggle
                    value={state.passed}
                    onChange={(val) => {
                      setResponses((prev) => {
                        const next = new Map(prev);
                        next.set(criterion.id, { ...state, passed: val });
                        return next;
                      });
                      saveResponse(criterion.id, { passed: val });
                    }}
                  />
                </div>

                <div>
                  <label className="label-default">Foto</label>
                  <PhotoUploader
                    photoUrl={
                      state.photoPath
                        ? `${API_URL}/api/uploads/${state.photoPath}`
                        : null
                    }
                    onUpload={(file) => handlePhotoUpload(criterion.id, file)}
                    onRemove={() => handlePhotoRemove(criterion.id)}
                    required={criterion.photoRequired}
                  />
                </div>
              </div>

              {/* Kommentar */}
              <div>
                <label className="label-default">Kommentar</label>
                <textarea
                  value={state.comment}
                  onChange={(e) => {
                    setResponses((prev) => {
                      const next = new Map(prev);
                      next.set(criterion.id, { ...state, comment: e.target.value });
                      return next;
                    });
                  }}
                  onBlur={() => {
                    if (state.comment) {
                      saveResponse(criterion.id, { comment: state.comment });
                    }
                  }}
                  placeholder="Optionaler Kommentar..."
                  rows={2}
                  className="input-default resize-none"
                />
              </div>

              {state.saving && (
                <span className="text-caption text-kore-faint">Speichern...</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 bg-kore-white border-t border-kore-border px-lg py-md flex items-center justify-between">
        <button
          onClick={() => setCurrentCatIdx((i) => Math.max(0, i - 1))}
          disabled={isFirstCategory}
          className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
          Zurück
        </button>

        {isLastCategory ? (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex items-center gap-sm bg-kore-success text-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <CheckCircle size={16} />
            {completing ? 'Wird abgeschlossen...' : 'Audit abschließen'}
          </button>
        ) : (
          <button
            onClick={() => setCurrentCatIdx((i) => Math.min(categories.length - 1, i + 1))}
            className="flex items-center gap-xs text-small text-kore-brass hover:text-kore-brass-dk transition-colors"
          >
            Weiter
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
