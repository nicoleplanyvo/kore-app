import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = '', id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="space-y-xs">
        {label && (
          <label htmlFor={selectId} className="block font-body text-small text-kore-ink font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-kore-white border rounded-md px-md py-[10px] font-body text-body text-kore-ink transition-all duration-200 outline-none appearance-none cursor-pointer ${
            error
              ? 'border-kore-error focus:border-kore-error focus:ring-2 focus:ring-kore-error/20'
              : 'border-kore-border focus:border-kore-brass focus:ring-2 focus:ring-kore-brass/20'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && <p className="font-body text-small text-kore-error">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
