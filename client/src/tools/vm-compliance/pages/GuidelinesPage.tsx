import { Link } from 'react-router-dom';
import { ArrowLeft, Image } from 'lucide-react';
import { useVmGuidelines } from '../../../hooks/useVmCompliance';
import { API_URL } from '../../../lib/api';

export function GuidelinesPage() {
  const { data: guidelines, isLoading } = useVmGuidelines();

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">VM Guidelines</h1>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          {(guidelines ?? []).map(g => (
            <div key={g.id} className="bg-kore-white border border-kore-border overflow-hidden">
              {g.referencePhoto ? (
                <img src={`${API_URL}${g.referencePhoto}`} alt={g.name} className="w-full aspect-video object-cover" />
              ) : (
                <div className="w-full aspect-video bg-kore-bg flex items-center justify-center"><Image size={32} className="text-kore-faint" /></div>
              )}
              <div className="p-lg">
                <h3 className="text-body font-medium text-kore-ink">{g.name}</h3>
                {g.category && <span className="text-small text-kore-mid">{g.category}</span>}
                {g.description && <p className="text-small text-kore-mid mt-sm">{g.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
