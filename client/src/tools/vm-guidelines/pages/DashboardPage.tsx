import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Archive, Clock } from 'lucide-react';
import { useVmGuidelinesDashboard } from '../../../hooks/useVmGuidelines';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useVmGuidelinesDashboard();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;
  if (!dashboard) return <div className="p-xl text-body text-kore-mid">Keine Daten verfuegbar.</div>;

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/vm-guidelines" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurueck
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">VM Guidelines Dashboard</h1>
      <p className="text-body text-kore-mid mb-2xl">Uebersicht ueber den aktuellen Stand der VM-Richtlinien</p>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest flex items-center gap-xs"><BookOpen size={14} /> Gesamt</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.totalDocs}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest flex items-center gap-xs"><FileText size={14} /> Veroeffentlicht</span>
          <div className="font-display text-h1 text-emerald-600 mt-sm">{dashboard.published}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest flex items-center gap-xs"><Clock size={14} /> Entwuerfe</span>
          <div className="font-display text-h1 text-amber-600 mt-sm">{dashboard.draft}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest flex items-center gap-xs"><Archive size={14} /> Archiviert</span>
          <div className="font-display text-h1 text-kore-faint mt-sm">{dashboard.archived}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
        {/* By Category */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Nach Kategorie</h2>
          {dashboard.byCategory && Object.keys(dashboard.byCategory).length > 0 ? (
            <div className="space-y-md">
              {Object.entries(dashboard.byCategory as Record<string, number>).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-small text-kore-ink">{cat}</span>
                  <div className="flex items-center gap-md">
                    <div className="w-32 bg-kore-bg h-3 relative">
                      <div className="bg-kore-ink h-full" style={{ width: `${Math.min(100, (count / dashboard.totalDocs) * 100)}%` }} />
                    </div>
                    <span className="text-small text-kore-mid w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-small text-kore-mid">Keine Kategorien vorhanden.</p>
          )}
        </div>

        {/* Recent Updates */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Letzte Aenderungen</h2>
          {(dashboard.recentUpdates ?? []).length === 0 ? (
            <p className="text-small text-kore-mid">Keine Aenderungen.</p>
          ) : (
            <div className="space-y-md">
              {(dashboard.recentUpdates as any[]).map((doc: any) => (
                <Link key={doc.id} to={`/app/tools/vm-guidelines/guidelines/${doc.id}`} className="block border-b border-kore-border pb-md last:border-0 hover:text-kore-brass transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-small font-medium text-kore-ink">{doc.title}</span>
                    <span className="text-caption text-kore-faint">V{doc.version}</span>
                  </div>
                  <div className="flex items-center justify-between mt-xs">
                    <span className="text-caption text-kore-faint">{doc.category || 'Ohne Kategorie'}</span>
                    <span className="text-caption text-kore-faint">{new Date(doc.updatedAt).toLocaleDateString('de-DE')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
