const cfg: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Ausstehend', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Genehmigt', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Abgelehnt', className: 'bg-red-50 text-red-700 border-red-200' },
};
export function StatusBadge({ status }: { status: string }) {
  const c = cfg[status] ?? cfg['PENDING']!;
  return <span className={`inline-flex items-center px-md py-xs text-caption font-medium border ${c.className}`}>{c.label}</span>;
}
