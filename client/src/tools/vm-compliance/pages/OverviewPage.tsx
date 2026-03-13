import { Link } from 'react-router-dom';
import { Plus, Camera, Image } from 'lucide-react';
import { useVmSummary, useVmSubmissions } from '../../../hooks/useVmCompliance';
import { ComplianceBar } from '../components/ComplianceBar';
import { StatusBadge } from '../components/StatusBadge';

export function OverviewPage() {
  const { data: stats, isLoading } = useVmSummary();
  const { data: recentData } = useVmSubmissions({ page: 1, status: 'PENDING' });
  const pendingItems = recentData?.data ?? [];

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">VM Foto-Compliance</h1>
          <p className="text-body text-kore-mid mt-xs">Foto-basierte Visual-Merchandising-Kontrolle</p>
        </div>
        <div className="flex gap-md">
          <Link to="/tools/vm-compliance/guidelines" className="flex items-center gap-sm border border-kore-border text-kore-ink px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-bg transition-colors"><Image size={16} /> Guidelines</Link>
          <Link to="/tools/vm-compliance/submit" className="flex items-center gap-sm bg-kore-ink text-kore-white px-lg py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><Plus size={16} /> Foto einreichen</Link>
        </div>
      </div>

      {isLoading ? <div className="text-body text-kore-mid">Lade...</div> : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-xl mb-2xl">
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Compliance-Rate</span>
              <div className="mt-md"><ComplianceBar value={stats.complianceRate} /></div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Total</span>
              <div className="font-display text-h1 text-kore-ink mt-sm">{stats.totalSubmissions}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Ausstehend</span>
              <div className="font-display text-h1 text-amber-600 mt-sm">{stats.pending}</div>
            </div>
            <div className="bg-kore-white border border-kore-border p-xl">
              <span className="text-caption text-kore-mid uppercase tracking-widest">Genehmigt</span>
              <div className="font-display text-h1 text-emerald-600 mt-sm">{stats.approved}</div>
            </div>
          </div>

          {pendingItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-lg">
                <h2 className="font-display text-h2 text-kore-ink">Offene Reviews</h2>
                <Link to="/tools/vm-compliance/review" className="text-small text-kore-brass hover:text-kore-brass-dk">Alle anzeigen &rarr;</Link>
              </div>
              <div className="space-y-md">
                {pendingItems.slice(0, 5).map(sub => (
                  <Link key={sub.id} to={`/tools/vm-compliance/submissions/${sub.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-brass transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-md">
                        <Camera size={18} className="text-kore-mid" />
                        <div>
                          <span className="text-body font-medium text-kore-ink">{sub.guideline?.name}</span>
                          <span className="text-small text-kore-mid ml-md">{sub.store?.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-md">
                        <span className="text-small text-kore-faint">{new Date(sub.submittedAt).toLocaleDateString('de-DE')}</span>
                        <StatusBadge status={sub.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Camera size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Einreichungen</h2>
          <p className="text-body text-kore-mid mb-xl">Erstellen Sie Guidelines und reichen Sie Fotos zur VM-Compliance-Prüfung ein.</p>
          <Link to="/tools/vm-compliance/submit" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors"><Plus size={16} /> Erstes Foto einreichen</Link>
        </div>
      )}
    </div>
  );
}
