import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  surface?: boolean;
  style?: React.CSSProperties;
  id?: string;
}

export function Section({ children, surface = false, style, id }: SectionProps) {
  return (
    <section
      id={id}
      style={{
        padding: '96px 0',
        backgroundColor: surface ? 'var(--kore-surface)' : 'transparent',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
