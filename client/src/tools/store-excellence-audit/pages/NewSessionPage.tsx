import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditTemplates, useStoreOptions } from '../../../hooks/useAudit';
import { api } from '../../../lib/api';
import type { AuditSession } from '@shared/types';

export function NewSessionPage() {
  const { data: templates, isLoading: loadingTemplates } = useAuditTemplates();
  const { data: stores, isLoading: loadingStores } = useStoreOptions();
  const [creating, setCreating] = useState(false);
  const [storeLocation, setStoreLocation] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('');
  const navigate = useNavigate();

  // Auto-select first template when loaded
  if (templates && templates.length > 0 && !selectedTemplate) {
    setSelectedTemplate(templates[0]!.id);
  }

  // Auto-select first store when loaded
  if (stores && stores.length > 0 && !selectedStore) {
    setSelectedStore(stores[0]!.id);
  }

  const handleStart = async () => {
    if (!selectedTemplate || !selectedStore) return;
    setCreating(true);
    try {
      const session = await api<AuditSession>('/api/tools/sea/sessions', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate,
          storeId: selectedStore,
          storeLocation: storeLocation || undefined,
        }),
      });
      navigate(`/tools/sea/sessions/${session.id}/conduct`);
    } catch (error) {
      console.error('Session erstellen fehlgeschlagen:', error);
      setCreating(false);
    }
  };

  if (loadingTemplates || loadingStores) {
    return (
      <div className="p-xl">
        <div className="text-body text-kore-mid">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="p-xl max-w-2xl">
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Neues Audit starten</h1>

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
          <label className="label-default">Audit-Template</label>
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

        {/* Store-Standort */}
        <div>
          <label className="label-default">Bereich im Store (optional)</label>
          <input
            type="text"
            value={storeLocation}
            onChange={(e) => setStoreLocation(e.target.value)}
            placeholder="z.B. Erdgeschoss, Eingangsbereich"
            className="input-default"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={creating || !selectedTemplate || !selectedStore}
          className="w-full bg-kore-ink text-kore-white py-md text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? 'Audit wird erstellt...' : 'Audit starten'}
        </button>
      </div>
    </div>
  );
}
