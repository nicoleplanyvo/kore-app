import { ScoreBar } from './ScoreBar';
interface BenchmarkEntry { storeName: string; overallScore: number; period: string; }
export function BenchmarkTable({ entries }: { entries: BenchmarkEntry[] }) {
  const sorted = [...entries].sort((a, b) => b.overallScore - a.overallScore);
  return (
    <div className="bg-kore-white border border-kore-border">
      <div className="grid grid-cols-[1fr_120px_1fr] gap-lg p-lg border-b border-kore-border">
        <span className="text-caption text-kore-mid uppercase tracking-widest">Store</span>
        <span className="text-caption text-kore-mid uppercase tracking-widest">Periode</span>
        <span className="text-caption text-kore-mid uppercase tracking-widest">Score</span>
      </div>
      {sorted.map((e, i) => (
        <div key={i} className="grid grid-cols-[1fr_120px_1fr] gap-lg p-lg border-b border-kore-border last:border-0 items-center">
          <span className="text-body text-kore-ink font-medium">{e.storeName}</span>
          <span className="text-small text-kore-mid">{e.period}</span>
          <ScoreBar score={e.overallScore} />
        </div>
      ))}
    </div>
  );
}
