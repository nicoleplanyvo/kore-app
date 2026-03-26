import { useRef } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { cn } from '../lib/cn';

interface PhotoUploaderProps {
  photoUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  required?: boolean;
}

export function PhotoUploader({ photoUrl, onUpload, onRemove, required }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // Reset so the same file can be re-selected
    if (inputRef.current) inputRef.current.value = '';
  };

  if (photoUrl) {
    return (
      <div className="relative w-16 h-16">
        <img
          src={photoUrl}
          alt="Foto"
          className="w-full h-full object-cover border border-kore-border"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 bg-kore-error text-white rounded-full flex items-center justify-center touch-manipulation"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className={cn(
        'w-16 h-16 flex flex-col items-center justify-center border-2 border-dashed transition-colors touch-manipulation',
        required ? 'border-kore-brass text-kore-brass' : 'border-kore-border text-kore-faint hover:border-kore-brass hover:text-kore-brass',
      )}
    >
      <Camera size={20} />
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </button>
  );
}
