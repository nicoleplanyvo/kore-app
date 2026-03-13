import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  narrow?: boolean;
  style?: React.CSSProperties;
}

export function Container({ children, narrow = false, style }: ContainerProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: narrow ? '800px' : '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: '24px',
        paddingRight: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
