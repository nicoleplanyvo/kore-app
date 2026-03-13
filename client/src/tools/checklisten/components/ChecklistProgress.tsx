interface ChecklistProgressProps {
  value: number; // 0–100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * Horizontale Fortschrittsanzeige (0–100%).
 * Farbe wechselt je nach Wert: gruen (>=75), brass (50–74), rot (<50).
 */
export function ChecklistProgress({
  value,
  size = 'md',
  showLabel = true,
}: ChecklistProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  const color =
    clamped >= 75
      ? 'bg-kore-success'
      : clamped >= 50
        ? 'bg-kore-brass'
        : 'bg-kore-error';

  const textColor =
    clamped >= 75
      ? 'text-kore-success'
      : clamped >= 50
        ? 'text-kore-brass'
        : 'text-kore-error';

  const heightClass = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-xs">
          <span className={`font-display text-${size === 'lg' ? 'h2' : size === 'sm' ? 'small' : 'body'} ${textColor}`}>
            {clamped}%
          </span>
        </div>
      )}
      <div className={`w-full ${heightClass} bg-kore-border rounded-full overflow-hidden`}>
        <div
          className={`h-full ${color} transition-all duration-300 rounded-full`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
