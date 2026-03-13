import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Plus } from 'lucide-react';
import { useOnboardingJourneys, useOnboardingTemplates, useCreateOnboardingJourney } from '../../../hooks/useOnboarding';

const STATUS_COLORS: Record<string, string> = { ACTIVE: 'bg-emerald-500', COMPLETED: 'bg-blue-500', CANCELLED: 'bg-red-500' };
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };

export function JourneyListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useOnboardingJourneys({ page, status: status || undefined });
  const { data: templates } = useOnboardingTemplates();
  const createJourney = useCreateOnboardingJourney();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ templateId: '', userId: '', storeId: '', mentorId: '', startDate: new Date().toISOString().slice(0, 10) });

  const handleCreate = () => {
    createJourney.mutate({
      ...form,
      storeId: form.storeId || undefined,
      mentorId: form.mentorId || undefined,
    }, {
      onSuccess: () => { setShowCreate(false); setForm({ templateId: '', userId: '', storeId: '', mentorId: '', startDate: new Date().toISOString().slice(0, 10) }); },
    });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/onboarding" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Onboarding Journeys</h1>
          <p className="text-body text-kore-mid mt-xs">Laufende & abgeschlossene Einarbeitungen</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="CANCELLED">Abgebrochen</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs">
          <Plus size={14} /> Neue Journey
        </button>
      </div>

      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neue Onboarding Journey</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })} className="border border-kore-border px-md py-sm text-small bg-kore-white">
              <option value="">Template wählen</option>
              {(templates ?? []).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <input placeholder="User-ID (neuer Mitarbeiter)" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input placeholder="Store-ID" value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input placeholder="Mentor-ID (optional)" value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
          </div>
          <div className="flex gap-sm">
            <button onClick={handleCreate} disabled={!form.templateId || !form.userId || createJourney.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small disabled:opacity-50">Erstellen</button>
            <button onClick={() => setShowCreate(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !data?.data?.length ? (
        <div className="text-body text-kore-mid">Keine Journeys gefunden.</div>
      ) : (
        <>
          <div className="space-y-sm">
            {data.data.map((j: any) => (
              <Link key={j.id} to={`/tools/onboarding/journeys/${j.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors">
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-medium text-kore-ink flex items-center gap-xs">
                    <UserPlus size={14} /> {j.user?.name ?? 'Unbekannt'}
                  </span>
                  <div className="flex items-center gap-xs">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[j.status] ?? 'bg-kore-mid'}`} />
                    <span className="text-small text-kore-mid">{STATUS_LABELS[j.status] ?? j.status}</span>
                  </div>
                </div>
                <div className="flex gap-lg text-small text-kore-mid">
                  <span>{j.template?.name ?? '—'}</span>
                  {j.store && <span>{j.store.name}</span>}
                  {j.mentor && <span>Mentor: {j.mentor.name}</span>}
                  <span>{new Date(j.startDate).toLocaleDateString('de-DE')}</span>
                </div>
              </Link>
            ))}
          </div>
          {data.total > data.pageSize && (
            <div className="flex gap-sm mt-lg">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Zurück</button>
              <span className="px-md py-sm text-small text-kore-mid">Seite {data.page} / {Math.ceil(data.total / data.pageSize)}</span>
              <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
