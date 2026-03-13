import { useState } from 'react';
import { useAuditLog } from '../../hooks/useGdpr';
import { Shield, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Erstellt',
  UPDATE: 'Aktualisiert',
  DELETE: 'Gelöscht',
  ASSIGN: 'Zugewiesen',
  UNASSIGN: 'Entfernt',
  LOGIN: 'Angemeldet',
  EXPORT: 'Exportiert',
};

const ENTITY_LABELS: Record<string, string> = {
  tenant: 'Tenant',
  store: 'Store',
  tool: 'Tool',
  user: 'Benutzer',
};

export default function GdprPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLog({ page });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <div className="w-10 h-10 rounded-lg bg-sand-50 flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-brass" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-4xl text-charcoal">DSGVO & Compliance</h1>
          <p className="text-charcoal/50 text-xs sm:text-sm">
            Audit-Log, Datenverarbeitung und Einwilligungen nach EU-DSGVO
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-sand-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-brass" />
            <h3 className="text-xs uppercase tracking-wider text-charcoal/60">Art. 5 DSGVO</h3>
          </div>
          <p className="text-sm text-charcoal font-medium">Datensparsamkeit</p>
          <p className="text-xs text-charcoal/50 mt-1">Alle Daten sind streng tenant-isoliert. Kein Zugriff über Mandantengrenzen hinweg.</p>
        </div>
        <div className="bg-white rounded-lg border border-sand-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-brass" />
            <h3 className="text-xs uppercase tracking-wider text-charcoal/60">Art. 17 DSGVO</h3>
          </div>
          <p className="text-sm text-charcoal font-medium">Recht auf Löschung</p>
          <p className="text-xs text-charcoal/50 mt-1">Tenant-Löschung entfernt kaskadierend alle zugehörigen Daten inkl. Stores und Tool-Zuweisungen.</p>
        </div>
        <div className="bg-white rounded-lg border border-sand-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-brass" />
            <h3 className="text-xs uppercase tracking-wider text-charcoal/60">Art. 20 DSGVO</h3>
          </div>
          <p className="text-sm text-charcoal font-medium">Datenportabilität</p>
          <p className="text-xs text-charcoal/50 mt-1">JSON-Export aller Tenant-Daten inkl. Stores und Tool-Zuweisungen verfügbar.</p>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg border border-sand-200">
        <div className="px-4 sm:px-6 py-4 border-b border-sand-100">
          <h2 className="font-display text-lg text-charcoal">Audit-Log</h2>
          <p className="text-xs text-charcoal/50">Nachvollziehbare Protokollierung aller Änderungen (Art. 5 Abs. 2 DSGVO)</p>
        </div>

        {isLoading ? (
          <div className="p-6 text-charcoal/50 text-sm">Lade Audit-Log...</div>
        ) : data && data.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-100">
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-charcoal/50">Zeitpunkt</th>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-charcoal/50">Aktion</th>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-charcoal/50">Entität</th>
                    <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-charcoal/50">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-50">
                  {data.data.map((log) => {
                    let details = '';
                    try {
                      const parsed = log.details ? JSON.parse(log.details) : {};
                      details = parsed.toolName || parsed.storeName || parsed.tenantName || log.entityId || '';
                    } catch {
                      details = log.details || '';
                    }

                    return (
                      <tr key={log.id} className="hover:bg-sand-50/50">
                        <td className="px-6 py-3 text-charcoal/60 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('de-DE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            log.action === 'ASSIGN' ? 'bg-green-50 text-green-700' :
                            log.action === 'UNASSIGN' ? 'bg-red-50 text-red-700' :
                            log.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                            'bg-sand-50 text-charcoal/60'
                          }`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-charcoal/70">
                          {ENTITY_LABELS[log.entity] || log.entity}
                        </td>
                        <td className="px-6 py-3 text-charcoal/50 truncate max-w-xs">
                          {details}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-sand-100 flex items-center justify-between text-sm">
              <span className="text-charcoal/50">{data.total} Einträge</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1 rounded hover:bg-sand-100 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-charcoal/60">Seite {page}</span>
                <button onClick={() => setPage((p) => p + 1)} disabled={data.data.length < data.pageSize} className="p-1 rounded hover:bg-sand-100 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-charcoal/40 text-sm">Noch keine Audit-Einträge vorhanden. Einträge werden automatisch bei Änderungen erstellt.</div>
        )}
      </div>
    </div>
  );
}
