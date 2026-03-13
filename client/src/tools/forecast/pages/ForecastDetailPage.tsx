import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForecast } from '../../../hooks/useForecast';

const TYPE_LABELS: any = {
  REVENUE: 'Umsatz',
  FOOTFALL: 'Kundenfrequenz',
  STAFFING: 'Personal',
  INVENTORY: 'Bestand',
};

const METHOD_LABELS: any = {
  MANUAL: 'Manuell',
  MOVING_AVG: 'Gleitender Durchschnitt',
  LINEAR: 'Lineare Regression',
  SEASONAL: 'Saisonal',
};

export function ForecastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: forecast, isLoading } = useForecast(id ?? '');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!forecast) return <div className="p-xl text-body text-kore-mid">Forecast nicht gefunden.</div>;

  const forecastVal = Number(forecast.forecastValue ?? 0);
  const actualVal = forecast.actualValue != null ? Number(forecast.actualValue) : null;
  const deviation = actualVal != null && forecastVal > 0
    ? ((actualVal - forecastVal) / forecastVal) * 100
    : null;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/forecast/list" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Forecast Detail</h1>
          <div className="flex items-center gap-md mt-xs">
            <span className="text-body text-kore-mid">{forecast.store?.name}</span>
            <span className="text-body text-kore-faint">{forecast.period}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Typ</span>
          <div className="font-display text-h3 text-kore-ink mt-sm">{TYPE_LABELS[forecast.forecastType] ?? forecast.forecastType}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Methode</span>
          <div className="font-display text-h3 text-kore-ink mt-sm">{METHOD_LABELS[forecast.method] ?? forecast.method}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Prognose</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{forecastVal.toLocaleString('de-DE')}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Ist-Wert</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{actualVal != null ? actualVal.toLocaleString('de-DE') : '–'}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Abweichung</span>
          {deviation != null ? (
            <div className={`font-display text-h1 mt-sm ${Math.abs(deviation) > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
            </div>
          ) : (
            <div className="font-display text-h1 text-kore-faint mt-sm">–</div>
          )}
        </div>
      </div>

      {/* Confidence */}
      {forecast.confidenceLow != null && forecast.confidenceHigh != null && (
        <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Konfidenzintervall</span>
          <div className="flex items-center gap-lg mt-md">
            <span className="text-body text-kore-mid">{Number(forecast.confidenceLow).toLocaleString('de-DE')}</span>
            <div className="flex-1 bg-kore-bg h-3 relative">
              <div className="absolute bg-kore-ink/20 h-full" style={{
                left: `${Math.max(0, (Number(forecast.confidenceLow) / Number(forecast.confidenceHigh)) * 50)}%`,
                right: '0%',
              }} />
              {actualVal != null && (
                <div className="absolute w-1 bg-emerald-500 h-full" style={{
                  left: `${Math.min(100, (actualVal / Number(forecast.confidenceHigh)) * 50)}%`,
                }} />
              )}
            </div>
            <span className="text-body text-kore-mid">{Number(forecast.confidenceHigh).toLocaleString('de-DE')}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {forecast.notes && (
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Notizen</span>
          <p className="text-body text-kore-ink mt-sm">{forecast.notes}</p>
        </div>
      )}
    </div>
  );
}
