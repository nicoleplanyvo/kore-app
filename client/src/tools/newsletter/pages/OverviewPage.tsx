import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Newspaper, Plus, BarChart3, Search, Send, Archive, Copy,
  Eye, Layers, Calendar, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  useNewsletters, useCreateNewsletter, usePublishNewsletter,
  useArchiveNewsletter, useDuplicateNewsletter,
} from '../../../hooks/useNewsletter';

/* eslint-disable @typescript-eslint/no-explicit-any */

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Entwurf',
  PUBLISHED: 'Veroeffentlicht',
  ARCHIVED: 'Archiviert',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-blue-100 text-blue-700',
};

export function OverviewPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: result, isLoading } = useNewsletters({ status: statusFilter || undefined, search: search || undefined, page, pageSize });
  const newsletters = result?.data || [];
  const total = result?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const create = useCreateNewsletter();
  const publish = usePublishNewsletter();
  const archive = useArchiveNewsletter();
  const duplicate = useDuplicateNewsletter();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, {
      onSuccess: (data: any) => {
        setShowForm(false);
        setForm({ title: '', content: '' });
        if (data?.id) navigate(`/tools/newsletter/${data.id}`);
      },
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Newspaper size={24} /> Team Newsletter
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Interne Newsletter erstellen, verwalten und veroeffentlichen
          </p>
        </div>
        <div className="flex items-center gap-sm">
          <Link
            to="/tools/newsletter/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
          >
            <BarChart3 size={14} /> Analytics
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neuer Newsletter
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-lg space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Newsletter-Titel eingeben..."
              className="w-full border border-kore-border px-md py-sm text-body"
              required
            />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Einleitung (optional)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={3}
              placeholder="Kurze Einleitung oder Zusammenfassung..."
              className="w-full border border-kore-border px-md py-sm text-body"
            />
          </div>
          <div className="flex items-center gap-sm">
            <button
              type="submit"
              disabled={create.isPending}
              className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {create.isPending ? 'Wird angelegt...' : 'Newsletter anlegen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-sm mb-lg">
        <form onSubmit={handleSearch} className="flex items-center gap-xs">
          <div className="relative">
            <Search size={14} className="absolute left-sm top-1/2 -translate-y-1/2 text-kore-mid" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Suchen..."
              className="border border-kore-border pl-xl pr-md py-sm text-small w-56"
            />
          </div>
        </form>

        <div className="flex gap-xs">
          {[
            { key: '', label: 'Alle' },
            { key: 'DRAFT', label: 'Entwuerfe' },
            { key: 'PUBLISHED', label: 'Veroeffentlicht' },
            { key: 'ARCHIVED', label: 'Archiviert' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setStatusFilter(f.key); setPage(1); }}
              className={`px-md py-sm text-small border ${
                statusFilter === f.key
                  ? 'bg-kore-ink text-kore-white border-kore-ink'
                  : 'border-kore-border text-kore-mid hover:text-kore-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-small text-kore-mid ml-auto">{total} Newsletter</span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-body text-kore-mid p-xl text-center">Lade Newsletter...</div>
      ) : !newsletters.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">
          {search || statusFilter
            ? 'Keine Newsletter fuer diese Filter gefunden.'
            : 'Noch keine Newsletter vorhanden. Erstellen Sie den ersten Newsletter.'}
        </div>
      ) : (
        <div className="space-y-sm">
          {newsletters.map((n: any) => (
            <div
              key={n.id}
              className="bg-kore-white border border-kore-border hover:border-kore-ink transition-colors"
            >
              <div className="flex items-start gap-md p-md">
                <Link to={`/tools/newsletter/${n.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-sm mb-xs">
                    <span className="font-medium text-kore-ink truncate">{n.title}</span>
                    <span
                      className={`px-sm py-xs text-xs shrink-0 ${
                        STATUS_COLORS[n.status] ?? 'bg-kore-bg text-kore-mid'
                      }`}
                    >
                      {STATUS_LABELS[n.status] ?? n.status}
                    </span>
                  </div>
                  {n.content && (
                    <p className="text-small text-kore-mid line-clamp-1 mb-xs">{n.content}</p>
                  )}
                  <div className="flex flex-wrap gap-md text-xs text-kore-mid">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(n.createdAt).toLocaleDateString('de-DE')}
                    </span>
                    {n.creator?.name && <span>{n.creator.name}</span>}
                    <span className="flex items-center gap-1">
                      <Layers size={12} />
                      {n._count?.sections ?? 0} Abschnitte
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {n._count?.views ?? 0} Aufrufe
                    </span>
                    {n.publishedAt && (
                      <span className="text-emerald-600">
                        Veroeffentlicht: {new Date(n.publishedAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-xs shrink-0">
                  {n.status === 'DRAFT' && (
                    <button
                      onClick={() => publish.mutate(n.id)}
                      title="Veroeffentlichen"
                      className="p-sm text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
                    >
                      <Send size={14} />
                    </button>
                  )}
                  {n.status === 'PUBLISHED' && (
                    <button
                      onClick={() => archive.mutate(n.id)}
                      title="Archivieren"
                      className="p-sm text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200"
                    >
                      <Archive size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => duplicate.mutate(n.id)}
                    title="Duplizieren"
                    className="p-sm text-kore-mid hover:text-kore-ink border border-transparent hover:border-kore-border"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm mt-lg">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="p-sm border border-kore-border text-kore-mid hover:text-kore-ink disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-small text-kore-mid">
            Seite {page} von {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
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
