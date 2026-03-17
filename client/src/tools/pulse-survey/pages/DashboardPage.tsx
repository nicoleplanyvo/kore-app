import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, ClipboardList, Users, Star, TrendingUp } from 'lucide-react';
import { usePulseDashboard } from '../../../hooks/usePulseSurvey';

const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', CLOSED: 'Geschlossen' };
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-kore-bg text-kore-mid',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-blue-100 text-blue-700',
};

function ratingColor(avg: number | null): string {
  if (avg === null) return 'text-kore-mid';
  if (avg >= 4) return 'text-emerald-600';
  if (avg >= 3) return 'text-amber-600';
  return 'text-red-600';
}

export function DashboardPage() {
  const { data: dashboard, isLoading } = usePulseDashboard();

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Dashboard...</div>;

  const kpis = dashboard?.kpis;
  const recentSurveys = dashboard?.recentSurveys ?? [];

  return (
    <div className="p-xl max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/pulse-survey" className="text-kore-mid hover:text-kore-ink">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Pulse Survey Dashboard
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Gesamtuebersicht aller Mitarbeiterbefragungen.
          </p>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-md mb-xl">
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-kore-brass">{kpis.totalSurveys}</div>
            <div className="text-xs text-kore-mid uppercase mt-1">Umfragen</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-emerald-600">{kpis.activeSurveys}</div>
            <div className="text-xs text-kore-mid uppercase mt-1">Aktiv</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-blue-600">{kpis.totalResponses}</div>
            <div className="text-xs text-kore-mid uppercase mt-1">Antworten</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-purple-600">{kpis.totalQuestions}</div>
            <div className="text-xs text-kore-mid uppercase mt-1">Fragen</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className={`text-2xl font-bold ${ratingColor(kpis.overallAvgRating)}`}>
              {kpis.overallAvgRating != null ? kpis.overallAvgRating.toFixed(1) : '--'}
            </div>
            <div className="text-xs text-kore-mid uppercase mt-1">Bewertung</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-md text-center">
            <div className="text-2xl font-bold text-amber-600">{kpis.avgParticipation}</div>
            <div className="text-xs text-kore-mid uppercase mt-1">Antw./Umfrage</div>
          </div>
        </div>
      )}

      {/* Recent surveys */}
      {recentSurveys.length > 0 ? (
        <div className="bg-kore-white border border-kore-border">
          <div className="px-lg py-md border-b border-kore-border">
            <h2 className="font-display text-h3 text-kore-ink">Letzte Umfragen</h2>
          </div>
          <table className="w-full text-small">
            <thead>
              <tr className="border-b border-kore-border bg-kore-bg">
                <th className="text-left px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Titel</th>
                <th className="text-center px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Status</th>
                <th className="text-center px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Fragen</th>
                <th className="text-center px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Antworten</th>
                <th className="text-center px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Bewertung</th>
                <th className="text-left px-md py-sm text-kore-mid font-medium uppercase tracking-widest">Zeitraum</th>
              </tr>
            </thead>
            <tbody>
              {recentSurveys.map((sv: any) => (
                <tr key={sv.id} className="border-b border-kore-border last:border-0 hover:bg-kore-bg/50 transition-colors">
                  <td className="px-md py-sm">
                    <Link to={`/tools/pulse-survey/surveys/${sv.id}`} className="text-kore-ink font-medium hover:text-kore-brass">
                      {sv.title}
                    </Link>
                  </td>
                  <td className="px-md py-sm text-center">
                    <span className={`px-sm py-xs text-xs ${STATUS_COLORS[sv.status] ?? 'bg-kore-bg text-kore-mid'}`}>
                      {STATUS_LABELS[sv.status] ?? sv.status}
                    </span>
                  </td>
                  <td className="px-md py-sm text-center text-kore-ink">{sv.questionCount}</td>
                  <td className="px-md py-sm text-center">
                    <span className="flex items-center justify-center gap-xs text-kore-ink">
                      <Users size={12} className="text-kore-mid" /> {sv.responseCount}
                    </span>
                  </td>
                  <td className="px-md py-sm text-center">
                    <span className={`flex items-center justify-center gap-xs font-medium ${ratingColor(sv.avgRating)}`}>
                      <Star size={12} /> {sv.avgRating != null ? sv.avgRating.toFixed(1) : '--'}
                    </span>
                  </td>
                  <td className="px-md py-sm text-kore-mid">
                    {sv.startDate && sv.endDate
                      ? `${new Date(sv.startDate).toLocaleDateString('de-DE')} – ${new Date(sv.endDate).toLocaleDateString('de-DE')}`
                      : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-kore-white border border-kore-border p-2xl flex flex-col items-center text-center">
          <ClipboardList size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Umfragen</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">
            Erstellen Sie Ihre erste Mitarbeiterbefragung, um hier Ergebnisse zu sehen.
          </p>
          <Link
            to="/tools/pulse-survey"
            className="flex items-center gap-xs px-lg py-sm bg-kore-ink text-kore-white text-small hover:opacity-90"
          >
            <TrendingUp size={16} /> Zur Uebersicht
          </Link>
        </div>
      )}
    </div>
  );
}
