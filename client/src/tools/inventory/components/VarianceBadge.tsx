interface VarianceBadgeProps {
  expected: number;
  actual: number;
}

export function VarianceBadge({ expected, actual }: VarianceBadgeProps) {
  const diff = actual - expected;
  if (diff === 0) return <span className="text-small text-emerald-600 font-medium">0</span>;

  return (
    <span className={`text-small font-medium ${Math.abs(diff) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
      {diff > 0 ? '+' : ''}{diff}
    </span>
  );
}
