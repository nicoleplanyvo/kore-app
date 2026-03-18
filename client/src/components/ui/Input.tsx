import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="space-y-xs">
        {label && (
          <label htmlFor={inputId} className="block font-body text-small text-kore-ink font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-kore-white border rounded-md px-md py-[10px] font-body text-body text-kore-ink placeholder:text-kore-faint transition-all duration-200 outline-none ${
            error
              ? 'border-kore-error focus:border-kore-error focus:ring-2 focus:ring-kore-error/20'
              : 'border-kore-border focus:border-kore-brass focus:ring-2 focus:ring-kore-brass/20'
          } ${className}`}
          {...props}
        />
        {error && <p className="font-body text-small text-kore-error">{error}</p>}
        {hint && !error && <p className="font-body text-small text-kore-faint">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
