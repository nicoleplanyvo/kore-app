import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Toggle({ checked, onChange, label, disabled = false, style }: ToggleProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        style={{
          position: 'relative',
          width: '40px',
          height: '22px',
          borderRadius: '11px',
          border: 'none',
          background: checked ? 'var(--kore-brass)' : 'var(--kore-border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease',
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'var(--kore-white)',
            boxShadow: '0 1px 3px rgba(28,26,23,0.15)',
            transition: 'left 0.2s ease',
          }}
        />
      </button>
      {label && (
        <span
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            fontSize: '0.9rem',
            color: 'var(--kore-ink)',
          }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
