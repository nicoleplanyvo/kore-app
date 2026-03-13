import React from 'react';

interface TagProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Tag({ children, style }: TagProps) {
  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    border: '1px solid var(--kore-border)',
    padding: '4px 10px',
    fontFamily: "'Jost', sans-serif",
    fontWeight: 500,
    fontSize: '0.65rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--kore-mid)',
    ...style,
  };

  return <span style={tagStyle}>{children}</span>;
}
