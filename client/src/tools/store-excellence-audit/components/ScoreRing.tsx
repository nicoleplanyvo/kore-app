interface ScoreRingProps {
  score: number; // 0–100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

/**
 * Kreisförmige Score-Anzeige (0–100%).
 * Farbe wechselt je nach Score: grün (>75), brass (50–75), rot (<50).
 */
export function ScoreRing({ score, size = 120, strokeWidth = 8, label }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 75 ? 'var(--kore-success)' : score >= 50 ? 'var(--kore-brass)' : 'var(--kore-error)';

  return (
    <div className="flex flex-col items-center relative">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--kore-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span className="font-display text-h2 text-kore-ink">{Math.round(score)}%</span>
        {label && <span className="text-caption text-kore-mid">{label}</span>}
      </div>
    </div>
  );
}
