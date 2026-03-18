import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brass';
  size?: 'sm' | 'md';
}

const variantClasses = {
  default: 'bg-kore-surface text-kore-mid',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  brass: 'bg-kore-brass/10 text-kore-brass',
};

const sizeClasses = {
  sm: 'px-sm py-[1px] text-[0.625rem]',
  md: 'px-md-sm py-[2px] text-caption',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-xs font-body font-medium rounded-md ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}
