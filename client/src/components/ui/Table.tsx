import React from 'react';

interface TableProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Table({ children, style }: TableProps) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.9rem',
          ...style,
        }}
      >
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

interface ThProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Th({ children, style }: ThProps) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '12px 16px',
        fontWeight: 500,
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: 'var(--kore-mid)',
        borderBottom: '1px solid var(--kore-border)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

interface TrProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Tr({ children, onClick, style }: TrProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--kore-border)',
        transition: 'background-color 0.15s ease',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.backgroundColor = 'var(--kore-surface)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '';
      }}
    >
      {children}
    </tr>
  );
}

interface TdProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Td({ children, style }: TdProps) {
  return (
    <td
      style={{
        padding: '12px 16px',
        color: 'var(--kore-ink)',
        fontWeight: 300,
        ...style,
      }}
    >
      {children}
    </td>
  );
}
