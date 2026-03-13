import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStdCategories, useStdDefinitions } from '../../../hooks/useStoreStandards';
import { OperatorBadge } from '../components/OperatorBadge';

export function DefinitionsPage() {
  const { data: categories } = useStdCategories();
  const { data: definitions, isLoading } = useStdDefinitions();

  const grouped = (categories ?? []).map(cat => ({
    ...cat,
    defs: (definitions ?? []).filter(d => d.categoryId === cat.id),
  }));

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/store-standards" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>
      <h1 className="font-display text-h1 text-kore-ink mb-2xl">Standard-Definitionen</h1>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : (
        <div className="space-y-xl">
          {grouped.map(cat => (
            <div key={cat.id} className="bg-kore-white border border-kore-border">
              <div className="p-lg border-b border-kore-border">
                <h2 className="font-display text-h2 text-kore-ink">{cat.name}</h2>
                {cat.description && <p className="text-small text-kore-mid mt-xs">{cat.description}</p>}
              </div>
              {cat.defs.length === 0 ? (
                <div className="p-lg text-small text-kore-mid">Keine Standards definiert.</div>
              ) : (
                <div className="divide-y divide-kore-border">
                  {cat.defs.map(def => (
                    <div key={def.id} className="p-lg flex items-center justify-between">
                      <div>
                        <span className="text-body font-medium text-kore-ink">{def.name}</span>
                        {def.description && <p className="text-small text-kore-mid mt-xs">{def.description}</p>}
                      </div>
                      <div className="flex items-center gap-md flex-shrink-0">
                        <OperatorBadge operator={def.operator} targetValue={def.targetValue} unit={def.unit} />
                        <span className="text-small text-kore-faint">Gewicht: {def.weight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
