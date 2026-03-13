import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useChecklistStores, useChecklistTemplates } from '../../../hooks/useChecklist';
import { api } from '../../../lib/api';

export function NewSessionPage() {
  const { data: stores, isLoading: loadingStores } = useChecklistStores();
  const { data: templates, isLoading: loadingTemplates } = useChecklistTemplates();
  const [creating, setCreating] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  // Auto-select first store when loaded
  if (stores && stores.length > 0 && !selectedStore) {
    setSelectedStore(stores[0]!.id);
  }

  // Auto-select first template when loaded
  if (templates && templates.length > 0 && !selectedTemplate) {
    setSelectedTemplate(templates[0]!.id);
  }

  const handleStart = async () => {
    if (!selectedTemplate || !selectedStore) return;
    setCreating(true);
    try {
      const session = await api<{ id: string }>('/api/tools/checklisten/sessions', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate,
          storeId: selectedStore,
          notes: notes || undefined,
        }),
      });
      navigate(`/tools/checklisten/sessions/${session.id}/conduct`);
    } catch (error) {
      console.error('Checkliste erstellen fehlgeschlagen:', error);
      setCreating(false);
    }
  };

  if (loadingStores || loadingTemplates) {
    return (
      <div className="p-xl">
        <div className="text-body text-kore-mid">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="p-xl max-w-2xl">
      <Link
        to="/tools/checklisten"
        className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-xl transition-colors"
      >
        <ArrowLeft size={16} />
        Zurueck zur Uebersicht
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Neue Checkliste starten</h1>

      <div className="space-y-xl">
        {/* Store-Auswahl */}
        <div>
          <label className="label-default">Store</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="input-default"
          >
            {(stores ?? []).map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
                {store.city ? ` — ${store.city}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Template-Auswahl */}
        <div>
          <label className="label-default">Checklisten-Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="input-default"
          >
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.isDefault ? ' (KORE Standard)' : ''}
              </option>
            ))}
          </select>
          {templates?.find((t) => t.id === selectedTemplate)?.description && (
            <p className="text-small text-kore-mid mt-sm">
              {templates.find((t) => t.id === selectedTemplate)?.description}
            </p>
          )}
        </div>

        {/* Notizen */}
        <div>
          <label className="label-default">Notizen (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="z.B. Anlass, besondere Hinweise..."
            rows={3}
            className="input-default resize-none"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={creating || !selectedTemplate || !selectedStore}
          className="w-full bg-kore-ink text-kore-white py-md text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Checkliste wird erstellt...' : 'Checkliste starten'}
        </button>
      </div>
    </div>
  );
}
