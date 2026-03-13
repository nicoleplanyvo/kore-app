import React from 'react';

interface DividerProps {
  accent?: boolean;
  style?: React.CSSProperties;
}

export function Divider({ accent = false, style }: DividerProps) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: accent ? '2px solid var(--kore-brass)' : '1px solid var(--kore-border)',
        width: '100%',
        ...style,
      }}
    />
  );
}
