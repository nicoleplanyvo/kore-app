import React from 'react';

type BadgeVariant = 'neutral' | 'brass' | 'success' | 'warning' | 'error';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    border: '1px solid var(--kore-border)',
    color: 'var(--kore-mid)',
    background: 'var(--kore-surface)',
  },
  brass: {
    border: '1px solid var(--kore-brass-lt)',
    color: 'var(--kore-brass-dk)',
    background: 'rgba(158, 132, 96, 0.1)',
  },
  success: {
    border: '1px solid var(--kore-success)',
    color: 'var(--kore-success)',
    background: 'rgba(107, 140, 107, 0.08)',
  },
  warning: {
    border: '1px solid var(--kore-warning)',
    color: 'var(--kore-warning)',
    background: 'rgba(184, 147, 90, 0.08)',
  },
  error: {
    border: '1px solid var(--kore-error)',
    color: 'var(--kore-error)',
    background: 'rgba(158, 82, 82, 0.08)',
  },
};

export function Badge({ children, variant = 'neutral', style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        fontFamily: "'Jost', sans-serif",
        fontWeight: 500,
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        borderRadius: '2px',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
