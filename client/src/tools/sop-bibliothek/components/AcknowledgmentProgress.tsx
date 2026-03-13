interface AcknowledgmentProgressProps { acknowledged: number; total: number; }

export function AcknowledgmentProgress({ acknowledged, total }: AcknowledgmentProgressProps) {
  const pct = total > 0 ? Math.round((acknowledged / total) * 100) : 0;
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-small font-medium ${textColor}`}>{acknowledged} von {total}</span>
        <span className={`text-small font-medium ${textColor}`}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
