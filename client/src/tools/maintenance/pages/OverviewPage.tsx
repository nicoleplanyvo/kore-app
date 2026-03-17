import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Plus,
  BarChart3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  CircleDot,
} from 'lucide-react';
import {
  useMaintenanceStores,
  useMaintenanceRequests,
  useMaintenanceUsers,
  useCreateMaintenanceRequest,
} from '../../../hooks/useMaintenance';

const CATEGORY_OPTIONS = [
  { value: 'ELECTRICAL', label: 'Elektrik' },
  { value: 'PLUMBING', label: 'Sanitaer' },
  { value: 'HVAC', label: 'Heizung/Klima' },
  { value: 'FIXTURE', label: 'Einrichtung' },
  { value: 'IT', label: 'IT' },
  { value: 'OTHER', label: 'Sonstiges' },
] as const;

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Niedrig' },
  { value: 'MEDIUM', label: 'Mittel' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
] as const;

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Arbeit',
  RESOLVED: 'Geloest',
  CLOSED: 'Geschlossen',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  URGENT: 'Dringend',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-kore-mid',
  MEDIUM: 'text-amber-600',
  HIGH: 'text-orange-600',
  URGENT: 'text-red-600 font-medium',
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW: 'bg-kore-bg text-kore-mid border-kore-border',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  URGENT: 'bg-red-50 text-red-700 border-red-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICAL: 'Elektrik',
  PLUMBING: 'Sanitaer',
  HVAC: 'Heizung/Klima',
  FIXTURE: 'Einrichtung',
  IT: 'IT',
  OTHER: 'Sonstiges',
};

const STATUS_ICONS: Record<string, typeof AlertTriangle> = {
  OPEN: AlertTriangle,
  IN_PROGRESS: Clock,
  RESOLVED: CheckCircle,
  CLOSED: CircleDot,
};

export function OverviewPage() {
  const { data: stores } = useMaintenanceStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const storeId = selectedStore || stores?.[0]?.id || '';

  const { data: requestData, isLoading } = useMaintenanceRequests({
    storeId: storeId || undefined,
    status: filterStatus || undefined,
    category: filterCategory || undefined,
    priority: filterPriority || undefined,
    page,
  });

  const createRequest = useCreateMaintenanceRequest();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
  });

  const totalPages = useMemo(
    () => (requestData ? Math.ceil(requestData.total / requestData.pageSize) : 1),
    [requestData],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    createRequest.mutate(
      {
        storeId,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
      },
      {
        onSuccess: () => {
          setForm({ title: '', description: '', category: 'OTHER', priority: 'MEDIUM' });
          setShowForm(false);
        },
      },
    );
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Wrench size={24} /> Maintenance
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Stoerungsmeldungen erstellen, verwalten und Reparatur-Status verfolgen.
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/maintenance/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neue Meldung
          </button>
        </div>
      </div>

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <div className="mb-xl">
          <label className="block text-small text-kore-mid mb-xs">Store</label>
          <select
            value={storeId}
            onChange={(e) => { setSelectedStore(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-body min-w-[200px]"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.city ? ` (${s.city})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Neue Stoerungsmeldung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
            <div className="md:col-span-2">
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder="Kurze Beschreibung der Stoerung"
                required
                minLength={2}
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kategorie</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Prioritaet</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-small text-kore-mid mb-xs">Beschreibung</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body resize-y"
                placeholder="Detaillierte Beschreibung der Stoerung, Standort im Store, etc."
                rows={3}
                required
                minLength={5}
                maxLength={2000}
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button
              type="submit"
              disabled={createRequest.isPending}
              className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {createRequest.isPending ? 'Speichern...' : 'Meldung erstellen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-lg py-sm border border-kore-border text-kore-mid text-small hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
          {createRequest.isError && (
            <p className="text-small text-red-600 mt-sm">{(createRequest.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-md mb-lg">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small"
          >
            <option value="">Alle Status</option>
            <option value="OPEN">Offen</option>
            <option value="IN_PROGRESS">In Arbeit</option>
            <option value="RESOLVED">Geloest</option>
            <option value="CLOSED">Geschlossen</option>
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Kategorie</label>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small"
          >
            <option value="">Alle Kategorien</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Prioritaet</label>
          <select
            value={filterPriority}
            onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small"
          >
            <option value="">Alle Prioritaeten</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        {(filterStatus || filterCategory || filterPriority) && (
          <button
            onClick={() => { setFilterStatus(''); setFilterCategory(''); setFilterPriority(''); setPage(1); }}
            className="text-small text-kore-mid hover:text-kore-ink underline"
          >
            Filter zuruecksetzen
          </button>
        )}
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Meldungen...</div>
      ) : !requestData?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <Wrench size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Meldungen vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie Ihre erste Stoerungsmeldung fuer diesen Store.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Erste Meldung erstellen
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-sm">
            {requestData.data.map((r) => {
              const StatusIcon = STATUS_ICONS[r.status] ?? CircleDot;
              return (
                <Link
                  key={r.id}
                  to={`/tools/maintenance/requests/${r.id}`}
                  className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors"
                >
                  <div className="flex items-start justify-between gap-md">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-sm mb-xs">
                        <span className={`text-body font-medium text-kore-ink ${r.priority === 'URGENT' ? 'text-red-700' : ''}`}>
                          {r.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-md flex-wrap">
                        <span className="text-small text-kore-mid">{r.store?.name}</span>
                        <span className="text-small px-sm py-px border border-kore-border bg-kore-bg">
                          {CATEGORY_LABELS[r.category] ?? r.category}
                        </span>
                        <span className={`text-small px-sm py-px border ${PRIORITY_BADGE[r.priority] ?? 'bg-kore-bg text-kore-mid border-kore-border'}`}>
                          {PRIORITY_LABELS[r.priority] ?? r.priority}
                        </span>
                        {r.assignee && (
                          <span className="text-small text-kore-mid">
                            Zugewiesen: {r.assignee.name}
                          </span>
                        )}
                        <span className="text-small text-kore-faint">
                          {new Date(r.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-xs text-small font-medium px-md py-xs border whitespace-nowrap ${STATUS_STYLES[r.status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
                      <StatusIcon size={12} />
                      {STATUS_LABELS[r.status] ?? String(r.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-lg">
              <span className="text-small text-kore-mid">
                Seite {requestData.page} von {totalPages} ({requestData.total} Meldungen)
              </span>
              <div className="flex items-center gap-xs">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                  className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
