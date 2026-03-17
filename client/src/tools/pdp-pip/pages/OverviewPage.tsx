import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, Plus, User, BarChart3, Filter, ChevronDown, ChevronUp,
  AlertTriangle, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  usePdpStores, usePdpUsers, useDevelopmentPlans, useCreateDevelopmentPlan,
} from '../../../hooks/usePdpPip';

const TYPE_LABELS: Record<string, string> = { PDP: 'Entwicklungsplan', PIP: 'Verbesserungsplan' };
const STATUS_LABELS: Record<string, string> = { ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', CANCELLED: 'Abgebrochen' };
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const TYPE_COLORS: Record<string, string> = {
  PDP: 'bg-indigo-100 text-indigo-700',
  PIP: 'bg-orange-100 text-orange-700',
};

export function OverviewPage() {
  const { data: stores } = usePdpStores();
  const { data: users } = usePdpUsers();
  const create = useCreateDevelopmentPlan();

  // Filters
  const [storeId, setStoreId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { data: plansResult, isLoading } = useDevelopmentPlans({
    storeId: storeId || undefined,
    type: filterType || undefined,
    status: filterStatus || undefined,
    userId: filterUserId || undefined,
    page,
    pageSize: 20,
  });

  const plans = plansResult?.data ?? [];
  const total = plansResult?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    storeId: '',
    type: 'PDP',
    title: '',
    targetDate: '',
  });

  useEffect(() => {
    if (stores?.length && !storeId) setStoreId(stores[0].id);
  }, [stores, storeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        userId: form.userId,
        storeId: form.storeId || undefined,
        type: form.type,
        title: form.title,
        targetDate: form.targetDate || undefined,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ userId: '', storeId: '', type: 'PDP', title: '', targetDate: '' });
        },
      },
    );
  };

  const now = new Date();
  const isOverdue = (p: any) => p.status === 'ACTIVE' && p.targetDate && new Date(p.targetDate) < now;

  const progressColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-blue-500';
    if (pct >= 25) return 'bg-amber-500';
    return 'bg-red-400';
  };

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Compass size={24} /> PDP / PIP
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Entwicklungs- und Verbesserungsplaene verwalten
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {stores && stores.length > 1 && (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="border border-kore-border px-md py-sm text-small"
            >
              <option value="">Alle Stores</option>
              {stores.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <Link
            to="/tools/pdp-pip/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
          >
            <BarChart3 size={14} /> Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neuer Plan
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-lg space-y-md">
          <h2 className="font-display text-h3 text-kore-ink mb-sm">Neuen Plan erstellen</h2>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Typ</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                <option value="PDP">PDP -- Entwicklungsplan</option>
                <option value="PIP">PIP -- Verbesserungsplan</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Mitarbeiter</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                required
              >
                <option value="">-- Mitarbeiter waehlen --</option>
                {users?.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={form.type === 'PDP' ? 'z.B. Fuehrungskompetenz Q2' : 'z.B. Verbesserung Kundenservice'}
                className="w-full border border-kore-border px-md py-sm text-body"
                required
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Zieldatum</label>
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              />
            </div>
          </div>
          {stores && stores.length > 1 && (
            <div>
              <label className="block text-small text-kore-mid mb-xs">Store (optional)</label>
              <select
                value={form.storeId}
                onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                <option value="">-- Kein spezifischer Store --</option>
                {stores.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-sm">
            <button
              type="submit"
              disabled={create.isPending}
              className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? 'Wird erstellt...' : 'Plan anlegen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-lg py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="mb-lg">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-xs text-small text-kore-mid hover:text-kore-ink mb-sm"
        >
          <Filter size={14} /> Filter
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showFilters && (
          <div className="flex flex-wrap gap-sm">
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              className="border border-kore-border px-md py-sm text-small"
            >
              <option value="">Alle Typen</option>
              <option value="PDP">PDP</option>
              <option value="PIP">PIP</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="border border-kore-border px-md py-sm text-small"
            >
              <option value="">Alle Status</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="CANCELLED">Abgebrochen</option>
            </select>
            <select
              value={filterUserId}
              onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }}
              className="border border-kore-border px-md py-sm text-small"
            >
              <option value="">Alle Mitarbeiter</option>
              {users?.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {(filterType || filterStatus || filterUserId) && (
              <button
                onClick={() => { setFilterType(''); setFilterStatus(''); setFilterUserId(''); setPage(1); }}
                className="px-md py-sm text-small text-kore-brass hover:underline"
              >
                Zuruecksetzen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {plans.length > 0 && (
        <div className="grid grid-cols-4 gap-md mb-lg">
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-kore-ink">{total}</div>
            <div className="text-xs text-kore-mid uppercase mt-1">Gesamt</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-blue-600">
              {plans.filter((p: any) => p.status === 'ACTIVE').length}
            </div>
            <div className="text-xs text-kore-mid uppercase mt-1">Aktiv</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {plans.filter((p: any) => p.type === 'PDP').length}
            </div>
            <div className="text-xs text-kore-mid uppercase mt-1">PDP</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-orange-600">
              {plans.filter((p: any) => p.type === 'PIP').length}
            </div>
            <div className="text-xs text-kore-mid uppercase mt-1">PIP</div>
          </div>
        </div>
      )}

      {/* Plans List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Plaene...</div>
      ) : !plans.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Noch keine Entwicklungsplaene vorhanden.
        </div>
      ) : (
        <div className="space-y-sm">
          {plans.map((p: any) => (
            <Link
              key={p.id}
              to={`/tools/pdp-pip/plans/${p.id}`}
              className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {(p.user?.name || '??').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-sm">
                      <span className="font-medium text-kore-ink">{p.title}</span>
                      {isOverdue(p) && (
                        <span className="text-red-500" title="Ueberfaellig">
                          <AlertTriangle size={14} />
                        </span>
                      )}
                    </div>
                    <div className="flex gap-md text-small text-kore-mid mt-xs">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {p.user?.name ?? '---'}
                      </span>
                      <span>Manager: {p.manager?.name ?? '---'}</span>
                      {p.store && <span>{p.store.name}</span>}
                      {p.targetDate && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(p.targetDate).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  {/* Goal progress bar */}
                  {p.totalGoals > 0 && (
                    <div className="flex items-center gap-xs">
                      <div className="w-24 bg-kore-bg rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${progressColor(p.avgProgress)}`}
                          style={{ width: `${p.avgProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-kore-mid w-8">{p.avgProgress}%</span>
                    </div>
                  )}
                  <span className="text-xs text-kore-mid">
                    {p.completedGoals ?? 0}/{p.totalGoals ?? 0} Ziele
                  </span>
                  <span className={`px-sm py-xs text-small ${TYPE_COLORS[p.type] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {TYPE_LABELS[p.type] ?? p.type}
                  </span>
                  <span className={`px-sm py-xs text-small ${STATUS_COLORS[p.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm mt-lg">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-md py-sm border border-kore-border text-small disabled:opacity-30"
          >
            Zurueck
          </button>
          <span className="text-small text-kore-mid">
            Seite {page} von {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-md py-sm border border-kore-border text-small disabled:opacity-30"
          >
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}
