import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingDown,
  Target,
  Package,
  Users,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import {
  useInventoryStores,
  useInventoryDashboard,
} from '../../../hooks/useInventory';

export function DashboardPage() {
  const [storeId, setStoreId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data: stores } = useInventoryStores();
  const { data: dashboard, isLoading } = useInventoryDashboard({
    storeId: storeId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link
          to="/tools/inventory"
          className="text-kore-mid hover:text-kore-ink transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Inventur-Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">
            Auswertungen, Trends und Mitarbeiter-Ranking
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-md mb-xl">
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="border border-kore-border px-md py-sm text-small bg-kore-white"
        >
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: { id: string; name: string; city?: string }) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.city ? ` (${s.city})` : ''}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-sm">
          <label className="text-small text-kore-mid">Von:</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-kore-border px-md py-sm text-small bg-kore-white"
          />
        </div>
        <div className="flex items-center gap-sm">
          <label className="text-small text-kore-mid">Bis:</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-kore-border px-md py-sm text-small bg-kore-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : !dashboard ? (
        <div className="text-body text-kore-mid">Keine Daten verfuegbar.</div>
      ) : (
        <>
          {/* KPI Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-2xl">
            <KpiTile
              icon={Package}
              label="Inventuren gesamt"
              value={String(dashboard.totalCounts)}
              sub={`${dashboard.completedCounts} abgeschlossen, ${dashboard.inProgressCounts} laufend`}
            />
            <KpiTile
              icon={TrendingDown}
              label="Durchschnittliche Abweichung"
              value={`${dashboard.avgDiscrepancyRate}%`}
              sub="Positionen mit Differenz"
              highlight={dashboard.avgDiscrepancyRate > 5}
            />
            <KpiTile
              icon={AlertTriangle}
              label="Schwund-Wert"
              value={Number(dashboard.shrinkageValue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              sub="Gesamter Abweichungsbetrag"
              highlight={dashboard.shrinkageValue > 0}
            />
            <KpiTile
              icon={Target}
              label="Genauigkeit"
              value={`${dashboard.accuracy}%`}
              sub="Korrekte Positionen"
              positive={dashboard.accuracy >= 95}
            />
          </div>

          {/* Discrepancy Trend */}
          {dashboard.trend && dashboard.trend.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <BarChart3 size={18} /> Abweichungs-Trend
              </h2>
              <div className="flex items-end gap-sm h-40">
                {dashboard.trend.map((t: any, idx: number) => {
                  const maxVal = Math.max(
                    ...dashboard.trend.map((x: any) => x.discrepancies || 0),
                    1
                  );
                  const pct = ((t.discrepancies || 0) / maxVal) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center gap-xs"
                    >
                      <span className="text-small text-kore-mid font-medium">
                        {t.discrepancies || 0}
                      </span>
                      <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                        <div
                          className="w-full max-w-[40px] bg-kore-brass/60 hover:bg-kore-brass transition-colors rounded-t"
                          style={{ height: `${Math.max(pct, 4)}%` }}
                          title={`${t.store?.name || ''}: ${t.discrepancies} Differenzen`}
                        />
                      </div>
                      <span className="text-small text-kore-faint text-center leading-tight">
                        {new Date(t.countDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Discrepancy Items */}
          {dashboard.topDiscrepancyItems && dashboard.topDiscrepancyItems.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <AlertTriangle size={18} /> Top Abweichungen
              </h2>
              <div className="border border-kore-border overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-kore-border bg-kore-bg">
                      <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">SKU</th>
                      <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Produkt</th>
                      <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Kategorie</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Soll</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Ist</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Differenz</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.topDiscrepancyItems.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-kore-border last:border-0">
                        <td className="px-lg py-md text-kore-ink font-mono">{item.sku}</td>
                        <td className="px-lg py-md text-kore-ink">{item.productName}</td>
                        <td className="px-lg py-md text-kore-mid">{item.category || '-'}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{item.expectedQty}</td>
                        <td className="px-lg py-md text-right text-kore-ink">{item.actualQty}</td>
                        <td className="px-lg py-md text-right font-medium text-red-600">
                          {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                        </td>
                        <td className="px-lg py-md text-right text-red-600">
                          {Math.abs(item.discrepancyValue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Staff Accuracy Ranking */}
          {dashboard.staffRanking && dashboard.staffRanking.length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl mb-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <Users size={18} /> Mitarbeiter-Genauigkeit
              </h2>
              <div className="space-y-md">
                {dashboard.staffRanking.map((staff: any, idx: number) => (
                  <div key={staff.userId} className="flex items-center gap-lg">
                    <span className="w-8 text-center font-display text-h3 text-kore-brass">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-xs">
                        <span className="text-body text-kore-ink font-medium">{staff.name}</span>
                        <span className={`text-small font-medium ${staff.accuracy >= 95 ? 'text-emerald-600' : staff.accuracy >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                          {staff.accuracy}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-kore-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all rounded-full ${
                            staff.accuracy >= 95
                              ? 'bg-emerald-500'
                              : staff.accuracy >= 90
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${staff.accuracy}%` }}
                        />
                      </div>
                      <div className="flex gap-lg mt-xs">
                        <span className="text-small text-kore-mid">
                          {staff.counted} Positionen gezaehlt
                        </span>
                        <span className="text-small text-kore-mid">
                          {staff.discrepancies} Differenzen
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Comparison */}
          {dashboard.storeComparison && dashboard.storeComparison.length > 1 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
                <BarChart3 size={18} /> Store-Vergleich
              </h2>
              <div className="border border-kore-border overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-kore-border bg-kore-bg">
                      <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Store</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Inventuren</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Abweichungsrate</th>
                      <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Schwund-Wert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.storeComparison.map((s: any) => (
                      <tr key={s.storeId} className="border-b border-kore-border last:border-0">
                        <td className="px-lg py-md text-kore-ink">
                          {s.storeName}
                          {s.city && <span className="text-kore-mid ml-sm">({s.city})</span>}
                        </td>
                        <td className="px-lg py-md text-right text-kore-ink">{s.counts}</td>
                        <td className={`px-lg py-md text-right font-medium ${
                          s.discrepancyRate > 5 ? 'text-red-600' : s.discrepancyRate > 2 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {s.discrepancyRate}%
                        </td>
                        <td className="px-lg py-md text-right text-kore-ink">
                          {Number(s.shrinkageValue).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── KPI Tile Component ───────────────────────────────────
function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
  highlight = false,
  positive = false,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="bg-kore-white border border-kore-border p-xl">
      <div className="flex items-center gap-sm mb-sm">
        <Icon size={16} className="text-kore-mid" />
        <span className="text-caption text-kore-mid uppercase tracking-widest">{label}</span>
      </div>
      <div
        className={`font-display text-h2 ${
          positive ? 'text-emerald-600' : highlight ? 'text-red-600' : 'text-kore-ink'
        }`}
      >
        {value}
      </div>
      {sub && <p className="text-small text-kore-mid mt-xs">{sub}</p>}
    </div>
  );
}
