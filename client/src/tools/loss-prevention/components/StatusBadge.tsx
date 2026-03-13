const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700 border-amber-200',
  INVESTIGATING: 'bg-blue-50 text-blue-700 border-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-kore-bg text-kore-mid border-kore-border',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  INVESTIGATING: 'In Untersuchung',
  RESOLVED: 'Geloest',
  CLOSED: 'Geschlossen',
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`text-small font-medium px-md py-xs border ${STATUS_STYLES[status] ?? 'bg-kore-bg text-kore-ink border-kore-border'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
