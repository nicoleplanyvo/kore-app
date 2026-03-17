import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Store, AlertTriangle } from 'lucide-react';
import { useVmComplianceDashboard } from '../../../hooks/useVmCompliance';

export function DashboardPage() {
  const { data: dashboard, isLoading } = useVmComplianceDashboard();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;
  if (!dashboard) return <div className="p-xl text-body text-kore-mid">Keine Daten verfuegbar.</div>;

  return (
    <div className="p-xl max-w-5xl">
      <Link to="/app/tools/vm-compliance" className="flex items-center gap-sm text-small text-kore-mid hover:text-kore-ink mb-xl">
        <ArrowLeft size={16} /> Zurueck
      </Link>

      <h1 className="font-display text-h1 text-kore-ink mb-sm">VM Compliance Dashboard</h1>
      <p className="text-body text-kore-mid mb-2xl">Gesamtuebersicht der Visual-Merchandising-Compliance</p>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-xl mb-2xl">
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Compliance-Rate</span>
          <div className={`font-display text-h1 mt-sm ${dashboard.complianceRate >= 80 ? 'text-emerald-600' : dashboard.complianceRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {dashboard.complianceRate}%
          </div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Checks gesamt</span>
          <div className="font-display text-h1 text-kore-ink mt-sm">{dashboard.totalSubmissions}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Genehmigt</span>
          <div className="font-display text-h1 text-emerald-600 mt-sm">{dashboard.approved}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-xl">
          <span className="text-caption text-kore-mid uppercase tracking-widest">Offen</span>
          <div className="font-display text-h1 text-amber-600 mt-sm">{dashboard.pending}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-2xl">
        {/* Store Ranking */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><Store size={18} /> Store-Ranking</h2>
          {(dashboard.storeRanking ?? []).length === 0 ? (
            <p className="text-small text-kore-mid">Keine Store-Daten vorhanden.</p>
          ) : (
            <div className="space-y-md">
              {(dashboard.storeRanking as any[]).slice(0, 8).map((s: any, i: number) => (
                <div key={s.storeId} className="flex items-center gap-md">
                  <span className="text-caption text-kore-faint w-6">{i + 1}.</span>
                  <span className="text-small text-kore-ink flex-1">{s.storeName}</span>
                  <div className="w-24 bg-kore-bg h-3 relative">
                    <div className={`h-full ${s.complianceRate >= 80 ? 'bg-emerald-500' : s.complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.complianceRate}%` }} />
                  </div>
                  <span className="text-small text-kore-mid w-12 text-right">{s.complianceRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worst Areas */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><AlertTriangle size={18} /> Schwachstellen</h2>
          {(dashboard.worstAreas ?? []).length === 0 ? (
            <p className="text-small text-kore-mid">Keine Daten vorhanden.</p>
          ) : (
            <div className="space-y-md">
              {(dashboard.worstAreas as any[]).slice(0, 8).map((a: any) => (
                <div key={a.guidelineId} className="flex items-center gap-md">
                  <div className="flex-1">
                    <span className="text-small text-kore-ink">{a.guidelineName}</span>
                    {a.category && <span className="text-caption text-kore-faint ml-sm">({a.category})</span>}
                  </div>
                  <div className="w-24 bg-kore-bg h-3 relative">
                    <div className={`h-full ${a.complianceRate >= 80 ? 'bg-emerald-500' : a.complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${a.complianceRate}%` }} />
                  </div>
                  <span className="text-small text-kore-mid w-12 text-right">{a.complianceRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend */}
      {(dashboard.trend ?? []).length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg flex items-center gap-sm"><TrendingUp size={18} /> Trend (30 Tage)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-small">
              <thead>
                <tr className="border-b border-kore-border">
                  <th className="text-left py-sm text-kore-mid font-medium">Datum</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Genehmigt</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Abgelehnt</th>
                  <th className="text-right py-sm text-kore-mid font-medium">Offen</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.trend as any[]).slice(-14).map((t: any) => (
                  <tr key={t.date} className="border-b border-kore-border last:border-0">
                    <td className="py-sm text-kore-ink">{new Date(t.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</td>
                    <td className="py-sm text-right text-emerald-600">{t.approved}</td>
                    <td className="py-sm text-right text-red-600">{t.rejected}</td>
                    <td className="py-sm text-right text-amber-600">{t.pending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
