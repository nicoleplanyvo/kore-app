import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'brass';
  size?: 'sm' | 'md' | 'lg';
  as?: 'button' | 'a';
  href?: string;
}

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: "'Jost', sans-serif",
  fontWeight: 500,
  fontSize: '0.78rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textDecoration: 'none',
};

const variants: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--kore-ink)',
    color: 'var(--kore-white)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--kore-ink)',
    border: '1px solid var(--kore-ink)',
  },
  brass: {
    backgroundColor: 'var(--kore-brass)',
    color: 'var(--kore-white)',
    border: 'none',
  },
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { padding: '8px 20px', fontSize: '0.72rem' },
  md: { padding: '12px 28px' },
  lg: { padding: '16px 36px', fontSize: '0.82rem' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  as = 'button',
  href,
  style,
  children,
  ...props
}: ButtonProps) {
  const combinedStyle: React.CSSProperties = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size],
    ...style,
  };

  if (as === 'a' && href) {
    return (
      <a href={href} style={combinedStyle}>
        {children}
      </a>
    );
  }

  return (
    <button style={combinedStyle} {...props}>
      {children}
    </button>
  );
}
