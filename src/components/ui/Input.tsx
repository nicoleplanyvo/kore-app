import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="label-default">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'input-default min-h-[48px]',
            error && 'border-kore-error',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-caption text-kore-error mt-xs">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
