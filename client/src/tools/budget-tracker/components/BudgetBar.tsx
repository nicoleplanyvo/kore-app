interface BudgetBarProps {
  current: number;
  target: number;
  label?: string;
  showAmount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BudgetBar({ current, target, label, showAmount = true, size = 'md' }: BudgetBarProps) {
  const pct = target > 0 ? Math.min(150, (current / target) * 100) : 0;
  const roundedPct = Math.round(pct * 10) / 10;

  const barColor =
    pct >= 100 ? 'bg-emerald-500' :
    pct >= 90 ? 'bg-emerald-400' :
    pct >= 70 ? 'bg-amber-400' :
    'bg-red-400';

  const textColor =
    pct >= 100 ? 'text-emerald-600' :
    pct >= 70 ? 'text-amber-600' :
    'text-red-600';

  const fmt = (v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-3';

  return (
    <div>
      {(label || showAmount) && (
        <div className="flex items-center justify-between mb-xs">
          {label && <span className="text-small text-kore-mid">{label}</span>}
          <div className="flex items-center gap-md">
            {showAmount && (
              <span className="text-small text-kore-mid">
                {fmt(current)} / {fmt(target)}
              </span>
            )}
            <span className={`text-small font-semibold ${textColor}`}>
              {roundedPct}%
            </span>
          </div>
        </div>
      )}
      <div className={`w-full bg-kore-bg ${barHeight} rounded-sm overflow-hidden`}>
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
