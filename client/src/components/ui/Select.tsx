import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, style, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 500,
              fontSize: '0.65rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--kore-mid)',
            }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            background: 'var(--kore-white)',
            border: error ? '1px solid var(--kore-error)' : '1px solid var(--kore-border)',
            borderRadius: 0,
            padding: '12px 16px',
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: '0.9rem',
            color: 'var(--kore-ink)',
            outline: 'none',
            transition: 'border-color 0.2s ease',
            width: '100%',
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage:
              "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238A847A' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
            backgroundPosition: 'right 12px center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '20px',
            paddingRight: '40px',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--kore-brass)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--kore-error)' : 'var(--kore-border)';
            props.onBlur?.(e);
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: '0.78rem',
              color: 'var(--kore-error)',
            }}
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
