import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, style, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label
            htmlFor={inputId}
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
        <textarea
          ref={ref}
          id={inputId}
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
            resize: 'vertical',
            minHeight: '120px',
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
        />
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

Textarea.displayName = 'Textarea';
