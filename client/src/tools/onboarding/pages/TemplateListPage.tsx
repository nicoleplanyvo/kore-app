import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, List } from 'lucide-react';
import { useOnboardingTemplates, useCreateOnboardingTemplate } from '../../../hooks/useOnboarding';

export function TemplateListPage() {
  const { data: templates, isLoading } = useOnboardingTemplates();
  const createTemplate = useCreateOnboardingTemplate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', durationDays: 30, isDefault: false, steps: [] as any[] });
  const [stepForm, setStepForm] = useState({ title: '', description: '', category: '', dayNumber: 1, sortOrder: 0, isRequired: true });

  const addStep = () => {
    setForm({ ...form, steps: [...form.steps, { ...stepForm, sortOrder: form.steps.length }] });
    setStepForm({ title: '', description: '', category: '', dayNumber: 1, sortOrder: 0, isRequired: true });
  };

  const handleCreate = () => {
    createTemplate.mutate(form, {
      onSuccess: () => { setShowCreate(false); setForm({ name: '', role: '', durationDays: 30, isDefault: false, steps: [] }); },
    });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/onboarding" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Onboarding Templates</h1>
          <p className="text-body text-kore-mid mt-xs">Vorlagen für Einarbeitungspläne</p>
        </div>
      </div>

      <div className="mb-xl">
        <button onClick={() => setShowCreate(true)} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs">
          <Plus size={14} /> Neues Template
        </button>
      </div>

      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neues Template</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input placeholder="Rolle (z.B. Sales Associate)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="number" placeholder="Dauer (Tage)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })} className="border border-kore-border px-md py-sm text-small" />
            <label className="flex items-center gap-xs text-small"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Standard-Template</label>
          </div>

          <h4 className="font-medium text-kore-ink mb-sm text-small">Schritte ({form.steps.length})</h4>
          {form.steps.map((s, i) => (
            <div key={i} className="text-small text-kore-mid mb-xs">
              Tag {s.dayNumber}: {s.title} {s.isRequired && <span className="text-amber-600">(Pflicht)</span>}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-sm mb-md mt-sm">
            <input placeholder="Schritt-Titel" value={stepForm.title} onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })} className="border border-kore-border px-sm py-xs text-small" />
            <input type="number" placeholder="Tag" value={stepForm.dayNumber} onChange={(e) => setStepForm({ ...stepForm, dayNumber: Number(e.target.value) })} className="border border-kore-border px-sm py-xs text-small" />
            <button onClick={addStep} disabled={!stepForm.title} className="px-sm py-xs border border-kore-border text-small hover:bg-kore-bg disabled:opacity-40">+ Hinzufügen</button>
          </div>

          <div className="flex gap-sm">
            <button onClick={handleCreate} disabled={!form.name || createTemplate.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small disabled:opacity-50">Erstellen</button>
            <button onClick={() => setShowCreate(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !templates?.length ? (
        <div className="text-body text-kore-mid">Keine Templates vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-sm">
                <h3 className="font-medium text-kore-ink flex items-center gap-xs"><FileText size={16} /> {t.name}</h3>
                {t.isDefault && <span className="text-small text-emerald-600 font-medium">Standard</span>}
              </div>
              <div className="flex gap-lg text-small text-kore-mid">
                {t.role && <span>Rolle: {t.role}</span>}
                <span>{t.durationDays} Tage</span>
                <span className="flex items-center gap-xs"><List size={12} /> {t._count?.steps ?? 0} Schritte</span>
                <span>{t._count?.journeys ?? 0} Journeys</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
