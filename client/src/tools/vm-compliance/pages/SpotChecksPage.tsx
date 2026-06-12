import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Zap, Camera, ChevronRight } from 'lucide-react';
import { useSpotChecks, useSpotCheckInbox, useSpotCheckMetrics, formatDeadline } from '../../../hooks/useSpotChecks';
import { useEffectiveRole } from '../../../hooks/useEffectiveRole';
/* eslint-disable @typescript-eslint/no-explicit-any */

const TARGET_LABELS: Record<string, string> = {
  PENDING: 'Offen', SUBMITTED: 'Eingereicht', APPROVED: 'Freigegeben', REJECTED: 'Nachbesserung', OVERDUE: 'Überfällig',
};
const TARGET_COLORS: Record<string, string> = {
  PENDING: 'text-amber-600 bg-amber-50', SUBMITTED: 'text-sky-700 bg-sky-50',
  APPROVED: 'text-emerald-600 bg-emerald-50', REJECTED: 'text-red-600 bg-red-50', OVERDUE: 'text-red-700 bg-red-100',
};

export function SpotChecksPage() {
  const { hasRole } = useEffectiveRole();
  const isManager = hasRole('multisite_manager');
  const [page, setPage] = useState(1);
  const { data: inbox } = useSpotCheckInbox();
  const { data: result, isLoading } = useSpotChecks(page);
  const { data: metrics } = useSpotCheckMetrics();
  const requests = result?.data ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> VM Compliance
      </Link>

      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Spot-Checks</h1>
          <p className="text-body text-kore-mid mt-xs">Kurzfristige Foto-Anfragen — Umsetzung auf der Fläche sofort sichtbar machen</p>
        </div>
        {isManager && (
          <Link to="new" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Neue Anfrage
          </Link>
        )}
      </div>

      {/* Inbox: offene Anfragen für die eigenen Stores */}
      {(inbox ?? []).length > 0 && (
        <div className="mb-2xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm">
            <Zap size={18} className="text-kore-brass" /> Jetzt gefragt — Foto einreichen
          </h2>
          <div className="space-y-md">
            {(inbox ?? []).map((t: any) => {
              const dl = formatDeadline(t.request.deadline);
              return (
                <Link
                  key={t.id}
                  to={`${t.request.id}/respond?store=${t.storeId}`}
                  className="flex items-center justify-between bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors"
                >
                  <div className="flex items-center gap-lg min-w-0">
                    <Camera size={20} className="text-kore-brass shrink-0" />
                    <div className="min-w-0">
                      <p className="text-body text-kore-ink truncate">{t.request.title}</p>
                      <p className="text-small text-kore-mid">{t.store.name} · von {t.request.creator?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-md shrink-0">
                    {t.status === 'REJECTED' && (
                      <span className={`px-md py-xs text-caption uppercase tracking-widest ${TARGET_COLORS['REJECTED']}`}>Nachbesserung</span>
                    )}
                    <span className={`px-md py-xs text-caption uppercase tracking-widest ${dl.overdue ? TARGET_COLORS['OVERDUE'] : dl.urgent ? 'text-amber-700 bg-amber-100' : 'text-kore-mid bg-kore-bg'}`}>
                      {dl.label}
                    </span>
                    <ChevronRight size={16} className="text-kore-faint" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Manager: alle Anfragen + Kennzahlen */}
      {isManager && (
        <>
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Anfragen</h2>
          {isLoading ? (
            <p className="text-small text-kore-mid">Lädt...</p>
          ) : requests.length === 0 ? (
            <div className="bg-kore-white border border-kore-border p-2xl text-center">
              <p className="text-body text-kore-mid">Noch keine Spot-Checks. Erstellen Sie die erste Anfrage.</p>
            </div>
          ) : (
            <div className="space-y-md mb-xl">
              {requests.map((r: any) => {
                const dl = formatDeadline(r.deadline);
                const targets = r.targets ?? [];
                const submitted = targets.filter((t: any) => t.status !== 'PENDING' && t.status !== 'OVERDUE').length;
                const approved = targets.filter((t: any) => t.status === 'APPROVED').length;
                return (
                  <Link key={r.id} to={r.id} className="flex items-center justify-between bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                    <div className="min-w-0">
                      <p className="text-body text-kore-ink truncate">{r.title}</p>
                      <p className="text-small text-kore-mid">
                        {targets.length} Store{targets.length === 1 ? '' : 's'} · {submitted} eingereicht · {approved} freigegeben
                        {r.category ? ` · ${r.category}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-md shrink-0">
                      {r.status === 'CLOSED' ? (
                        <span className="px-md py-xs text-caption uppercase tracking-widest text-kore-mid bg-kore-bg">Geschlossen</span>
                      ) : (
                        <span className={`px-md py-xs text-caption uppercase tracking-widest ${dl.overdue ? TARGET_COLORS['OVERDUE'] : 'text-kore-mid bg-kore-bg'}`}>{dl.label}</span>
                      )}
                      <ChevronRight size={16} className="text-kore-faint" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {total > 20 && (
            <div className="flex gap-md mb-2xl">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="border border-kore-border px-lg py-sm text-small disabled:opacity-40">Zurück</button>
              <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="border border-kore-border px-lg py-sm text-small disabled:opacity-40">Weiter</button>
            </div>
          )}

          {(metrics ?? []).length > 0 && (
            <>
              <h2 className="font-display text-h3 text-kore-ink mb-lg">Kennzahlen je Store</h2>
              <div className="bg-kore-white border border-kore-border overflow-x-auto">
                <table className="w-full text-small">
                  <thead>
                    <tr className="border-b border-kore-border text-left text-kore-mid">
                      <th className="px-lg py-md font-medium">Store</th>
                      <th className="px-lg py-md font-medium text-right">Anfragen</th>
                      <th className="px-lg py-md font-medium text-right">Pünktlich</th>
                      <th className="px-lg py-md font-medium text-right">First-Pass-Quote</th>
                      <th className="px-lg py-md font-medium text-right">Ø Reaktionszeit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(metrics ?? []).map((m: any) => (
                      <tr key={m.storeId} className="border-b border-kore-border last:border-0">
                        <td className="px-lg py-md text-kore-ink">{m.storeName}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{m.total}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{m.onTimeRate != null ? `${m.onTimeRate} %` : '—'}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{m.approvalRate != null ? `${m.approvalRate} %` : '—'}</td>
                        <td className="px-lg py-md text-right text-kore-mid">{m.avgResponseMinutes != null ? `${m.avgResponseMinutes} Min.` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-caption text-kore-faint mt-sm">Kennzahlen werden ausschließlich auf Store-Ebene erhoben — keine personenbezogene Auswertung.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
