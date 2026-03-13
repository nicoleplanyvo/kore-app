interface BudgetBarProps {
  used: number;
  total: number;
}

export function BudgetBar({ used, total }: BudgetBarProps) {
  const pct = total > 0 ? Math.min(150, (used / total) * 100) : 0;
  const isOver = used > total;

  return (
    <div>
      <div className="flex items-center justify-between mb-xs">
        <span className={`text-small font-medium ${isOver ? 'text-red-600' : 'text-kore-ink'}`}>{Math.round(pct)}%</span>
        <span className="text-small text-kore-mid">{used.toLocaleString('de-DE', { maximumFractionDigits: 0 })} / {total.toLocaleString('de-DE', { maximumFractionDigits: 0 })}</span>
      </div>
      <div className="w-full bg-kore-bg h-2">
        <div
          className={`h-full transition-all ${isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
