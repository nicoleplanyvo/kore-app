import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Pencil, Check, X } from 'lucide-react';
import {
  useBudgetStores,
  useBudgetForecast,
  useCreateTarget,
  useCreateActual,
  useUpdateActual,
  useImportTargets,
} from '../../../hooks/useBudget';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtEur(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

export function DetailPage() {
  const { data: stores } = useBudgetStores();
  const [storeId, setStoreId] = useState('');
  const [month, setMonth] = useState(currentMonth());

  const effectiveStoreId = storeId || (stores && stores.length > 0 ? stores[0].id : '');
  const { data: forecast, isLoading } = useBudgetForecast(effectiveStoreId || undefined, month);

  // Target form
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [targetAmount, setTargetAmount] = useState('');
  const [minTargetAmount, setMinTargetAmount] = useState('');
  const createTarget = useCreateTarget();

  // CSV import
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState('');
  const importTargets = useImportTargets();

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const updateActual = useUpdateActual();

  // Add actual
  const [addDate, setAddDate] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const createActual = useCreateActual();

  const handleSetTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStoreId || !targetAmount) return;
    createTarget.mutate(
      {
        storeId: effectiveStoreId,
        period: month,
        targetRevenue: parseFloat(targetAmount),
        minTarget: minTargetAmount ? parseFloat(minTargetAmount) : undefined,
      },
      { onSuccess: () => { setShowTargetForm(false); setTargetAmount(''); setMinTargetAmount(''); } },
    );
  };

  const handleImportCsv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStoreId || !csvText.trim()) return;
    // Parse CSV: period;targetRevenue;minTarget
    const lines = csvText.trim().split('\n').filter((l) => l.trim());
    const entries = lines.map((line) => {
      const parts = line.split(/[;,\t]/).map((p) => p.trim());
      return {
        period: parts[0],
        targetRevenue: parseFloat(parts[1] || '0'),
        minTarget: parts[2] ? parseFloat(parts[2]) : undefined,
      };
    }).filter((e) => /^\d{4}-\d{2}$/.test(e.period) && e.targetRevenue >= 0);

    if (entries.length === 0) return;
    importTargets.mutate(
      { storeId: effectiveStoreId, entries },
      { onSuccess: () => { setShowImport(false); setCsvText(''); } },
    );
  };

  const handleAddActual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveStoreId || !addDate || !addAmount) return;
    createActual.mutate(
      { storeId: effectiveStoreId, date: addDate, amount: parseFloat(addAmount), description: addDesc || undefined },
      { onSuccess: () => { setAddDate(''); setAddAmount(''); setAddDesc(''); } },
    );
  };

  const handleSaveEdit = (id: string) => {
    updateActual.mutate(
      { id, amount: parseFloat(editAmount) },
      { onSuccess: () => setEditingId(null) },
    );
  };

  // Chart: cumulative Soll vs Ist
  const dailyData = forecast?.dailyData ?? [];
  const maxVal = dailyData.length > 0 ? Math.max(...dailyData.map((d: any) => Math.max(d.cumSoll, d.cumIst))) : 1;

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/budget" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">Monatsdetail</h1>
          <p className="text-body text-kore-mid mt-xs">Tageseintraege, kumulativer Verlauf und Ziele verwalten</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-xl">
        <select
          value={effectiveStoreId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          {(stores ?? []).map((s: { id: string; name: string }) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        />
        <button
          onClick={() => setShowTargetForm(!showTargetForm)}
          className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
        >
          <Save size={14} /> Soll setzen
        </button>
        <button
          onClick={() => setShowImport(!showImport)}
          className="flex items-center gap-xs px-md py-sm border border-kore-border text-small text-kore-mid hover:text-kore-ink transition-colors"
        >
          <Upload size={14} /> CSV Import
        </button>
      </div>

      {/* Target Form */}
      {showTargetForm && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h3 className="font-display text-h3 text-kore-ink mb-md">Soll-Ziel fuer {month}</h3>
          <form onSubmit={handleSetTarget} className="flex flex-wrap items-end gap-md">
            <div>
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Umsatzziel (EUR)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder={forecast?.targetRevenue ? String(forecast.targetRevenue) : '0'}
                required
                className="border border-kore-border px-md py-sm text-small bg-kore-white w-40"
              />
            </div>
            <div>
              <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Mindestziel (EUR)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={minTargetAmount}
                onChange={(e) => setMinTargetAmount(e.target.value)}
                placeholder={forecast?.minTarget ? String(forecast.minTarget) : 'optional'}
                className="border border-kore-border px-md py-sm text-small bg-kore-white w-40"
              />
            </div>
            <button
              type="submit"
              disabled={createTarget.isPending}
              className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
            >
              {createTarget.isPending ? 'Speichern...' : 'Speichern'}
            </button>
          </form>
          {createTarget.isError && <p className="text-small text-red-600 mt-sm">{(createTarget.error as Error).message}</p>}
        </div>
      )}

      {/* CSV Import */}
      {showImport && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h3 className="font-display text-h3 text-kore-ink mb-md">CSV-Import (Soll-Ziele)</h3>
          <p className="text-small text-kore-mid mb-md">Format: Periode;Umsatzziel;Mindestziel (eine Zeile pro Monat, z.B. 2026-01;50000;40000)</p>
          <form onSubmit={handleImportCsv}>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={5}
              placeholder="2026-01;50000;40000&#10;2026-02;55000;45000"
              className="border border-kore-border px-md py-sm text-small bg-kore-white w-full mb-md font-mono"
            />
            <button
              type="submit"
              disabled={importTargets.isPending}
              className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
            >
              {importTargets.isPending ? 'Importieren...' : 'Importieren'}
            </button>
          </form>
          {importTargets.isSuccess && <p className="text-small text-emerald-600 mt-sm">Import erfolgreich.</p>}
          {importTargets.isError && <p className="text-small text-red-600 mt-sm">{(importTargets.error as Error).message}</p>}
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : !forecast ? (
        <div className="text-body text-kore-mid">Keine Daten fuer diesen Monat.</div>
      ) : (
        <>
          {/* Cumulative Chart (Soll-Linie vs Ist-Balken) */}
          <div className="bg-kore-white border border-kore-border p-xl mb-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Kumulativ: Soll vs Ist</h2>
            <div className="relative h-48 flex items-end gap-px">
              {dailyData.map((d: any, i: number) => {
                const sollH = maxVal > 0 ? (d.cumSoll / maxVal) * 100 : 0;
                const istH = maxVal > 0 ? (d.cumIst / maxVal) * 100 : 0;
                const isToday = d.date === new Date().toISOString().slice(0, 10);
                return (
                  <div
                    key={i}
                    className={`flex-1 relative group ${isToday ? 'bg-kore-bg/50' : ''}`}
                    title={`${fmtDate(d.date)}\nSoll: ${fmtEur(d.cumSoll)}\nIst: ${fmtEur(d.cumIst)}`}
                  >
                    {/* Soll line dot */}
                    <div
                      className="absolute w-full flex justify-center"
                      style={{ bottom: `${sollH}%` }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-kore-mid" />
                    </div>
                    {/* Ist bar */}
                    <div
                      className="absolute bottom-0 left-[15%] right-[15%] bg-kore-ink/80 group-hover:bg-kore-brass transition-colors"
                      style={{ height: `${istH}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-sm text-small text-kore-faint">
              <span>1.</span>
              <span>{forecast.totalDays}.</span>
            </div>
            <div className="flex gap-lg mt-md">
              <span className="flex items-center gap-xs text-small text-kore-mid">
                <span className="inline-block w-3 h-3 rounded-full bg-kore-mid" /> Soll (kumulativ)
              </span>
              <span className="flex items-center gap-xs text-small text-kore-mid">
                <span className="inline-block w-3 h-3 bg-kore-ink/80" /> Ist (kumulativ)
              </span>
            </div>
          </div>

          {/* Daily Entries Table */}
          <div className="bg-kore-white border border-kore-border mb-xl">
            <div className="flex items-center justify-between p-lg border-b border-kore-border">
              <h2 className="font-display text-h3 text-kore-ink">Tageseintraege</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-small">
                <thead>
                  <tr className="border-b border-kore-border bg-kore-bg">
                    <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Tag</th>
                    <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Soll (Tag)</th>
                    <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Ist</th>
                    <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Diff</th>
                    <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Kum. Soll</th>
                    <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Kum. Ist</th>
                    <th className="px-lg py-md w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {dailyData.map((d: any) => {
                    const diff = d.ist - d.soll;
                    const actualEntry = (forecast as any)?.dailyData ? undefined : null; // we use the flat data
                    return (
                      <tr key={d.date} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/40">
                        <td className="px-lg py-md text-kore-ink">{fmtDate(d.date)}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{fmtEur(d.soll)}</td>
                        <td className="px-lg py-md text-right text-kore-ink font-medium">
                          {editingId === d.date ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="border border-kore-border px-sm py-xs text-small w-24 text-right"
                              autoFocus
                            />
                          ) : d.ist > 0 ? (
                            fmtEur(d.ist)
                          ) : (
                            <span className="text-kore-faint">-</span>
                          )}
                        </td>
                        <td className={`px-lg py-md text-right ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {d.ist > 0 ? (diff >= 0 ? '+' : '') + fmtEur(diff) : '-'}
                        </td>
                        <td className="px-lg py-md text-right text-kore-mid">{fmtEur(d.cumSoll)}</td>
                        <td className="px-lg py-md text-right text-kore-ink">{d.cumIst > 0 ? fmtEur(d.cumIst) : '-'}</td>
                        <td className="px-lg py-md text-right">
                          {editingId === d.date ? (
                            <div className="flex gap-xs justify-end">
                              <button onClick={() => handleSaveEdit(d.date)} className="text-emerald-600 hover:text-emerald-800"><Check size={14} /></button>
                              <button onClick={() => setEditingId(null)} className="text-kore-mid hover:text-kore-ink"><X size={14} /></button>
                            </div>
                          ) : d.ist > 0 ? (
                            <button
                              onClick={() => { setEditingId(d.date); setEditAmount(String(d.ist)); }}
                              className="text-kore-faint hover:text-kore-ink"
                            >
                              <Pencil size={14} />
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Entry */}
          <div className="bg-kore-white border border-kore-border p-xl">
            <h2 className="font-display text-h3 text-kore-ink mb-lg">Ist-Wert hinzufuegen</h2>
            <form onSubmit={handleAddActual} className="flex flex-wrap items-end gap-md">
              <div>
                <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Datum</label>
                <input
                  type="date"
                  value={addDate}
                  onChange={(e) => setAddDate(e.target.value)}
                  required
                  className="border border-kore-border px-md py-sm text-small bg-kore-white"
                />
              </div>
              <div>
                <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Umsatz (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  required
                  className="border border-kore-border px-md py-sm text-small bg-kore-white w-36"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-caption text-kore-mid uppercase tracking-widest mb-xs">Beschreibung</label>
                <input
                  type="text"
                  value={addDesc}
                  onChange={(e) => setAddDesc(e.target.value)}
                  placeholder="Optional"
                  className="border border-kore-border px-md py-sm text-small bg-kore-white w-full"
                />
              </div>
              <button
                type="submit"
                disabled={createActual.isPending}
                className="bg-kore-ink text-kore-white px-lg py-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors disabled:opacity-50"
              >
                {createActual.isPending ? 'Speichern...' : 'Erfassen'}
              </button>
            </form>
            {createActual.isError && <p className="text-small text-red-600 mt-sm">{(createActual.error as Error).message}</p>}
          </div>
        </>
      )}
    </div>
  );
}
