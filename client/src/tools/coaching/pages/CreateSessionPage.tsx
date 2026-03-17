import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Save } from 'lucide-react';
import {
  useCoachingStores,
  useCoachingUsers,
  useCoachingTemplates,
  useCreateCoachingSession,
} from '../../../hooks/useCoaching';

const TOPICS = ['Verkauf', 'Kundenservice', 'Fuehrung', 'Produktwissen', 'Soft Skills'];

const GROW_SECTIONS = [
  { key: 'goalText', label: 'Goal (Ziel)', placeholder: 'Was moechten Sie in dieser Session erreichen?' },
  { key: 'realityText', label: 'Reality (Realitaet)', placeholder: 'Wie ist die aktuelle Situation?' },
  { key: 'optionsText', label: 'Options (Optionen)', placeholder: 'Welche Moeglichkeiten gibt es?' },
  { key: 'wayForwardText', label: 'Way Forward (Weg)', placeholder: 'Welche konkreten Schritte werden unternommen?' },
];

const SMART_SECTIONS = [
  { key: 'goalText', label: 'Specific (Spezifisch)', placeholder: 'Was genau soll erreicht werden?' },
  { key: 'realityText', label: 'Measurable (Messbar)', placeholder: 'Woran messen wir den Erfolg?' },
  { key: 'optionsText', label: 'Achievable (Erreichbar)', placeholder: 'Ist das Ziel realistisch erreichbar?' },
  { key: 'wayForwardText', label: 'Relevant (Relevant)', placeholder: 'Warum ist dieses Ziel wichtig?' },
  { key: 'timelineText', label: 'Time-bound (Terminiert)', placeholder: 'Bis wann soll das Ziel erreicht werden?' },
];

export function CreateSessionPage() {
  const navigate = useNavigate();
  const { data: stores } = useCoachingStores();
  const { data: users } = useCoachingUsers();
  const { data: templates } = useCoachingTemplates();
  const create = useCreateCoachingSession();

  const [form, setForm] = useState({
    storeId: '',
    coacheeId: '',
    scheduledAt: '',
    duration: 30,
    type: 'REGULAR',
    framework: 'GROW',
    topic: '',
    category: '',
    goalText: '',
    realityText: '',
    optionsText: '',
    wayForwardText: '',
    timelineText: '',
    notes: '',
    templateId: '',
  });

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const applyTemplate = (templateId: string) => {
    set('templateId', templateId);
    if (!templateId) return;
    const tpl = (templates ?? []).find((t: any) => t.id === templateId);
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      templateId,
      framework: tpl.framework ?? f.framework,
      topic: tpl.topic ?? f.topic,
      category: tpl.category ?? f.category,
      goalText: tpl.goalText ?? f.goalText,
      realityText: tpl.realityText ?? f.realityText,
      optionsText: tpl.optionsText ?? f.optionsText,
      wayForwardText: tpl.wayForwardText ?? f.wayForwardText,
      timelineText: tpl.timelineText ?? f.timelineText,
      notes: tpl.notes ?? f.notes,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, duration: Number(form.duration) },
      { onSuccess: () => navigate('/tools/coaching') },
    );
  };

  const sections = form.framework === 'SMART' ? SMART_SECTIONS : form.framework === 'GROW' ? GROW_SECTIONS : [];

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/coaching" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <MessageSquare size={24} /> Neue Coaching-Session
          </h1>
          <p className="text-body text-kore-mid mt-xs">Session planen und Framework waehlen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Grunddaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Store *</label>
              <select value={form.storeId} onChange={(e) => set('storeId', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required>
                <option value="">Store waehlen...</option>
                {(stores ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Coachee *</label>
              <select value={form.coacheeId} onChange={(e) => set('coacheeId', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required>
                <option value="">Mitarbeiter waehlen...</option>
                {(users ?? []).map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Termin *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => set('scheduledAt', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Dauer (Minuten)</label>
              <input type="number" value={form.duration} onChange={(e) => set('duration', e.target.value)} min={5} max={480} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Typ</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="REGULAR">Regulaer</option>
                <option value="AD_HOC">Ad-hoc</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Framework *</label>
              <select value={form.framework} onChange={(e) => set('framework', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="GROW">GROW (Goal, Reality, Options, Way forward)</option>
                <option value="SMART">SMART (Specific, Measurable, Achievable, Relevant, Time-bound)</option>
                <option value="FREE">Frei (ohne Framework)</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Thema</label>
              <select value={form.topic} onChange={(e) => set('topic', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="">Kein Thema</option>
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kategorie</label>
              <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Optional" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
        </div>

        {/* Template Selection */}
        {templates && templates.length > 0 && (
          <div className="bg-kore-white border border-kore-border p-lg mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-md">Vorlage anwenden</h2>
            <select value={form.templateId} onChange={(e) => applyTemplate(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
              <option value="">Keine Vorlage</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.framework}){t.topic ? ` - ${t.topic}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {/* Framework Sections */}
        {sections.length > 0 && (
          <div className="space-y-md mb-xl">
            {sections.map((section) => (
              <div key={section.key} className="bg-kore-white border border-kore-border p-lg">
                <h2 className="font-display text-h3 text-kore-ink mb-xs">{section.label}</h2>
                <textarea
                  value={(form as any)[section.key]}
                  onChange={(e) => set(section.key, e.target.value)}
                  rows={3}
                  placeholder={section.placeholder}
                  className="w-full border border-kore-border px-md py-sm text-body"
                />
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Notizen</h2>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} placeholder="Allgemeine Notizen zur Session..." className="w-full border border-kore-border px-md py-sm text-body" />
        </div>

        {/* Submit */}
        <div className="flex gap-sm">
          <button
            type="submit"
            disabled={create.isPending}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Save size={16} /> {create.isPending ? 'Erstellen...' : 'Session erstellen'}
          </button>
          <Link to="/tools/coaching" className="px-lg py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            Abbrechen
          </Link>
        </div>

        {create.isError && (
          <div className="mt-md p-md bg-red-50 border border-red-200 text-red-700 text-small">
            Fehler: {(create.error as Error).message}
          </div>
        )}
      </form>
    </div>
  );
}
