import { Link } from 'react-router-dom';
import { TrendingUp, List, Target } from 'lucide-react';
import { useForecastAccuracy } from '../../../hooks/useForecast';

export function OverviewPage() {
  const { data: accuracy, isLoading } = useForecastAccuracy();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Forecast</h1>
          <p className="text-body text-kore-mid mt-xs">Umsatz-, Personal- und Bestandsprognosen erstellen und vergleichen</p>
        </div>
        <Link to="/tools/forecast/list" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> Alle Forecasts</Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : accuracy && accuracy.totalForecasts > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Forecasts gesamt</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{accuracy.totalForecasts}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Mit Ist-Werten</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{accuracy.withActuals}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø Abweichung</span>
              <div className={`font-display text-h2 mt-sm ${Number(accuracy.avgDeviation ?? 0) > 10 ? 'text-amber-600' : 'text-emerald-600'}`}>{Number(accuracy.avgDeviation ?? 0).toFixed(1)}%</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ø MAPE</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(accuracy.mape ?? 0).toFixed(1)}%</div>
            </div>
          </div>

          {/* Accuracy by type */}
          {accuracy.byType && (accuracy.byType as Array<any>).length > 0 && (
            <div className="bg-kore-white border border-kore-border p-xl">
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Genauigkeit nach Typ</h2>
              <div className="space-y-md">
                {(accuracy.byType as Array<any>).map((t) => (
                  <div key={t.forecastType} className="flex items-center gap-lg">
                    <span className="text-small text-kore-ink w-28 capitalize">{t.forecastType}</span>
                    <div className="flex-1 bg-kore-bg h-4 relative">
                      <div className="bg-kore-ink h-full" style={{ width: `${Math.max(0, 100 - Number(t.avgDeviation ?? 0))}%` }} />
                    </div>
                    <span className="text-small text-kore-mid w-20 text-right">{Number(t.avgDeviation ?? 0).toFixed(1)}% Abw.</span>
                    <span className="text-small text-kore-faint w-14 text-right">{t.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Target size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Forecasts</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erstellen Sie Ihre erste Prognose, um Umsaetze, Personalbedarfe oder Bestaende vorherzusagen.</p>
          <Link to="/tools/forecast/list" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><TrendingUp size={16} /> Forecast erstellen</Link>
        </div>
      )}
    </div>
  );
}
