import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Save,
  Send,
  Store,
  AlertTriangle,
  Plus,
  X,
  Camera,
} from 'lucide-react';
import { useMultiStoreStores, useCreateMultiStoreTask } from '../../../hooks/useMultiStore';

const TASK_TYPES = [
  { value: 'TODO', label: 'To-Do' },
  { value: 'CHECKLIST', label: 'Checkliste' },
  { value: 'CAMPAIGN', label: 'Kampagne' },
  { value: 'SURVEY', label: 'Umfrage' },
];

const PRIORITIES = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
];

const CATEGORIES = [
  'Allgemein',
  'Visual Merchandising',
  'Wartung',
  'Kampagne',
  'Compliance',
  'Schulung',
  'Inventur',
  'Sicherheit',
];

export function TaskCreatePage() {
  const navigate = useNavigate();
  const { data: stores } = useMultiStoreStores();
  const createTask = useCreateMultiStoreTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('Allgemein');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  // Checklist items
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [checklistInput, setChecklistInput] = useState('');

  // Campaign fields
  const [campaignName, setCampaignName] = useState('');
  const [campaignStart, setCampaignStart] = useState('');
  const [campaignEnd, setCampaignEnd] = useState('');

  const toggleStore = (storeId: string) => {
    setSelectedStoreIds((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId],
    );
  };

  const selectAllStores = () => {
    if (stores) setSelectedStoreIds(stores.map((s) => s.id));
  };

  const deselectAllStores = () => {
    setSelectedStoreIds([]);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const addChecklistItem = () => {
    const item = checklistInput.trim();
    if (item) {
      setChecklistItems((prev) => [...prev, item]);
      setChecklistInput('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError('');
    if (!title.trim()) {
      setError('Bitte geben Sie einen Titel ein.');
      return;
    }
    if (selectedStoreIds.length === 0) {
      setError('Bitte waehlen Sie mindestens einen Store aus.');
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        category,
        storeIds: selectedStoreIds,
        tags,
        requiresPhoto,
      };

      if (deadline) payload.deadline = deadline;
      if (type === 'CHECKLIST' && checklistItems.length > 0) payload.checklistItems = checklistItems;
      if (type === 'CAMPAIGN') {
        if (campaignName) payload.campaignName = campaignName;
        if (campaignStart) payload.campaignStart = campaignStart;
        if (campaignEnd) payload.campaignEnd = campaignEnd;
      }

      await createTask.mutateAsync(payload as any);
      navigate('/tools/multi-store/tasks');
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen.');
    }
  };

  return (
    <div className="p-xl max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/multi-store/tasks" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <ClipboardList size={24} /> Neue Aufgabe
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Aufgabe erstellen und an Stores verteilen.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-md py-sm text-small mb-lg flex items-center gap-sm">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Type + Priority + Category */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Aufgabentyp</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white"
            >
              {TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Prioritaet</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white"
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Kategorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Title + Description */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="mb-md">
          <label className="block text-small text-kore-mid mb-xs">Titel</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Aufgabentitel eingeben..."
            className="w-full border border-kore-border px-md py-sm text-body"
            required
          />
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detaillierte Beschreibung der Aufgabe..."
            rows={4}
            className="w-full border border-kore-border px-md py-sm text-body resize-y"
          />
        </div>
      </div>

      {/* Deadline + Photo requirement */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-sm text-body cursor-pointer select-none">
              <input
                type="checkbox"
                checked={requiresPhoto}
                onChange={(e) => setRequiresPhoto(e.target.checked)}
                className="accent-kore-brass"
              />
              <Camera size={16} className="text-kore-mid" />
              Foto-Nachweis erforderlich
            </label>
          </div>
        </div>
      </div>

      {/* Campaign-specific fields */}
      {type === 'CAMPAIGN' && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-display text-body font-medium text-kore-ink mb-md">Kampagnen-Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kampagnenname</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Name der Kampagne..."
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Start</label>
              <input
                type="date"
                value={campaignStart}
                onChange={(e) => setCampaignStart(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Ende</label>
              <input
                type="date"
                value={campaignEnd}
                onChange={(e) => setCampaignEnd(e.target.value)}
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
          </div>
        </div>
      )}

      {/* Checklist items */}
      {type === 'CHECKLIST' && (
        <div className="bg-kore-white border border-kore-border p-lg mb-lg">
          <h3 className="font-display text-body font-medium text-kore-ink mb-md">Checklisten-Punkte</h3>
          <div className="space-y-sm mb-md">
            {checklistItems.map((item, i) => (
              <div key={i} className="flex items-center gap-sm bg-kore-bg p-sm">
                <span className="text-small text-kore-mid">{i + 1}.</span>
                <span className="text-body text-kore-ink flex-1">{item}</span>
                <button onClick={() => removeChecklistItem(i)} className="text-kore-mid hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-sm">
            <input
              type="text"
              value={checklistInput}
              onChange={(e) => setChecklistInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
              placeholder="Neuen Punkt hinzufuegen..."
              className="flex-1 border border-kore-border px-md py-sm text-body"
            />
            <button
              onClick={addChecklistItem}
              className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-ink hover:bg-kore-bg"
            >
              <Plus size={14} /> Hinzufuegen
            </button>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <h3 className="font-display text-body font-medium text-kore-ink mb-md">Tags (optional)</h3>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-sm mb-md">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-xs bg-kore-bg px-sm py-xs text-small text-kore-ink">
                {tag}
                <button onClick={() => removeTag(tag)} className="text-kore-mid hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-sm">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Tag hinzufuegen..."
            className="flex-1 border border-kore-border px-md py-sm text-body"
          />
          <button
            onClick={addTag}
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-ink hover:bg-kore-bg"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Store selection */}
      <div className="bg-kore-white border border-kore-border p-lg mb-lg">
        <div className="flex items-center justify-between mb-md">
          <h3 className="font-display text-body font-medium text-kore-ink flex items-center gap-sm">
            <Store size={16} /> Stores zuweisen
          </h3>
          <div className="flex gap-sm">
            <button
              onClick={selectAllStores}
              className="text-small text-kore-brass hover:underline"
            >
              Alle auswaehlen
            </button>
            <button
              onClick={deselectAllStores}
              className="text-small text-kore-mid hover:underline"
            >
              Keine
            </button>
          </div>
        </div>
        <div className="text-small text-kore-mid mb-sm">
          {selectedStoreIds.length} von {stores?.length ?? 0} Stores ausgewaehlt
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-sm max-h-60 overflow-y-auto">
          {stores?.map((store) => (
            <label
              key={store.id}
              className={`flex items-center gap-sm p-sm cursor-pointer border transition-colors ${
                selectedStoreIds.includes(store.id)
                  ? 'border-kore-brass bg-amber-50/30'
                  : 'border-kore-border hover:bg-kore-bg'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedStoreIds.includes(store.id)}
                onChange={() => toggleStore(store.id)}
                className="accent-kore-brass"
              />
              <div>
                <span className="text-small font-medium text-kore-ink">{store.name}</span>
                {store.city && <span className="text-small text-kore-mid ml-xs">{store.city}</span>}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-kore-border pt-lg">
        <Link
          to="/tools/multi-store/tasks"
          className="text-small text-kore-mid hover:text-kore-ink transition-colors"
        >
          Abbrechen
        </Link>
        <button
          onClick={handleSubmit}
          disabled={createTask.isPending}
          className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} /> Aufgabe verteilen
        </button>
      </div>
    </div>
  );
}
