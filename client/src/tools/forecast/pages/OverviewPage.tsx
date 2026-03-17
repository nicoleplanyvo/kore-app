import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  BarChart3,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';
import {
  useForecastStores,
  useForecasts,
  useCreateForecast,
  useUpdateForecast,
  useDeleteForecast,
} from '../../../hooks/useForecast';

const TYPE_OPTIONS = [
  { value: 'REVENUE', label: 'Umsatz (EUR)' },
  { value: 'TRANSACTIONS', label: 'Transaktionen' },
  { value: 'FOOTFALL', label: 'Frequenz' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  REVENUE: 'Umsatz',
  TRANSACTIONS: 'Transaktionen',
  FOOTFALL: 'Frequenz',
};

const METHOD_LABELS: Record<string, string> = {
  MANUAL: 'Manuell',
  TREND: 'Trend',
  AI: 'KI',
};

function formatNumber(value: number, type: string): string {
  if (type === 'REVENUE') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat('de-DE').format(value);
}

function deviationColor(deviation: number | null): string {
  if (deviation === null) return 'text-kore-mid';
  const abs = Math.abs(deviation);
  if (abs < 5) return 'text-emerald-600';
  if (abs < 15) return 'text-amber-600';
  return 'text-red-600';
}

function deviationBg(deviation: number | null): string {
  if (deviation === null) return 'bg-kore-bg text-kore-mid';
  const abs = Math.abs(deviation);
  if (abs < 5) return 'bg-emerald-50 text-emerald-700';
  if (abs < 15) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OverviewPage() {
  const { data: stores } = useForecastStores();
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // Auto-select first store
  const storeId = selectedStore || stores?.[0]?.id || '';

  const { data: forecastData, isLoading } = useForecasts({
    storeId: storeId || undefined,
    type: filterType || undefined,
    from: filterFrom || undefined,
    to: filterTo || undefined,
    page,
  });

  const createForecast = useCreateForecast();
  const updateForecast = useUpdateForecast();
  const deleteForecast = useDeleteForecast();

  // Quick-entry form state
  const [form, setForm] = useState({
    period: todayStr(),
    forecastType: 'REVENUE',
    forecastValue: '',
    notes: '',
  });

  // Inline actual value entry
  const [editingActual, setEditingActual] = useState<string | null>(null);
  const [actualInput, setActualInput] = useState('');

  // Inline edit
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ forecastValue: '', notes: '' });

  const totalPages = useMemo(
    () => (forecastData ? Math.ceil(forecastData.total / forecastData.pageSize) : 1),
    [forecastData],
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    createForecast.mutate(
      {
        storeId,
        period: form.period,
        forecastType: form.forecastType,
        forecastValue: Number(form.forecastValue),
        method: 'MANUAL',
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          setForm({ period: todayStr(), forecastType: 'REVENUE', forecastValue: '', notes: '' });
          setShowForm(false);
        },
      },
    );
  };

  const handleActualSave = (id: string) => {
    updateForecast.mutate(
      { id, actualValue: Number(actualInput) },
      { onSuccess: () => { setEditingActual(null); setActualInput(''); } },
    );
  };

  const handleEditSave = (id: string) => {
    updateForecast.mutate(
      {
        id,
        forecastValue: Number(editForm.forecastValue),
        notes: editForm.notes || undefined,
      },
      { onSuccess: () => setEditingRow(null) },
    );
  };

  const handleDelete = (id: string) => {
    deleteForecast.mutate(id);
  };

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <TrendingUp size={24} /> Forecast
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Prognosen erstellen, Ist-Werte eintragen und Abweichungen verfolgen.
          </p>
        </div>
        <div className="flex items-center gap-md">
          <Link
            to="/tools/forecast/dashboard"
            className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:bg-kore-bg transition-colors"
          >
            <BarChart3 size={16} /> Dashboard
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Neue Prognose
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

      {/* Quick-entry form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md">Neue Prognose</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Datum / Periode</label>
              <input
                type="date"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                required
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Typ</label>
              <select
                value={form.forecastType}
                onChange={(e) => setForm({ ...form, forecastType: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Prognosewert</label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.forecastValue}
                onChange={(e) => setForm({ ...form, forecastValue: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder={form.forecastType === 'REVENUE' ? '0.00' : '0'}
                required
              />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Notizen</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full border border-kore-border px-md py-sm text-body"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button
              type="submit"
              disabled={createForecast.isPending}
              className="px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              {createForecast.isPending ? 'Speichern...' : 'Prognose erstellen'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-lg py-sm border border-kore-border text-kore-mid text-small hover:text-kore-ink"
            >
              Abbrechen
            </button>
          </div>
          {createForecast.isError && (
            <p className="text-small text-red-600 mt-sm">{(createForecast.error as Error).message}</p>
          )}
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-md mb-lg">
        <div>
          <label className="block text-small text-kore-mid mb-xs">Typ</label>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small"
          >
            <option value="">Alle Typen</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Von</label>
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small"
          />
        </div>
        <div>
          <label className="block text-small text-kore-mid mb-xs">Bis</label>
          <input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-small"
          />
        </div>
        {(filterType || filterFrom || filterTo) && (
          <button
            onClick={() => { setFilterType(''); setFilterFrom(''); setFilterTo(''); setPage(1); }}
            className="text-small text-kore-mid hover:text-kore-ink underline"
          >
            Filter zuruecksetzen
          </button>
        )}
      </div>

      {/* Forecast table */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Prognosen...</div>
      ) : !forecastData?.data?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <TrendingUp size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Prognosen vorhanden</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie Ihre erste Prognose fuer diesen Store.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <Plus size={16} /> Erste Prognose erstellen
          </button>
        </div>
      ) : (
        <>
          <div className="bg-kore-white border border-kore-border overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="text-left px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Datum</th>
                  <th className="text-left px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Typ</th>
                  <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Prognose</th>
                  <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Ist-Wert</th>
                  <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Abweichung</th>
                  <th className="text-center px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Methode</th>
                  <th className="text-right px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {forecastData.data.map((f: any) => (
                  <tr key={f.id} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50 transition-colors">
                    <td className="px-md py-sm text-kore-ink">
                      {new Date(f.period).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-md py-sm text-kore-ink">
                      {TYPE_LABELS[f.forecastType] ?? f.forecastType}
                    </td>
                    <td className="px-md py-sm text-right text-kore-ink font-medium">
                      {editingRow === f.id ? (
                        <input
                          type="number"
                          step="any"
                          value={editForm.forecastValue}
                          onChange={(e) => setEditForm({ ...editForm, forecastValue: e.target.value })}
                          className="w-24 border border-kore-border px-sm py-xs text-right text-small"
                        />
                      ) : (
                        formatNumber(f.forecastValue, f.forecastType)
                      )}
                    </td>
                    <td className="px-md py-sm text-right">
                      {editingActual === f.id ? (
                        <div className="flex items-center justify-end gap-xs">
                          <input
                            type="number"
                            step="any"
                            value={actualInput}
                            onChange={(e) => setActualInput(e.target.value)}
                            className="w-24 border border-kore-border px-sm py-xs text-right text-small"
                            autoFocus
                          />
                          <button
                            onClick={() => handleActualSave(f.id)}
                            disabled={updateForecast.isPending}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingActual(null)}
                            className="text-kore-mid hover:text-kore-ink"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : f.actualValue !== null ? (
                        <span className="font-medium text-kore-ink">
                          {formatNumber(f.actualValue, f.forecastType)}
                        </span>
                      ) : (
                        <button
                          onClick={() => { setEditingActual(f.id); setActualInput(''); }}
                          className="flex items-center gap-xs text-kore-brass hover:text-kore-ink text-small ml-auto"
                        >
                          <ClipboardCheck size={12} /> Ist-Wert eintragen
                        </button>
                      )}
                    </td>
                    <td className="px-md py-sm text-right">
                      {f.deviation !== null ? (
                        <span className={`inline-block px-sm py-xs text-small font-medium ${deviationBg(f.deviation)}`}>
                          {f.deviation > 0 ? '+' : ''}{f.deviation.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-kore-mid">--</span>
                      )}
                    </td>
                    <td className="px-md py-sm text-center text-kore-mid">
                      {METHOD_LABELS[f.method] ?? f.method}
                    </td>
                    <td className="px-md py-sm text-right">
                      {editingRow === f.id ? (
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            onClick={() => handleEditSave(f.id)}
                            disabled={updateForecast.isPending}
                            className="text-emerald-600 hover:text-emerald-800"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingRow(null)}
                            className="text-kore-mid hover:text-kore-ink"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-xs">
                          <button
                            onClick={() => {
                              setEditingRow(f.id);
                              setEditForm({
                                forecastValue: String(f.forecastValue),
                                notes: f.notes ?? '',
                              });
                            }}
                            className="text-kore-mid hover:text-kore-ink"
                            title="Bearbeiten"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(f.id)}
                            disabled={deleteForecast.isPending}
                            className="text-kore-mid hover:text-red-600"
                            title="Loeschen"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-lg">
              <span className="text-small text-kore-mid">
                Seite {forecastData.page} von {totalPages} ({forecastData.total} Eintraege)
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
