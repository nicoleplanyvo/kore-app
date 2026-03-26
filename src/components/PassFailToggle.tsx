import { Check, X } from 'lucide-react';
import { cn } from '../lib/cn';

interface PassFailToggleProps {
  value: boolean | null;
  onChange: (val: boolean) => void;
}

export function PassFailToggle({ value, onChange }: PassFailToggleProps) {
  return (
    <div className="flex gap-sm">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          'w-12 h-12 flex items-center justify-center border-2 transition-all touch-manipulation',
          value === true
            ? 'bg-kore-success border-kore-success text-white'
            : 'border-kore-border text-kore-faint hover:border-kore-success hover:text-kore-success',
        )}
      >
        <Check size={20} />
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          'w-12 h-12 flex items-center justify-center border-2 transition-all touch-manipulation',
          value === false
            ? 'bg-kore-error border-kore-error text-white'
            : 'border-kore-border text-kore-faint hover:border-kore-error hover:text-kore-error',
        )}
      >
        <X size={20} />
      </button>
    </div>
  );
}
