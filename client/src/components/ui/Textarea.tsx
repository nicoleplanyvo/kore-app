import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="space-y-xs">
        {label && (
          <label htmlFor={textareaId} className="block font-body text-small text-kore-ink font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full bg-kore-white border rounded-md px-md py-[10px] font-body text-body text-kore-ink placeholder:text-kore-faint transition-all duration-200 outline-none resize-y min-h-[100px] ${
            error
              ? 'border-kore-error focus:border-kore-error focus:ring-2 focus:ring-kore-error/20'
              : 'border-kore-border focus:border-kore-brass focus:ring-2 focus:ring-kore-brass/20'
          } ${className}`}
          {...props}
        />
        {error && <p className="font-body text-small text-kore-error">{error}</p>}
        {hint && !error && <p className="font-body text-small text-kore-faint">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
