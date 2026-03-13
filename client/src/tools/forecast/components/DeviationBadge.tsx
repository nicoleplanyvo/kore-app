interface DeviationBadgeProps {
  forecast: number;
  actual: number | null;
}

export function DeviationBadge({ forecast, actual }: DeviationBadgeProps) {
  if (actual == null || forecast === 0) return <span className="text-small text-kore-faint">–</span>;

  const deviation = ((actual - forecast) / forecast) * 100;
  const abs = Math.abs(deviation);
  const color = abs > 15 ? 'text-red-600' : abs > 10 ? 'text-amber-600' : 'text-emerald-600';

  return (
    <span className={`text-small font-medium ${color}`}>
      {deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%
    </span>
  );
}
