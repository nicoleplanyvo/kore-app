import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, placeholder, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label htmlFor={id} className="label-default">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'input-default min-h-[48px] appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%23524E46%27 d=%27M6 8L1 3h10z%27/%3E%3C/svg%3E")] bg-no-repeat bg-[right_16px_center]',
            error && 'border-kore-error',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-caption text-kore-error mt-xs">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
