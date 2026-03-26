import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-3xl px-lg text-center', className)}>
      <Icon size={48} strokeWidth={1} className="text-kore-faint mb-lg" />
      <h3 className="font-display text-h3 text-kore-ink mb-sm">{title}</h3>
      {description && (
        <p className="text-small text-kore-mid max-w-xs">{description}</p>
      )}
      {action && <div className="mt-lg">{action}</div>}
    </div>
  );
}
