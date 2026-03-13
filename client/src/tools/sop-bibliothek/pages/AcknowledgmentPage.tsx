import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useSopAcknowledgmentStatus } from '../../../hooks/useSop';
import { AcknowledgmentProgress } from '../components/AcknowledgmentProgress';
import { SopStatusBadge } from '../components/SopStatusBadge';

export function AcknowledgmentPage() {
  const { data: items, isLoading } = useSopAcknowledgmentStatus();

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/tools/sop" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl"><ArrowLeft size={16} /> Zurück</Link>

      <h1 className="font-display text-h1 text-kore-ink mb-md">Kenntnisnahmen</h1>
      <p className="text-body text-kore-mid mb-2xl">Übersicht: Wer hat welche SOPs gelesen und bestätigt?</p>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : !items || items.length === 0 ? (
        <div className="bg-kore-white border border-kore-border p-3xl text-center">
          <FileText size={48} className="text-kore-faint mx-auto mb-lg" />
          <p className="text-body text-kore-mid">Noch keine veröffentlichten SOPs mit Kenntnisnahmen vorhanden.</p>
        </div>
      ) : (
        <div className="space-y-md">
          {items.map(item => (
            <div key={item.sopId} className="bg-kore-white border border-kore-border p-lg">
              <div className="flex items-center justify-between mb-md">
                <div className="flex items-center gap-md min-w-0">
                  <FileText size={18} className="text-kore-mid flex-shrink-0" />
                  <Link to={`/tools/sop/documents/${item.sopId}`} className="text-body font-medium text-kore-ink hover:text-kore-brass transition-colors truncate">{item.title}</Link>
                  <SopStatusBadge status={item.status} />
                </div>
              </div>
              <AcknowledgmentProgress acknowledged={item.acknowledged} total={item.total} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
