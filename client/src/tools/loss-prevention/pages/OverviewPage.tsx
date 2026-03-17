import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Plus,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import { useLossIncidents, useLossStores, useLossDashboard } from '../../../hooks/useLossPrevention';

/* ── Maps ───────────────────────────────────────────────────── */

const CATEGORY_LABELS: Record<string, string> = {
  THEFT: 'Diebstahl extern',
  ADMIN_ERROR: 'Kassenfehlbuchung',
  DAMAGE: 'Beschädigung',
  SUPPLIER: 'WE-Differenz',
  OTHER: 'Sonstige',
};

const CATEGORY_STYLES: Record<string, string> = {
  THEFT: 'bg-red-50 text-red-700 border-red-200',
  ADMIN_ERROR: 'bg-violet-50 text-violet-700 border-violet-200',
  DAMAGE: 'bg-orange-50 text-orange-700 border-orange-200',
  SUPPLIER: 'bg-sky-50 text-sky-700 border-sky-200',
  OTHER: 'bg-kore-bg text-kore-mid border-kore-border',
};

const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-300 animate-pulse',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  INVESTIGATING: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  INVESTIGATING: 'In Untersuchung',
  RESOLVED: 'Gelöst',
  CLOSED: 'Geschlossen',
};

/* ── Helper ─────────────────────────────────────────────────── */

function formatEUR(val: number) {
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

/* ── Component ──────────────────────────────────────────────── */

export function OverviewPage() {
  const navigate = useNavigate();
  const [storeId, setStoreId] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: stores } = useLossStores();
  const { data: dashboard } = useLossDashboard({ storeId: storeId || undefined });

  const { data, isLoading } = useLossIncidents({
    storeId: storeId || undefined,
    category: category || undefined,
    status: status || undefined,
    severity: severity || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    page,
  });

  const incidents = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 20;
  const totalPages = Math.ceil(total / pageSize);

  const openCount = dashboard?.byStatus?.find((s: any) => s.status === 'OPEN')?.count ?? 0;
  const investigatingCount = dashboard?.byStatus?.find((s: any) => s.status === 'INVESTIGATING')?.count ?? 0;

  const selectClass = 'border border-kore-border px-md py-sm text-small bg-kore-white focus:outline-none focus:border-kore-brass';

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl flex-wrap gap-md">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Loss Prevention</h1>
          <p className="text-body text-kore-mid mt-xs">
            Schwund-Tracking, Vorfallmeldung und Praevention
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/loss-prevention/dashboard"
            className="flex items-center gap-sm border border-kore-border px-lg py-md-sm text-small font-medium uppercase tracking-widest text-kore-ink hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} />
            Dashboard
          </Link>
          <Link
            to="/tools/loss-prevention/report"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} />
            Vorfall melden
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Offen</span>
          <div className="font-display text-h2 text-red-600 mt-sm">{openCount}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">In Bearbeitung</span>
          <div className="font-display text-h2 text-amber-600 mt-sm">{investigatingCount}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamtschaden</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">
            {formatEUR(dashboard?.totalAmount ?? 0)}
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Schwundquote</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">
            {dashboard?.shrinkageRate != null ? `${dashboard.shrinkageRate.toFixed(2)}%` : '--'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-md mb-xl">
        <select
          value={storeId}
          onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
          className={selectClass}
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-sm border border-kore-border px-md py-sm text-small hover:bg-kore-bg transition-colors ${showFilters ? 'bg-kore-bg' : 'bg-kore-white'}`}
        >
          <Filter size={14} />
          Filter
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-md mb-xl bg-kore-white border border-kore-border p-lg">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className={selectClass}
          >
            <option value="">Alle Kategorien</option>
            <option value="THEFT">Diebstahl extern</option>
            <option value="ADMIN_ERROR">Kassenfehlbuchung</option>
            <option value="DAMAGE">Beschaedigung</option>
            <option value="SUPPLIER">WE-Differenz</option>
            <option value="OTHER">Sonstige</option>
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className={selectClass}
          >
            <option value="">Alle Status</option>
            <option value="OPEN">Offen</option>
            <option value="INVESTIGATING">In Untersuchung</option>
            <option value="RESOLVED">Geloest</option>
            <option value="CLOSED">Geschlossen</option>
          </select>

          <select
            value={severity}
            onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
            className={selectClass}
          >
            <option value="">Alle Schweregrade</option>
            <option value="LOW">Niedrig</option>
            <option value="MEDIUM">Mittel</option>
            <option value="HIGH">Hoch</option>
            <option value="CRITICAL">Kritisch</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className={selectClass}
            placeholder="Von"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className={selectClass}
            placeholder="Bis"
          />

          {(category || status || severity || fromDate || toDate) && (
            <button
              onClick={() => {
                setCategory('');
                setStatus('');
                setSeverity('');
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
              className="text-small text-kore-mid hover:text-kore-ink underline"
            >
              Zuruecksetzen
            </button>
          )}
        </div>
      )}

      {/* Incident List */}
      {isLoading ? (
        <div className="text-body text-kore-mid py-xl">Lade Vorfaelle...</div>
      ) : incidents.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <ShieldAlert size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Vorfaelle gefunden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erfassen Sie Diebstaehle, Schaeden und andere Verluste, um Muster zu erkennen und Praevention zu verbessern.
          </p>
          <Link
            to="/tools/loss-prevention/report"
            className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"
          >
            <Plus size={16} />
            Vorfall melden
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-kore-white border border-kore-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md">Datum</th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md">Kategorie</th>
                  <th className="text-left text-caption text-kore-mid uppercase tracking-widest px-lg py-md">Beschreibung</th>
                  <th className="text-right text-caption text-kore-mid uppercase tracking-widest px-lg py-md">Betrag</th>
                  <th className="text-center text-caption text-kore-mid uppercase tracking-widest px-lg py-md">Schwere</th>
                  <th className="text-center text-caption text-kore-mid uppercase tracking-widest px-lg py-md">Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc: any) => (
                  <tr
                    key={inc.id}
                    className="border-b border-kore-border last:border-0 hover:bg-kore-bg cursor-pointer transition-colors"
                    onClick={() => navigate(`/tools/loss-prevention/incident/${inc.id}`)}
                  >
                    <td className="px-lg py-md text-small text-kore-ink whitespace-nowrap">
                      {new Date(inc.incidentDate).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-lg py-md">
                      <span className={`text-small font-medium px-sm py-px border inline-block ${CATEGORY_STYLES[inc.category] ?? CATEGORY_STYLES.OTHER}`}>
                        {CATEGORY_LABELS[inc.category] ?? inc.category}
                      </span>
                    </td>
                    <td className="px-lg py-md text-small text-kore-ink max-w-xs truncate">
                      {inc.description?.replace(/\[Bereich:[^\]]+\]\s*/g, '').substring(0, 80)}
                    </td>
                    <td className="px-lg py-md text-small text-kore-ink text-right font-medium whitespace-nowrap">
                      {formatEUR(Number(inc.amount))}
                    </td>
                    <td className="px-lg py-md text-center">
                      <span className={`text-small font-medium px-sm py-px border inline-block ${SEVERITY_STYLES[inc.severity] ?? ''}`}>
                        {SEVERITY_LABELS[inc.severity] ?? inc.severity}
                      </span>
                    </td>
                    <td className="px-lg py-md text-center">
                      <span className={`text-small font-medium px-md py-xs border inline-block ${STATUS_STYLES[inc.status] ?? ''}`}>
                        {STATUS_LABELS[inc.status] ?? inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-md">
            {incidents.map((inc: any) => (
              <div
                key={inc.id}
                className="bg-kore-white border border-kore-border p-lg cursor-pointer hover:border-kore-brass transition-colors"
                onClick={() => navigate(`/tools/loss-prevention/incident/${inc.id}`)}
              >
                <div className="flex items-center justify-between mb-sm">
                  <span className={`text-small font-medium px-sm py-px border ${CATEGORY_STYLES[inc.category] ?? CATEGORY_STYLES.OTHER}`}>
                    {CATEGORY_LABELS[inc.category] ?? inc.category}
                  </span>
                  <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[inc.status] ?? ''}`}>
                    {STATUS_LABELS[inc.status] ?? inc.status}
                  </span>
                </div>
                <p className="text-small text-kore-ink line-clamp-2 mb-sm">
                  {inc.description?.replace(/\[Bereich:[^\]]+\]\s*/g, '').substring(0, 120)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-small text-kore-mid">
                    {new Date(inc.incidentDate).toLocaleDateString('de-DE')}
                  </span>
                  <div className="flex items-center gap-sm">
                    <span className={`text-small font-medium px-sm py-px border ${SEVERITY_STYLES[inc.severity] ?? ''}`}>
                      {SEVERITY_LABELS[inc.severity] ?? inc.severity}
                    </span>
                    <span className="text-small font-medium text-kore-ink">{formatEUR(Number(inc.amount))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">
                {total} Vorfaelle &middot; Seite {page} von {totalPages}
              </span>
              <div className="flex gap-sm">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"
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
