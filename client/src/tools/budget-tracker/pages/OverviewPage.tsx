import { Link } from 'react-router-dom';
import { Wallet, List } from 'lucide-react';
import { useBudgetSummary } from '../../../hooks/useBudget';
import { BudgetBar } from '../components/BudgetBar';

export function OverviewPage() {
  const { data: stats, isLoading } = useBudgetSummary();

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Budget Tracker</h1>
          <p className="text-body text-kore-mid mt-xs">Budgets planen, Ist-Werte erfassen und Abweichungen erkennen</p>
        </div>
        <Link to="/tools/budget/periods" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> Alle Perioden</Link>
      </div>

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Daten...</div>
      ) : stats && stats.totalPeriods > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt Budget</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(stats.totalBudget ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Gesamt Ist</span>
              <div className="font-display text-h2 text-kore-ink mt-sm">{Number(stats.totalActual ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ausschoepfung</span>
              <div className="mt-md">
                <BudgetBar used={Number(stats.totalActual ?? 0)} total={Number(stats.totalBudget ?? 1)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Perioden</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalPeriods}</div>
              <p className="text-small text-kore-mid mt-xs">davon {stats.activePeriods ?? 0} aktiv</p>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Abweichung</span>
              <div className={`font-display text-h2 mt-sm ${Number(stats.totalActual ?? 0) > Number(stats.totalBudget ?? 0) ? 'text-red-600' : 'text-emerald-600'}`}>
                {Number(stats.totalActual ?? 0) > Number(stats.totalBudget ?? 0) ? '+' : ''}{Number((stats.totalActual ?? 0) - (stats.totalBudget ?? 0)).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Wallet size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Budgets</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erstellen Sie Ihre erste Budget-Periode, um Kosten systematisch zu planen und zu verfolgen.</p>
          <Link to="/tools/budget/periods" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><List size={16} /> Perioden verwalten</Link>
        </div>
      )}
    </div>
  );
}
