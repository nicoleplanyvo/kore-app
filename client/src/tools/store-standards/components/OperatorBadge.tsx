const opSymbols: Record<string, string> = { GTE: '≥', LTE: '≤', EQ: '=', GT: '>', LT: '<' };
export function OperatorBadge({ operator, targetValue, unit }: { operator: string; targetValue: number; unit: string | null }) {
  return <span className="inline-flex items-center px-md py-xs text-caption font-medium bg-kore-bg text-kore-ink border border-kore-border">{opSymbols[operator] || operator} {targetValue}{unit ? ` ${unit}` : ''}</span>;
}
