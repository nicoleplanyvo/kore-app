import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle, Clock, Eye } from 'lucide-react';
import { useSopDocuments, useSopCategories, useSopAcknowledgmentStatus } from '../../../hooks/useSop';

export function DashboardPage() {
  const { data: allDocs } = useSopDocuments({ page: 1 });
  const { data: publishedDocs } = useSopDocuments({ page: 1, status: 'PUBLISHED' });
  const { data: draftDocs } = useSopDocuments({ page: 1, status: 'DRAFT' });
  const { data: categories } = useSopCategories();
  const { data: ackStatus, isLoading } = useSopAcknowledgmentStatus();

  const totalSops = allDocs?.total ?? 0;
  const publishedCount = publishedDocs?.total ?? 0;
  const draftCount = draftDocs?.total ?? 0;

  const avgReadRate = ackStatus && ackStatus.length > 0
    ? Math.round(ackStatus.reduce((s, a) => s + a.acknowledgedPercent, 0) / ackStatus.length * 10) / 10
    : 0;

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/app/tools/sop" className="text-kore-mid hover:text-kore-ink transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">SOP Dashboard</h1>
          <p className="text-body text-kore-mid mt-xs">Statistiken und Lesebestaetigung im Ueberblick</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-lg mb-2xl">
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs">
            <BookOpen size={14} /> Gesamt
          </div>
          <div className="text-h2 font-display text-kore-ink">{totalSops}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-xs text-small text-emerald-600 mb-xs">
            <CheckCircle size={14} /> Freigegeben
          </div>
          <div className="text-h2 font-display text-emerald-600">{publishedCount}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-xs text-small text-amber-600 mb-xs">
            <Clock size={14} /> Entwuerfe
          </div>
          <div className="text-h2 font-display text-amber-600">{draftCount}</div>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg">
          <div className="flex items-center gap-xs text-small text-kore-mid mb-xs">
            <Eye size={14} /> Ø Leserate
          </div>
          <div className="text-h2 font-display text-kore-ink">{avgReadRate}%</div>
        </div>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">SOPs nach Kategorie</h2>
          <div className="space-y-sm">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-sm border-b border-kore-border last:border-0">
                <span className="text-body text-kore-ink">{cat.name}</span>
                <span className="text-small font-medium text-kore-mid">{cat._count?.documents ?? 0} SOPs</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acknowledgment Status */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Lesebestaetigung...</div>
      ) : ackStatus && ackStatus.length > 0 ? (
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Lesebestaetigung pro SOP</h2>
          <div className="space-y-md">
            {ackStatus.map((item) => (
              <div key={item.sopId} className="space-y-xs">
                <div className="flex items-center justify-between text-small">
                  <Link to={`/app/tools/sop/sops/${item.sopId}`} className="text-kore-ink hover:text-kore-brass transition-colors font-medium">
                    {item.title}
                  </Link>
                  <span className="text-kore-mid">
                    {item.acknowledgedCount} / {item.totalUsers} ({item.acknowledgedPercent}%)
                  </span>
                </div>
                <div className="w-full bg-kore-bg h-2">
                  <div
                    className="bg-kore-ink h-full transition-all"
                    style={{ width: `${Math.min(100, item.acknowledgedPercent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-xl text-center text-body text-kore-mid">
          Noch keine veroeffentlichten SOPs fuer die Lesebestaetigung vorhanden.
        </div>
      )}
    </div>
  );
}
