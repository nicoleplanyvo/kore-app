import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send, Plus, AlertTriangle, AlertCircle, BarChart3, Search,
  ChevronLeft, ChevronRight, X, Users, Building2,
} from 'lucide-react';
import {
  useTeamMessages, useCreateTeamMessage, useTeamPushStores, useTeamPushUsers,
} from '../../../hooks/useTeamPush';

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  NORMAL: null,
  HIGH: <AlertTriangle size={14} className="text-amber-500" />,
  URGENT: <AlertCircle size={14} className="text-red-500" />,
};
const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: '',
  HIGH: 'border-l-4 border-l-amber-500',
  URGENT: 'border-l-4 border-l-red-500',
};
const TARGET_LABELS: Record<string, string> = { ALL: 'Alle', STORE: 'Store', ROLE: 'Rolle' };
const PRIORITY_OPTIONS = [
  { value: '', label: 'Alle Prioritaeten' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Hoch' },
  { value: 'URGENT', label: 'Dringend' },
];

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTarget, setFilterTarget] = useState('');
  const [searchText, setSearchText] = useState('');

  const { data: result, isLoading } = useTeamMessages({
    priority: filterPriority || undefined,
    targetType: filterTarget || undefined,
    search: searchText || undefined,
    page,
    pageSize: 20,
  });
  const messages = result?.data ?? [];
  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  const { data: stores } = useTeamPushStores();
  const { data: users } = useTeamPushUsers();
  const create = useCreateTeamMessage();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', body: '', priority: 'NORMAL', targetType: 'ALL', targetStoreIds: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, string> = {
      title: form.title,
      body: form.body,
      priority: form.priority,
      targetType: form.targetType,
    };
    if (form.targetType === 'STORE' && form.targetStoreIds) {
      payload.targetStoreIds = form.targetStoreIds;
    }
    create.mutate(payload as any, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ title: '', body: '', priority: 'NORMAL', targetType: 'ALL', targetStoreIds: '' });
        setPage(1);
      },
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Send size={24} /> Team Push
          </h1>
          <p className="text-body text-kore-mid mt-xs">Schnelle Nachrichten an das Team senden und verwalten.</p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            to="/tools/team-push/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
          >
            <BarChart3 size={14} /> Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neue Nachricht
          </button>
        </div>
      </div>

      {/* Compose Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-kore-white w-full max-w-lg p-xl sm:rounded-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-lg">
              <h2 className="font-display text-h3 text-kore-ink">Neue Nachricht</h2>
              <button onClick={() => setShowForm(false)} className="text-kore-mid hover:text-kore-ink"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Titel</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full border border-kore-border px-md py-sm text-body"
                  placeholder="Betreff der Nachricht..."
                  required
                />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Nachricht</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  rows={5}
                  className="w-full border border-kore-border px-md py-sm text-body"
                  placeholder="Nachrichtentext..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div>
                  <label className="block text-small text-kore-mid mb-xs">Prioritaet</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-kore-border px-md py-sm text-body"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Hoch</option>
                    <option value="URGENT">Dringend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-small text-kore-mid mb-xs">Zielgruppe</label>
                  <select
                    value={form.targetType}
                    onChange={e => setForm({ ...form, targetType: e.target.value })}
                    className="w-full border border-kore-border px-md py-sm text-body"
                  >
                    <option value="ALL">Alle</option>
                    <option value="STORE">Store</option>
                    <option value="ROLE">Rolle</option>
                  </select>
                </div>
              </div>

              {form.targetType === 'STORE' && stores && stores.length > 0 && (
                <div>
                  <label className="block text-small text-kore-mid mb-xs">Store waehlen</label>
                  <select
                    value={form.targetStoreIds}
                    onChange={e => setForm({ ...form, targetStoreIds: e.target.value })}
                    className="w-full border border-kore-border px-md py-sm text-body"
                  >
                    <option value="">-- Store waehlen --</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>)}
                  </select>
                </div>
              )}

              {form.priority === 'URGENT' && (
                <div className="bg-red-50 border border-red-200 p-md text-small text-red-700">
                  Dringende Nachrichten werden hervorgehoben dargestellt und erfordern eine Lesebestaetigung.
                </div>
              )}

              <div className="flex items-center justify-between pt-md">
                <div className="text-small text-kore-mid flex items-center gap-xs">
                  <Users size={14} />
                  {form.targetType === 'ALL' ? `${users?.length ?? 0} Empfaenger` :
                   form.targetType === 'STORE' ? 'Store-Mitarbeiter' : 'Rollenbasiert'}
                </div>
                <button
                  type="submit"
                  disabled={create.isPending}
                  className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={16} /> Senden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-sm mb-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kore-mid" />
          <input
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setPage(1); }}
            placeholder="Nachrichten durchsuchen..."
            className="w-full border border-kore-border pl-9 pr-md py-sm text-small"
          />
        </div>
        <select
          value={filterPriority}
          onChange={e => { setFilterPriority(e.target.value); setPage(1); }}
          className="border border-kore-border px-md py-sm text-small"
        >
          {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterTarget}
          onChange={e => { setFilterTarget(e.target.value); setPage(1); }}
          className="border border-kore-border px-md py-sm text-small"
        >
          <option value="">Alle Zielgruppen</option>
          <option value="ALL">Alle</option>
          <option value="STORE">Store</option>
          <option value="ROLE">Rolle</option>
        </select>
      </div>

      {/* Message List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Nachrichten...</div>
      ) : !messages.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          Noch keine Nachrichten vorhanden.
        </div>
      ) : (
        <div className="space-y-sm">
          {messages.map((m: any) => (
            <Link
              key={m.id}
              to={`/tools/team-push/messages/${m.id}`}
              className={`block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors ${PRIORITY_COLORS[m.priority] ?? ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  {PRIORITY_ICONS[m.priority]}
                  <span className="font-medium text-kore-ink">{m.title}</span>
                  {m.priority === 'URGENT' && (
                    <span className="px-xs py-0.5 bg-red-100 text-red-700 text-xs font-medium">DRINGEND</span>
                  )}
                </div>
                <div className="flex items-center gap-sm">
                  <span className="text-small text-kore-mid flex items-center gap-xs">
                    {m.targetType === 'STORE' ? <Building2 size={12} /> : <Users size={12} />}
                    {TARGET_LABELS[m.targetType] ?? m.targetType}
                  </span>
                </div>
              </div>
              <p className="text-small text-kore-mid mt-xs line-clamp-1">{m.body}</p>
              <div className="flex gap-md text-small text-kore-mid mt-sm">
                <span>{m.sender?.name ?? '--'}</span>
                <span>{formatDate(m.createdAt)}</span>
                <span className="text-kore-brass font-medium">{m._count?.reads ?? 0} gelesen</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-md mt-lg">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-small text-kore-mid">
            Seite {page} von {totalPages} ({result?.total ?? 0} Nachrichten)
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
