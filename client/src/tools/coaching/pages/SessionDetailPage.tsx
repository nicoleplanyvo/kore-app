import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, MessageSquare, Save, Trash2, FileText } from 'lucide-react';
import { useCoachingSession, useUpdateCoachingSession, useDeleteCoachingSession, useCreateCoachingTemplate } from '../../../hooks/useCoaching';

const TYPE_LABELS: Record<string, string> = { REGULAR: 'Regulaer', AD_HOC: 'Ad-hoc', FOLLOW_UP: 'Follow-up' };
const STATUS_LABELS: Record<string, string> = { SCHEDULED: 'Geplant', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };
const FRAMEWORK_LABELS: Record<string, string> = { GROW: 'GROW', SMART: 'SMART', FREE: 'Frei' };
const TOPICS = ['Verkauf', 'Kundenservice', 'Fuehrung', 'Produktwissen', 'Soft Skills'];

const GROW_SECTIONS = [
  { key: 'goalText', label: 'Goal (Ziel)', description: 'Was moechten Sie in dieser Session erreichen?' },
  { key: 'realityText', label: 'Reality (Realitaet)', description: 'Wie ist die aktuelle Situation?' },
  { key: 'optionsText', label: 'Options (Optionen)', description: 'Welche Moeglichkeiten gibt es?' },
  { key: 'wayForwardText', label: 'Way Forward (Weg)', description: 'Welche konkreten Schritte werden unternommen?' },
];

const SMART_SECTIONS = [
  { key: 'goalText', label: 'Specific (Spezifisch)', description: 'Was genau soll erreicht werden?' },
  { key: 'realityText', label: 'Measurable (Messbar)', description: 'Woran messen wir den Erfolg?' },
  { key: 'optionsText', label: 'Achievable (Erreichbar)', description: 'Ist das Ziel realistisch erreichbar?' },
  { key: 'wayForwardText', label: 'Relevant (Relevant)', description: 'Warum ist dieses Ziel wichtig?' },
  { key: 'timelineText', label: 'Time-bound (Terminiert)', description: 'Bis wann soll das Ziel erreicht werden?' },
];

export function SessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: session, isLoading } = useCoachingSession(id);
  const update = useUpdateCoachingSession();
  const remove = useDeleteCoachingSession();
  const saveTemplate = useCreateCoachingTemplate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!session) return <div className="p-xl text-body text-kore-mid">Session nicht gefunden.</div>;

  const framework = form?.framework ?? session.framework ?? 'GROW';
  const sections = framework === 'SMART' ? SMART_SECTIONS : framework === 'GROW' ? GROW_SECTIONS : [];

  const startEdit = () => {
    setForm({
      status: session.status,
      framework: session.framework ?? 'GROW',
      topic: session.topic ?? '',
      category: session.category ?? '',
      goalText: session.goalText ?? '',
      realityText: session.realityText ?? '',
      optionsText: session.optionsText ?? '',
      wayForwardText: session.wayForwardText ?? '',
      timelineText: session.timelineText ?? '',
      notes: session.notes ?? '',
      actionItems: session.actionItems ?? '',
      mood: session.mood ?? '',
      duration: session.duration ?? 30,
    });
    setEditing(true);
  };

  const handleSave = () => {
    update.mutate(
      {
        id: session.id,
        ...form,
        mood: form.mood ? Number(form.mood) : null,
        duration: form.duration ? Number(form.duration) : null,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  const handleDelete = () => {
    if (!confirm('Session wirklich loeschen?')) return;
    remove.mutate(session.id, { onSuccess: () => navigate('/tools/coaching') });
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim()) return;
    saveTemplate.mutate(
      {
        name: templateName,
        framework: session.framework ?? 'GROW',
        topic: session.topic,
        category: session.category,
        goalText: session.goalText,
        realityText: session.realityText,
        optionsText: session.optionsText,
        wayForwardText: session.wayForwardText,
        timelineText: session.timelineText,
        notes: session.notes,
      },
      { onSuccess: () => { setShowSaveTemplate(false); setTemplateName(''); } },
    );
  };

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/coaching" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <MessageSquare size={24} /> Coaching-Session
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {session.coachee?.name ?? 'Unbekannt'} mit {session.coach?.name ?? '--'} &middot; {TYPE_LABELS[session.type] ?? session.type}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {!editing && (
            <>
              <button onClick={() => setShowSaveTemplate(true)} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
                <FileText size={14} /> Als Vorlage
              </button>
              <button onClick={startEdit} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
                Bearbeiten
              </button>
              <button onClick={handleDelete} className="px-md py-sm border border-red-300 text-red-600 text-small hover:bg-red-50">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save as Template Dialog */}
      {showSaveTemplate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-display text-h3 text-kore-ink mb-md">Session als Vorlage speichern</h3>
          <div className="flex gap-md">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Vorlagen-Name"
              className="flex-1 border border-kore-border px-md py-sm text-body"
            />
            <button
              onClick={handleSaveAsTemplate}
              disabled={saveTemplate.isPending || !templateName.trim()}
              className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {saveTemplate.isPending ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={() => setShowSaveTemplate(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Meta Info */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Termin</span>
            <p className="text-body text-kore-ink">{new Date(session.scheduledAt).toLocaleString('de-DE')}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">Status</span>
            {editing ? (
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="SCHEDULED">Geplant</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="CANCELLED">Abgebrochen</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{STATUS_LABELS[session.status] ?? session.status}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Framework</span>
            {editing ? (
              <select value={form.framework} onChange={(e) => set('framework', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="GROW">GROW</option>
                <option value="SMART">SMART</option>
                <option value="FREE">Frei</option>
              </select>
            ) : (
              <p className="text-body text-kore-ink">{FRAMEWORK_LABELS[session.framework] ?? session.framework ?? 'GROW'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Dauer (Min.)</span>
            {editing ? (
              <input type="number" value={form.duration} onChange={(e) => set('duration', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body mt-xs" />
            ) : (
              <p className="text-body text-kore-ink">{session.duration ?? '--'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Thema</span>
            {editing ? (
              <div className="mt-xs">
                <select value={form.topic} onChange={(e) => set('topic', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                  <option value="">Kein Thema</option>
                  {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <p className="text-body text-kore-ink">{session.topic || '--'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Kategorie</span>
            {editing ? (
              <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Optional" className="w-full border border-kore-border px-md py-sm text-body mt-xs" />
            ) : (
              <p className="text-body text-kore-ink">{session.category || '--'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Stimmung</span>
            {editing ? (
              <select value={form.mood} onChange={(e) => set('mood', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body mt-xs">
                <option value="">--</option>
                {[1, 2, 3, 4, 5].map((v) => <option key={v} value={v}>{v}/5</option>)}
              </select>
            ) : (
              <p className="text-body text-kore-ink">{session.mood ? `${session.mood}/5` : '--'}</p>
            )}
          </div>
          <div>
            <span className="text-small text-kore-mid">Store</span>
            <p className="text-body text-kore-ink">{session.store?.name ?? '--'}</p>
          </div>
        </div>
      </div>

      {/* Framework Sections */}
      {(editing ? (form.framework !== 'FREE' ? (form.framework === 'SMART' ? SMART_SECTIONS : GROW_SECTIONS) : []) : (session.framework !== 'FREE' ? sections : [])).map((section) => (
        <div key={section.key} className="bg-kore-white border border-kore-border p-lg mb-md">
          <h2 className="font-display text-h3 text-kore-ink mb-xs">{section.label}</h2>
          <p className="text-small text-kore-faint mb-md">{section.description}</p>
          {editing ? (
            <textarea
              value={form[section.key] ?? ''}
              onChange={(e) => set(section.key, e.target.value)}
              rows={4}
              className="w-full border border-kore-border px-md py-sm text-body"
              placeholder={section.description}
            />
          ) : (
            <p className="text-body text-kore-mid whitespace-pre-wrap">
              {(session as any)[section.key] || 'Noch nicht ausgefuellt.'}
            </p>
          )}
        </div>
      ))}

      {/* Notes */}
      <div className="bg-kore-white border border-kore-border p-lg mb-md">
        <h2 className="font-display text-h3 text-kore-ink mb-md">Notizen</h2>
        {editing ? (
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={5} className="w-full border border-kore-border px-md py-sm text-body" />
        ) : (
          <p className="text-body text-kore-mid whitespace-pre-wrap">{session.notes || 'Keine Notizen.'}</p>
        )}
      </div>

      {/* Action Items */}
      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <h2 className="font-display text-h3 text-kore-ink mb-md">Action Items</h2>
        {editing ? (
          <textarea value={form.actionItems} onChange={(e) => set('actionItems', e.target.value)} rows={4} className="w-full border border-kore-border px-md py-sm text-body" />
        ) : (
          <p className="text-body text-kore-mid whitespace-pre-wrap">{session.actionItems || 'Keine Action Items.'}</p>
        )}
      </div>

      {/* Follow-up */}
      {session.followUpDate && !editing && (
        <div className="bg-blue-50 border border-blue-200 p-md text-body text-blue-700 mb-xl">
          Follow-up geplant: {new Date(session.followUpDate).toLocaleDateString('de-DE')}
        </div>
      )}

      {/* Save / Cancel */}
      {editing && (
        <div className="flex gap-sm mt-xl">
          <button
            onClick={handleSave}
            disabled={update.isPending}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
          >
            <Save size={14} /> {update.isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button onClick={() => setEditing(false)} className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink">
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
}
