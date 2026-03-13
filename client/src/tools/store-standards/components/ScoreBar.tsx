export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const pct = Math.round(score);
  const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full">
      {label && <div className="flex justify-between mb-1"><span className="text-small text-kore-mid">{label}</span><span className="text-small font-medium text-kore-ink">{pct}%</span></div>}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
