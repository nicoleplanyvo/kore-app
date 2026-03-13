import { Check, X } from 'lucide-react';

interface PassFailToggleProps {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  disabled?: boolean;
}

export function PassFailToggle({ value, onChange, disabled = false }: PassFailToggleProps) {
  const handlePass = () => onChange(value === true ? null : true);
  const handleFail = () => onChange(value === false ? null : false);

  return (
    <div className="flex gap-md-sm">
      <button
        type="button"
        onClick={handlePass}
        disabled={disabled}
        className={`flex items-center justify-center w-12 h-12 rounded-md border-2 transition-all ${
          value === true
            ? 'bg-kore-success border-kore-success text-white'
            : 'border-kore-border text-kore-faint hover:border-kore-success hover:text-kore-success'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Check size={24} />
      </button>
      <button
        type="button"
        onClick={handleFail}
        disabled={disabled}
        className={`flex items-center justify-center w-12 h-12 rounded-md border-2 transition-all ${
          value === false
            ? 'bg-kore-error border-kore-error text-white'
            : 'border-kore-border text-kore-faint hover:border-kore-error hover:text-kore-error'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <X size={24} />
      </button>
    </div>
  );
}
