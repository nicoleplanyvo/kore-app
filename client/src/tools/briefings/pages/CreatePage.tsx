import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreateBriefing, useBriefingStores, useBriefingCopyLast } from '../../../hooks/useBriefings';

interface Section {
  title: string;
  content: string;
  sortOrder: number;
}

export function CreatePage() {
  const navigate = useNavigate();
  const create = useCreateBriefing();
  const { data: stores } = useBriefingStores();
  const [storeId, setStoreId] = useState('');
  const copyLast = useBriefingCopyLast(storeId || undefined);

  const [title, setTitle] = useState('Tages-Briefing');
  const [type, setType] = useState('MORNING');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledFor, setScheduledFor] = useState('');
  const [sections, setSections] = useState<Section[]>([
    { title: 'Tagesziele', content: '', sortOrder: 0 },
    { title: 'Wichtige Infos', content: '', sortOrder: 1 },
    { title: 'Personalplanung', content: '', sortOrder: 2 },
  ]);

  const addSection = () => {
    setSections([...sections, { title: '', content: '', sortOrder: sections.length }]);
  };

  const removeSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i })));
  };

  const updateSection = (idx: number, field: 'title' | 'content', value: string) => {
    setSections(sections.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= sections.length) return;
    const copy = [...sections];
    const tmp = copy[idx]!;
    copy[idx] = copy[next]!;
    copy[next] = tmp;
    setSections(copy.map((s, i) => ({ ...s, sortOrder: i })));
  };

  const handleCopyLast = async () => {
    const result = await copyLast.refetch();
    if (result.data) {
      setTitle(result.data.title);
      setType(result.data.type ?? 'MORNING');
      let parsed: Section[] = [];
      try {
        parsed = typeof result.data.sections === 'string'
          ? JSON.parse(result.data.sections)
          : result.data.sections;
      } catch { /* empty */ }
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSections(parsed.map((s: any, i: number) => ({ title: s.title ?? '', content: s.content ?? '', sortOrder: i })));
      } else if (result.data.content) {
        setSections([{ title: 'Inhalt', content: result.data.content, sortOrder: 0 }]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sid = storeId || (stores && stores.length === 1 ? stores[0].id : '');
    if (!sid) return;
    const content = sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n');
    create.mutate(
      { title, type, date, storeId: sid, sections, content, scheduledFor: scheduledFor || undefined },
      { onSuccess: () => navigate('/tools/briefings') },
    );
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/briefings" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Neues Briefing erstellen</h1>
          <p className="text-body text-kore-mid mt-xs">Sektionen hinzufuegen, anordnen und planen.</p>
        </div>
        <button onClick={handleCopyLast} disabled={copyLast.isFetching} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-ink hover:border-kore-ink transition-colors disabled:opacity-50">
          <Copy size={16} /> Letztes kopieren
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl">
        {/* Meta fields */}
        <div className="bg-kore-white border border-kore-border p-lg space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Store</label>
              {stores && stores.length > 1 ? (
                <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required>
                  <option value="">Store waehlen...</option>
                  {stores.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
                  ))}
                </select>
              ) : stores && stores.length === 1 ? (
                <div className="border border-kore-border px-md py-sm text-body bg-kore-bg">{stores[0].name}</div>
              ) : (
                <div className="border border-kore-border px-md py-sm text-body text-kore-mid">Lade Stores...</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Datum</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Typ</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="MORNING">Morgen-Briefing</option>
                <option value="EVENING">Abend-Briefing</option>
                <option value="SPECIAL">Sonder-Briefing</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Geplante Veroeffentlichung</label>
              <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" placeholder="Sofort" />
              <span className="text-caption text-kore-faint mt-xs block">Leer = sofort sichtbar</span>
            </div>
          </div>
        </div>

        {/* Sections editor */}
        <div>
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-display text-h3 text-kore-ink">Sektionen</h2>
            <button type="button" onClick={addSection} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-ink hover:border-kore-ink transition-colors">
              <Plus size={16} /> Sektion hinzufuegen
            </button>
          </div>
          <div className="space-y-md">
            {sections.map((sec, idx) => (
              <div key={idx} className="bg-kore-white border border-kore-border p-lg">
                <div className="flex items-center gap-md mb-md">
                  <div className="flex flex-col gap-xs">
                    <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="text-kore-mid hover:text-kore-ink disabled:opacity-20"><GripVertical size={14} /></button>
                    <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1} className="text-kore-mid hover:text-kore-ink disabled:opacity-20"><GripVertical size={14} /></button>
                  </div>
                  <input
                    value={sec.title}
                    onChange={(e) => updateSection(idx, 'title', e.target.value)}
                    placeholder="Sektionstitel"
                    className="flex-1 border border-kore-border px-md py-sm text-body font-medium"
                    required
                  />
                  <button type="button" onClick={() => removeSection(idx)} className="text-kore-mid hover:text-red-600 transition-colors" title="Sektion entfernen">
                    <Trash2 size={16} />
                  </button>
                </div>
                <textarea
                  value={sec.content}
                  onChange={(e) => updateSection(idx, 'content', e.target.value)}
                  rows={4}
                  placeholder="Inhalt dieser Sektion..."
                  className="w-full border border-kore-border px-md py-sm text-body"
                  required
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-md">
          <button type="submit" disabled={create.isPending} className="px-xl py-md-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50">
            {create.isPending ? 'Wird erstellt...' : scheduledFor ? 'Briefing planen' : 'Briefing veroeffentlichen'}
          </button>
          <Link to="/tools/briefings" className="px-xl py-md-sm border border-kore-border text-small text-kore-ink hover:border-kore-ink transition-colors">Abbrechen</Link>
        </div>
        {create.isError && <p className="text-small text-red-600">Fehler: {(create.error as Error).message}</p>}
      </form>
    </div>
  );
}
