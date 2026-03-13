interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
}

export function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className="bg-kore-white border border-kore-border p-xl">
      <span className="text-caption text-kore-mid uppercase tracking-widest">{label}</span>
      <div className="font-display text-h2 text-kore-ink mt-sm">{value}</div>
      {subtitle && <p className="text-small text-kore-mid mt-xs">{subtitle}</p>}
    </div>
  );
}
