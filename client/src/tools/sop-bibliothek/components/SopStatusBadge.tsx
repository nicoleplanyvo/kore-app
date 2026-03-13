interface SopStatusBadgeProps { status: string; }

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Entwurf', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  PUBLISHED: { label: 'Veröffentlicht', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ARCHIVED: { label: 'Archiviert', className: 'bg-gray-50 text-gray-500 border-gray-200' },
};

export function SopStatusBadge({ status }: SopStatusBadgeProps) {
  const cfg = statusConfig[status] ?? statusConfig['DRAFT']!;
  return (
    <span className={`inline-flex items-center px-md py-xs text-caption font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
