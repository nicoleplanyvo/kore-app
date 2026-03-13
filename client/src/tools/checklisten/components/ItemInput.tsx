import { Check, X, Camera } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  type: string;
  isRequired: boolean;
  sortOrder: number;
}

interface ItemInputProps {
  item: ChecklistItem;
  valueBool: boolean | null;
  valueText: string | null;
  valueNumber: number | null;
  photoPath: string | null;
  onChange: (updates: {
    valueBool?: boolean | null;
    valueText?: string | null;
    valueNumber?: number | null;
  }) => void;
  disabled?: boolean;
}

/**
 * Rendert den passenden Input basierend auf dem Item-Typ.
 * BOOLEAN -> Ja/Nein Toggle-Buttons
 * TEXT    -> Texteingabe
 * NUMBER  -> Zahlenfeld
 * PHOTO   -> Foto-Upload Button (vereinfacht)
 */
export function ItemInput({
  item,
  valueBool,
  valueText,
  valueNumber,
  onChange,
  disabled = false,
}: ItemInputProps) {
  switch (item.type) {
    case 'BOOLEAN':
      return (
        <div className="flex gap-md-sm">
          <button
            type="button"
            onClick={() => onChange({ valueBool: valueBool === true ? null : true })}
            disabled={disabled}
            className={`flex items-center gap-xs px-lg py-md-sm text-small font-medium transition-all ${
              valueBool === true
                ? 'bg-kore-success text-white border-2 border-kore-success'
                : 'bg-kore-white border-2 border-kore-border text-kore-faint hover:border-kore-success hover:text-kore-success'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Check size={18} />
            Ja
          </button>
          <button
            type="button"
            onClick={() => onChange({ valueBool: valueBool === false ? null : false })}
            disabled={disabled}
            className={`flex items-center gap-xs px-lg py-md-sm text-small font-medium transition-all ${
              valueBool === false
                ? 'bg-kore-error text-white border-2 border-kore-error'
                : 'bg-kore-white border-2 border-kore-border text-kore-faint hover:border-kore-error hover:text-kore-error'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <X size={18} />
            Nein
          </button>
        </div>
      );

    case 'TEXT':
      return (
        <input
          type="text"
          value={valueText ?? ''}
          onChange={(e) => onChange({ valueText: e.target.value })}
          disabled={disabled}
          placeholder="Antwort eingeben..."
          className="input-default"
        />
      );

    case 'NUMBER':
      return (
        <input
          type="number"
          value={valueNumber ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : parseFloat(e.target.value);
            onChange({ valueNumber: val });
          }}
          disabled={disabled}
          placeholder="Zahl eingeben..."
          className="input-default"
        />
      );

    case 'PHOTO':
      return (
        <button
          type="button"
          disabled={disabled}
          className={`flex items-center gap-sm px-lg py-md-sm text-small border-2 border-dashed border-kore-border text-kore-mid hover:border-kore-brass hover:text-kore-brass transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <Camera size={18} />
          Foto hinzufuegen
        </button>
      );

    default:
      return (
        <p className="text-small text-kore-mid italic">
          Unbekannter Typ: {item.type}
        </p>
      );
  }
}
