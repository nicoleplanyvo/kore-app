import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
}

const variantClasses = {
  primary:
    'bg-kore-ink text-kore-white hover:bg-kore-brass border-transparent shadow-sm active:shadow-none active:translate-y-[1px]',
  secondary:
    'bg-kore-white text-kore-ink border-kore-border hover:border-kore-brass hover:text-kore-brass shadow-sm',
  ghost:
    'bg-transparent text-kore-mid border-transparent hover:bg-kore-surface hover:text-kore-ink',
  danger:
    'bg-kore-error/10 text-kore-error border-kore-error/20 hover:bg-kore-error hover:text-white shadow-sm',
};

const sizeClasses = {
  sm: 'px-md py-[6px] text-small gap-xs',
  md: 'px-lg py-[10px] text-body gap-sm',
  lg: 'px-xl py-md text-body gap-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-body font-medium rounded-md border transition-all duration-200 ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
