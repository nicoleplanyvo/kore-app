const SEVERITY_STYLES: Record<string, string> = {
  LOW: 'bg-blue-50 text-blue-700 border-blue-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Niedrig',
  MEDIUM: 'Mittel',
  HIGH: 'Hoch',
  CRITICAL: 'Kritisch',
};

interface SeverityBadgeProps {
  severity: string;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`text-small font-medium px-sm py-px border ${SEVERITY_STYLES[severity] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
      {SEVERITY_LABELS[severity] ?? severity}
    </span>
  );
}
