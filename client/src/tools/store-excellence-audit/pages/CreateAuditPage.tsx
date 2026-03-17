import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { useAuditStores, useAuditTemplates, useCreateAuditSession } from '../../../hooks/useAudit';

export function CreateAuditPage() {
  const navigate = useNavigate();
  const { data: stores, isLoading: loadingStores } = useAuditStores();
  const { data: templates, isLoading: loadingTemplates } = useAuditTemplates();
  const createMutation = useCreateAuditSession();

  const [storeId, setStoreId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeId || !templateId) {
      setError('Bitte Store und Template auswaehlen.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        storeId,
        templateId,
        storeLocation: storeLocation || undefined,
        notes: notes || undefined,
      });
      navigate(`/app/tools/sea/audits/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen.');
    }
  };

  const selectedTemplate = templates?.find((t: any) => t.id === templateId);

  return (
    <div className="p-xl max-w-3xl">
      <div className="flex items-center gap-md mb-2xl">
        <button onClick={() => navigate(-1)} className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Neues Audit starten</h1>
          <p className="text-body text-kore-mid mt-xs">Store auswaehlen und Audit-Template festlegen</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-small px-lg py-md mb-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-xl">
        {/* Store */}
        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">Store *</label>
          {loadingStores ? (
            <div className="text-small text-kore-mid">Lade Stores...</div>
          ) : (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
            >
              <option value="">Store auswaehlen...</option>
              {(stores ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
              ))}
            </select>
          )}
        </div>

        {/* Template */}
        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">Audit-Template *</label>
          {loadingTemplates ? (
            <div className="text-small text-kore-mid">Lade Templates...</div>
          ) : (
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
            >
              <option value="">Template auswaehlen...</option>
              {(templates ?? []).map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isDefault ? '(KORE Standard)' : ''} — {t.categories?.length ?? 0} Kategorien
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected template preview */}
        {selectedTemplate && selectedTemplate.categories && (
          <div className="bg-kore-bg border border-kore-border p-lg">
            <h3 className="text-small font-medium text-kore-ink mb-sm">Template-Vorschau: {selectedTemplate.name}</h3>
            <div className="space-y-xs text-small text-kore-mid">
              {selectedTemplate.categories.map((cat: any) => (
                <div key={cat.id} className="flex items-center justify-between">
                  <span>{cat.name}</span>
                  <span>{cat._count?.criteria ?? cat.criteria?.length ?? 0} Kriterien (Gew. {cat.weight}x)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Store Location */}
        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">
            Store-Bereich <span className="text-kore-faint font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={storeLocation}
            onChange={(e) => setStoreLocation(e.target.value)}
            placeholder="z.B. Erdgeschoss, Kasse, Lager"
            className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-small font-medium text-kore-ink mb-sm">
            Notizen <span className="text-kore-faint font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Zusaetzliche Hinweise..."
            rows={3}
            className="w-full border border-kore-border px-md py-sm text-body bg-kore-white focus:outline-none focus:border-kore-brass resize-y"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-md pt-lg border-t border-kore-border">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
          >
            <Play size={16} />
            {createMutation.isPending ? 'Wird gestartet...' : 'Audit starten'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-xl py-md-sm text-small text-kore-mid hover:text-kore-ink transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
