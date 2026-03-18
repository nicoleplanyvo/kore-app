import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingMap = {
  sm: 'p-md',
  md: 'p-lg',
  lg: 'p-xl',
};

export function Card({ children, hover, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-kore-white border border-kore-border rounded-lg shadow-card ${paddingMap[padding]} ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover hover:border-kore-brass/30 hover:-translate-y-[1px] cursor-pointer active:translate-y-0 active:shadow-card' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
