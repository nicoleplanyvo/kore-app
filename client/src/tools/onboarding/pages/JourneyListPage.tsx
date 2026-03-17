import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Plus } from 'lucide-react';
import {
  useOnboardingJourneys,
  useOnboardingTemplates,
  useOnboardingStores,
  useOnboardingUsers,
  useCreateOnboardingJourney,
} from '../../../hooks/useOnboarding';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-emerald-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};
const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'Aktiv',
  COMPLETED: 'Abgeschlossen',
  CANCELLED: 'Abgebrochen',
};

export function JourneyListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selectedStore, setSelectedStore] = useState('');

  const { data, isLoading } = useOnboardingJourneys({
    page,
    status: status || undefined,
    storeId: selectedStore || undefined,
  });
  const { data: templates } = useOnboardingTemplates();
  const { data: stores } = useOnboardingStores();
  const { data: users } = useOnboardingUsers();
  const createJourney = useCreateOnboardingJourney();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    templateId: '',
    userId: '',
    storeId: '',
    mentorId: '',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const handleCreate = () => {
    createJourney.mutate(
      {
        templateId: form.templateId,
        userId: form.userId,
        storeId: form.storeId,
        mentorId: form.mentorId || undefined,
        startDate: form.startDate,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({
            templateId: '',
            userId: '',
            storeId: '',
            mentorId: '',
            startDate: new Date().toISOString().slice(0, 10),
          });
        },
      },
    );
  };

  const activeTemplates = (templates ?? []).filter((t: any) => t.isActive !== false);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/onboarding"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Onboarding Journeys</h1>
          <p className="text-body text-kore-mid mt-xs">
            Laufende & abgeschlossene Einarbeitungen verwalten
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs"
        >
          <Plus size={14} /> Neue Journey
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-md mb-xl flex-wrap">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Status</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="border border-kore-border px-md py-sm text-small bg-kore-white"
          >
            <option value="">Alle Status</option>
            <option value="IN_PROGRESS">Aktiv</option>
            <option value="COMPLETED">Abgeschlossen</option>
            <option value="CANCELLED">Abgebrochen</option>
          </select>
        </div>
        {stores && stores.length > 1 && (
          <div>
            <label className="block text-small text-kore-mid mb-xs">Store</label>
            <select
              value={selectedStore}
              onChange={(e) => {
                setSelectedStore(e.target.value);
                setPage(1);
              }}
              className="border border-kore-border px-md py-sm text-small bg-kore-white min-w-[180px]"
            >
              <option value="">Alle Stores</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.city ? ` (${s.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neue Onboarding Journey</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Template</label>
              <select
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
              >
                <option value="">Template waehlen</option>
                {activeTemplates.map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.role ? ` (${t.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">
                Neuer Mitarbeiter
              </label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
              >
                <option value="">Mitarbeiter waehlen</option>
                {(users ?? []).map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Store</label>
              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
              >
                <option value="">Store waehlen</option>
                {(stores ?? []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.city ? ` (${s.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">
                Buddy / Mentor (optional)
              </label>
              <select
                value={form.mentorId}
                onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small bg-kore-white"
              >
                <option value="">Kein Mentor</option>
                {(users ?? []).map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Startdatum</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-small"
              />
            </div>
          </div>
          <div className="flex gap-sm">
            <button
              onClick={handleCreate}
              disabled={
                !form.templateId || !form.userId || !form.storeId || createJourney.isPending
              }
              className="px-md py-sm bg-kore-ink text-kore-white text-small disabled:opacity-50"
            >
              {createJourney.isPending ? 'Erstelle...' : 'Journey starten'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-md py-sm border border-kore-border text-small"
            >
              Abbrechen
            </button>
          </div>
          {createJourney.isError && (
            <p className="text-small text-red-600 mt-sm">
              {(createJourney.error as Error).message}
            </p>
          )}
        </div>
      )}

      {/* Journeys list */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !data?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-xl text-center">
          <UserPlus size={36} className="text-kore-faint mx-auto mb-md" />
          <p className="text-body text-kore-mid">Keine Journeys gefunden.</p>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {data.data.map((j: any) => (
              <Link
                key={j.id}
                to={`/tools/onboarding/journeys/${j.id}`}
                className="block bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors"
              >
                <div className="flex items-center justify-between mb-xs">
                  <span className="font-medium text-kore-ink flex items-center gap-xs">
                    <UserPlus size={14} /> {j.user?.name ?? 'Unbekannt'}
                  </span>
                  <div className="flex items-center gap-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${STATUS_COLORS[j.status] ?? 'bg-kore-mid'}`}
                    />
                    <span className="text-small text-kore-mid">
                      {STATUS_LABELS[j.status] ?? j.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-lg text-small text-kore-mid mb-sm flex-wrap">
                  <span>{j.template?.name ?? '--'}</span>
                  {j.store && <span>{j.store.name}</span>}
                  {j.mentor && <span>Buddy: {j.mentor.name}</span>}
                  <span>{new Date(j.startDate).toLocaleDateString('de-DE')}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-kore-bg h-2">
                  <div
                    className={`h-2 transition-all ${
                      j.status === 'COMPLETED'
                        ? 'bg-blue-500'
                        : j.status === 'CANCELLED'
                          ? 'bg-red-400'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${j.progressPct ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-xs text-small text-kore-mid">
                  <span>
                    {j.completedSteps ?? 0} / {j.totalSteps ?? 0} Schritte
                  </span>
                  <span>{j.progressPct ?? 0}%</span>
                </div>
              </Link>
            ))}
          </div>
          {data.total > data.pageSize && (
            <div className="flex items-center justify-between mt-lg">
              <span className="text-small text-kore-mid">
                Seite {data.page} / {Math.ceil(data.total / data.pageSize)} ({data.total}{' '}
                Eintraege)
              </span>
              <div className="flex gap-sm">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-md py-sm border border-kore-border text-small disabled:opacity-40"
                >
                  Zurueck
                </button>
                <button
                  disabled={page * data.pageSize >= data.total}
                  onClick={() => setPage(page + 1)}
                  className="px-md py-sm border border-kore-border text-small disabled:opacity-40"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
