import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Plus,
  List,
  Trash2,
} from 'lucide-react';
import {
  useOnboardingTemplates,
  useCreateOnboardingTemplate,
  useDeleteOnboardingTemplate,
} from '../../../hooks/useOnboarding';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function TemplateListPage() {
  const { data: templates, isLoading } = useOnboardingTemplates();
  const createTemplate = useCreateOnboardingTemplate();
  const deleteTemplate = useDeleteOnboardingTemplate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    durationDays: 30,
    isDefault: false,
    steps: [] as any[],
  });
  const [stepForm, setStepForm] = useState({
    title: '',
    description: '',
    category: '',
    dayNumber: 1,
    sortOrder: 0,
    isRequired: true,
  });

  const addStep = () => {
    if (!stepForm.title) return;
    setForm({
      ...form,
      steps: [...form.steps, { ...stepForm, sortOrder: form.steps.length }],
    });
    setStepForm({
      title: '',
      description: '',
      category: '',
      dayNumber: stepForm.dayNumber,
      sortOrder: 0,
      isRequired: true,
    });
  };

  const removeStep = (idx: number) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== idx) });
  };

  const handleCreate = () => {
    createTemplate.mutate(form, {
      onSuccess: () => {
        setShowCreate(false);
        setForm({ name: '', role: '', durationDays: 30, isDefault: false, steps: [] });
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id);
  };

  const activeTemplates = (templates ?? []).filter((t: any) => t.isActive !== false);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/onboarding"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Onboarding Templates</h1>
          <p className="text-body text-kore-mid mt-xs">
            Vorlagen fuer Einarbeitungsplaene erstellen und verwalten
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs"
        >
          <Plus size={14} /> Neues Template
        </button>
      </div>

      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neues Template</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Name</label>
              <input
                placeholder="z.B. Standard Onboarding"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Zielrolle (optional)</label>
              <input
                placeholder="z.B. Sales Associate"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Dauer (Tage)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                className="w-full border border-kore-border px-md py-sm text-small"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-xs text-small cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                />
                Standard-Template
              </label>
            </div>
          </div>

          <h4 className="font-medium text-kore-ink mb-sm text-small">
            Schritte ({form.steps.length})
          </h4>
          {form.steps.length > 0 && (
            <div className="space-y-xs mb-md">
              {form.steps.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-sm text-small text-kore-mid border border-kore-border px-sm py-xs"
                >
                  <span className="flex-1">
                    Tag {s.dayNumber}: {s.title}
                    {s.category && ` [${s.category}]`}
                    {s.isRequired && (
                      <span className="text-amber-600 ml-xs">(Pflicht)</span>
                    )}
                  </span>
                  <button
                    onClick={() => removeStep(i)}
                    className="text-kore-mid hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-sm mb-md">
            <input
              placeholder="Schritt-Titel"
              value={stepForm.title}
              onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
              className="border border-kore-border px-sm py-xs text-small col-span-2 md:col-span-1"
            />
            <input
              placeholder="Beschreibung (optional)"
              value={stepForm.description}
              onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
              className="border border-kore-border px-sm py-xs text-small"
            />
            <input
              placeholder="Kategorie (optional)"
              value={stepForm.category}
              onChange={(e) => setStepForm({ ...stepForm, category: e.target.value })}
              className="border border-kore-border px-sm py-xs text-small"
            />
            <input
              type="number"
              placeholder="Tag"
              min={1}
              value={stepForm.dayNumber}
              onChange={(e) => setStepForm({ ...stepForm, dayNumber: Number(e.target.value) })}
              className="border border-kore-border px-sm py-xs text-small"
            />
            <div className="flex items-center gap-sm">
              <label className="flex items-center gap-xs text-small cursor-pointer">
                <input
                  type="checkbox"
                  checked={stepForm.isRequired}
                  onChange={(e) => setStepForm({ ...stepForm, isRequired: e.target.checked })}
                />
                Pflicht
              </label>
              <button
                onClick={addStep}
                disabled={!stepForm.title}
                className="px-sm py-xs border border-kore-border text-small hover:bg-kore-bg disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-sm">
            <button
              onClick={handleCreate}
              disabled={!form.name || createTemplate.isPending}
              className="px-md py-sm bg-kore-ink text-kore-white text-small disabled:opacity-50"
            >
              {createTemplate.isPending ? 'Erstelle...' : 'Erstellen'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-md py-sm border border-kore-border text-small"
            >
              Abbrechen
            </button>
          </div>
          {createTemplate.isError && (
            <p className="text-small text-red-600 mt-sm">
              {(createTemplate.error as Error).message}
            </p>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !activeTemplates.length ? (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <FileText size={36} className="text-kore-faint mx-auto mb-md" />
          <p className="text-body text-kore-mid">Keine Templates vorhanden.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 mt-md"
          >
            <Plus size={14} /> Erstes Template erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-sm">
          {activeTemplates.map((t: any) => (
            <div
              key={t.id}
              className="bg-kore-white border border-kore-border p-lg"
            >
              <div className="flex items-center justify-between mb-sm">
                <h3 className="font-medium text-kore-ink flex items-center gap-xs">
                  <FileText size={16} /> {t.name}
                </h3>
                <div className="flex items-center gap-sm">
                  {t.isDefault && (
                    <span className="text-small text-emerald-600 font-medium">Standard</span>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={deleteTemplate.isPending}
                    className="text-kore-mid hover:text-red-600 disabled:opacity-50"
                    title="Deaktivieren"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex gap-lg text-small text-kore-mid flex-wrap">
                {t.role && <span>Rolle: {t.role}</span>}
                <span>{t.durationDays} Tage</span>
                <span className="flex items-center gap-xs">
                  <List size={12} /> {t._count?.steps ?? 0} Schritte
                </span>
                <span>{t._count?.journeys ?? 0} Journeys</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
