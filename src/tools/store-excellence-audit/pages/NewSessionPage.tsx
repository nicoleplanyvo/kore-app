import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreOptions, useAuditTemplates, useCreateSession } from '../../../hooks/useAudit';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import t from '../../../locales/de.json';

export function SEANewSessionPage() {
  const navigate = useNavigate();
  const { data: stores, isLoading: storesLoading } = useStoreOptions();
  const { data: templates, isLoading: templatesLoading } = useAuditTemplates();
  const createSession = useCreateSession();

  const [storeId, setStoreId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [error, setError] = useState('');

  if (storesLoading || templatesLoading) return <LoadingSpinner />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!storeId || !templateId) {
      setError('Bitte waehle einen Store und ein Template.');
      return;
    }

    try {
      const session = await createSession.mutateAsync({
        storeId,
        templateId,
        storeLocation: storeLocation || undefined,
      });
      navigate(`/tools/sea/sessions/${session.id}/conduct`);
    } catch {
      setError('Fehler beim Erstellen des Audits.');
    }
  };

  return (
    <div className="px-lg py-lg space-y-xl max-w-lg mx-auto">
      <h1 className="font-display text-h2 text-kore-ink">{t.audit.newSession}</h1>

      <form onSubmit={handleSubmit} className="space-y-lg">
        {error && (
          <div className="bg-kore-error/10 text-kore-error text-small px-md py-md-sm">
            {error}
          </div>
        )}

        <Select
          id="storeId"
          label={t.audit.selectStore}
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          placeholder="-- Store auswaehlen --"
          options={
            stores?.map((s) => ({
              value: s.id,
              label: s.city ? `${s.name} (${s.city})` : s.name,
            })) ?? []
          }
        />

        <Select
          id="templateId"
          label={t.audit.selectTemplate}
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          placeholder="-- Template auswaehlen --"
          options={
            templates?.map((t) => ({
              value: t.id,
              label: t.name,
            })) ?? []
          }
        />

        <Input
          id="storeLocation"
          label={t.audit.location}
          value={storeLocation}
          onChange={(e) => setStoreLocation(e.target.value)}
          placeholder="z.B. Erdgeschoss, Abteilung Mode"
        />

        <Button
          type="submit"
          disabled={createSession.isPending || !storeId || !templateId}
          className="w-full"
          size="lg"
        >
          {createSession.isPending ? t.common.loading : t.audit.start}
        </Button>
      </form>
    </div>
  );
}
