import { cn } from '../lib/cn';

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
}

export function LoadingSpinner({ className, text = 'Laden...' }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[200px] gap-md', className)}>
      <div className="w-8 h-8 border-2 border-kore-border border-t-kore-brass rounded-full animate-spin" />
      <span className="text-small text-kore-mid">{text}</span>
    </div>
  );
}
