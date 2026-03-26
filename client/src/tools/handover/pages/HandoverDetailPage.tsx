import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Check } from 'lucide-react';
import { useHandover, useAcknowledgeHandover } from '../../../hooks/useHandover';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', SUBMITTED: 'Eingereicht', ACKNOWLEDGED: 'Bestätigt' };
const SECTIONS = [
  { key: 'salesUpdate', label: 'Umsatz-Update' },
  { key: 'openTasks', label: 'Offene Aufgaben' },
  { key: 'incidents', label: 'Vorfälle' },
  { key: 'customerNotes', label: 'Kunden-Notizen' },
  { key: 'stockNotes', label: 'Lager-Notizen' },
  { key: 'generalNotes', label: 'Allgemeine Notizen' },
];

export function HandoverDetailPage() {
  const { id } = useParams();
  const { data: handover, isLoading } = useHandover(id);
  const ack = useAcknowledgeHandover();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!handover) return <div className="p-xl text-body text-kore-mid">Übergabe nicht gefunden.</div>;

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/handover" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><ArrowRightLeft size={24} /> Schichtübergabe</h1>
          <p className="text-body text-kore-mid mt-xs">
            {new Date(handover.shiftDate).toLocaleDateString('de-DE')}
            {handover.shiftType && ` · ${handover.shiftType}`}
            {` · ${STATUS_LABELS[handover.status] ?? handover.status}`}
          </p>
        </div>
        {handover.status !== 'ACKNOWLEDGED' && (
          <button onClick={() => ack.mutate(handover.id)} disabled={ack.isPending} className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50">
            <Check size={16} /> Bestätigen
          </button>
        )}
      </div>

      <div className="bg-kore-white border border-kore-border p-lg mb-xl">
        <div className="grid grid-cols-2 gap-lg">
          <div>
            <span className="text-small text-kore-mid">Von</span>
            <p className="text-body text-kore-ink">{handover.fromUser?.name ?? '—'}</p>
          </div>
          <div>
            <span className="text-small text-kore-mid">An</span>
            <p className="text-body text-kore-ink">{handover.toUser?.name ?? '—'}</p>
          </div>
        </div>
      </div>

      {SECTIONS.map(({ key, label }) => {
        const value = (handover as any)[key];
        if (!value) return null;
        return (
          <div key={key} className="bg-kore-white border border-kore-border p-lg mb-md">
            <h3 className="font-display text-h3 text-kore-ink mb-sm">{label}</h3>
            <p className="text-body text-kore-mid whitespace-pre-wrap">{value}</p>
          </div>
        );
      })}

      {SECTIONS.every(({ key }) => !(handover as any)[key]) && (
        <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Keine Notizen in dieser Übergabe.</div>
      )}
    </div>
  );
}
