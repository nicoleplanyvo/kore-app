import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useBudgetPeriod } from '../../../hooks/useBudget';
import { BudgetBar } from '../components/BudgetBar';

export function PeriodDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: period, isLoading } = useBudgetPeriod(id ?? '');

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!period) return <div className="p-xl text-body text-kore-mid">Periode nicht gefunden.</div>;

  const totalBudget = Number(period.totalBudget ?? 0);
  const totalActual = Number(period.totalActual ?? 0);
  const actuals = (period.actuals ?? []) as Array<any>;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/budget/periods" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">{period.name}</h1>
          <div className="flex items-center gap-md mt-xs">
            <span className="text-body text-kore-mid">{period.store?.name}</span>
            <span className="text-body text-kore-faint">{period.period}</span>
            <span className={`text-small font-medium px-sm py-px border ${period.status === 'CLOSED' ? 'bg-kore-bg text-kore-mid border-kore-border' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{period.status === 'CLOSED' ? 'Geschlossen' : 'Aktiv'}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Budget</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{totalBudget.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Ist</span>
          <div className="font-display text-h2 text-kore-ink mt-sm">{totalActual.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Ausschoepfung</span>
          <div className="mt-md"><BudgetBar used={totalActual} total={totalBudget || 1} /></div>
        </div>
      </div>

      {/* Notes */}
      {period.notes && (
        <div className="bg-kore-white border border-kore-border p-xl mb-2xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Notizen</span>
          <p className="text-body text-kore-ink mt-sm">{period.notes}</p>
        </div>
      )}

      {/* Actuals */}
      <div>
        <h2 className="font-display text-h2 text-kore-ink mb-lg">Ist-Buchungen</h2>
        {actuals.length === 0 ? (
          <div className="text-body text-kore-mid">Noch keine Ist-Buchungen vorhanden.</div>
        ) : (
          <div className="border border-kore-border bg-kore-white">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border bg-kore-bg">
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Kategorie</th>
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Beschreibung</th>
                  <th className="text-right px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Betrag</th>
                  <th className="text-left px-lg py-md text-caption text-kore-mid uppercase tracking-widest">Datum</th>
                </tr>
              </thead>
              <tbody>
                {actuals.map((a) => (
                  <tr key={a.id} className="border-b border-kore-border last:border-0">
                    <td className="px-lg py-md text-kore-ink">{a.category}</td>
                    <td className="px-lg py-md text-kore-ink">{(a.description) || '-'}</td>
                    <td className="px-lg py-md text-right text-kore-ink">{Number(a.amount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
                    <td className="px-lg py-md text-kore-mid">{new Date(a.bookedAt).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
