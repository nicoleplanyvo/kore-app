import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ className, padded = true, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-kore-white border border-kore-border',
        padded && 'p-lg',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
