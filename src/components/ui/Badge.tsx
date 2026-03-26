import { cn } from '../../lib/cn';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'brass';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-sm py-xs text-caption uppercase tracking-widest font-medium',
        variant === 'default' && 'bg-kore-surface text-kore-mid',
        variant === 'success' && 'bg-kore-success/10 text-kore-success',
        variant === 'warning' && 'bg-kore-warning/10 text-kore-warning',
        variant === 'error' && 'bg-kore-error/10 text-kore-error',
        variant === 'brass' && 'bg-kore-brass/10 text-kore-brass',
        className,
      )}
    >
      {children}
    </span>
  );
}
