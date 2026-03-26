import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-body font-medium uppercase tracking-widest transition-all touch-manipulation select-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && 'bg-kore-brass text-white hover:bg-kore-brass-dk active:bg-kore-brass-dk',
          variant === 'secondary' && 'bg-transparent border border-kore-brass text-kore-brass hover:bg-kore-brass hover:text-white active:bg-kore-brass-dk',
          variant === 'ghost' && 'bg-transparent text-kore-mid hover:text-kore-ink hover:bg-kore-surface active:bg-kore-border',
          variant === 'danger' && 'bg-kore-error text-white hover:opacity-90 active:opacity-80',
          // Sizes — all meet 48px min touch target
          size === 'sm' && 'text-caption px-md py-sm min-h-[40px]',
          size === 'md' && 'text-small px-lg py-md-sm min-h-[48px]',
          size === 'lg' && 'text-body px-xl py-md min-h-[56px]',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
