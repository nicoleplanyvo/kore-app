import React from 'react';

interface CardProps {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, accent = false, style }: CardProps) {
  const cardStyle: React.CSSProperties = {
    background: 'var(--kore-white)',
    border: '1px solid var(--kore-border)',
    borderRadius: 'var(--radius-md)',
    padding: '32px',
    ...(accent ? { borderLeft: '3px solid var(--kore-brass)' } : {}),
    ...style,
  };

  return <div style={cardStyle}>{children}</div>;
}
