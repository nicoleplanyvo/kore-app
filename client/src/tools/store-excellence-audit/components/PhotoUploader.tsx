import { Camera, Trash2 } from 'lucide-react';
import { useRef } from 'react';

interface PhotoUploaderProps {
  photoUrl: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
  required?: boolean;
  disabled?: boolean;
}

export function PhotoUploader({
  photoUrl,
  onUpload,
  onRemove,
  required = false,
  disabled = false,
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="flex items-center gap-md">
      {photoUrl ? (
        <div className="relative">
          <img
            src={photoUrl}
            alt="Foto-Beweis"
            className="w-16 h-16 object-cover rounded-md border border-kore-border"
          />
          {!disabled && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-1 -right-1 w-5 h-5 bg-kore-error text-white rounded-full flex items-center justify-center"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={`flex items-center gap-sm px-md py-sm border border-dashed rounded-md text-small transition-colors ${
            required
              ? 'border-kore-brass text-kore-brass hover:bg-kore-brass hover:bg-opacity-5'
              : 'border-kore-border text-kore-mid hover:border-kore-brass hover:text-kore-brass'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Camera size={16} />
          {required ? 'Foto erforderlich' : 'Foto hinzufügen'}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
