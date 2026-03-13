import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForecasts, useForecastStores } from '../../../hooks/useForecast';

const TYPE_LABELS: any = {
  REVENUE: 'Umsatz',
  FOOTFALL: 'Kundenfrequenz',
  STAFFING: 'Personal',
  INVENTORY: 'Bestand',
};

const METHOD_LABELS: any = {
  MANUAL: 'Manuell',
  MOVING_AVG: 'Gleitender Ø',
  LINEAR: 'Linear',
  SEASONAL: 'Saisonal',
};

export function ForecastListPage() {
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [forecastType, setForecastType] = useState('');
  const { data: stores } = useForecastStores();
  const { data, isLoading } = useForecasts(page, storeId || undefined, forecastType || undefined);
  const forecasts = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/forecast" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Alle Forecasts</h1>
          <p className="text-body text-kore-mid mt-xs">Prognosen verwalten und vergleichen</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl">
        <select value={storeId} onChange={(e) => { setStoreId(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Stores</option>
          {(stores ?? []).map((s: { id: string; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={forecastType} onChange={(e) => { setForecastType(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Typen</option>
          <option value="REVENUE">Umsatz</option>
          <option value="FOOTFALL">Kundenfrequenz</option>
          <option value="STAFFING">Personal</option>
          <option value="INVENTORY">Bestand</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : forecasts.length === 0 ? (
        <div className="text-body text-kore-mid">Keine Forecasts gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {forecasts.map((f: any) => {
              const deviation = f.actualValue != null
                ? Math.abs(((Number(f.actualValue) - Number(f.forecastValue)) / Number(f.forecastValue)) * 100)
                : null;
              return (
                <Link key={f.id} to={`/tools/forecast/${f.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-body font-medium text-kore-ink">{(f.store as any)?.name}</span>
                      <div className="flex items-center gap-md mt-xs">
                        <span className="text-small px-sm py-px border border-kore-border bg-kore-bg text-kore-ink">{TYPE_LABELS[f.forecastType] ?? String(f.forecastType)}</span>
                        <span className="text-small text-kore-mid">{METHOD_LABELS[f.method] ?? String(f.method)}</span>
                        <span className="text-small text-kore-faint">{f.period}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-body text-kore-ink">{Number(f.forecastValue).toLocaleString('de-DE')}</div>
                      {f.actualValue != null && (
                        <div className={`text-small mt-xs ${deviation != null && deviation > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          Ist: {Number(f.actualValue).toLocaleString('de-DE')} ({deviation?.toFixed(1)}% Abw.)
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-xl">
              <span className="text-small text-kore-mid">{total} Forecasts &middot; Seite {page} von {totalPages}</span>
              <div className="flex gap-sm">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-sm border border-kore-border hover:bg-kore-bg disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
