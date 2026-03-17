import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, BarChart3, Eye, FileText, Send, Archive,
  TrendingUp, Users, Layers,
} from 'lucide-react';
import { useNewsletterDashboard } from '../../../hooks/useNewsletter';

/* eslint-disable @typescript-eslint/no-explicit-any */

const PERIODS = [
  { key: 'quarter', label: 'Quartal' },
  { key: 'halfyear', label: 'Halbjahr' },
  { key: 'year', label: 'Dieses Jahr' },
  { key: 'all', label: 'Gesamt' },
];

function getDateRange(period: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  switch (period) {
    case 'quarter': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return { from: fmt(d), to: fmt(today) };
    }
    case 'halfyear': {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return { from: fmt(d), to: fmt(today) };
    }
    case 'year':
      return { from: fmt(new Date(today.getFullYear(), 0, 1)), to: fmt(today) };
    case 'all':
    default:
      return { from: undefined, to: undefined };
  }
}

export function DashboardPage() {
  const [period, setPeriod] = useState('all');
  const dateRange = getDateRange(period);

  const { data: dashboard } = useNewsletterDashboard({
    from: dateRange.from,
    to: dateRange.to,
  });

  const kpis = dashboard?.kpis;
  const topByViews = dashboard?.topByViews || [];
  const authorPerf = dashboard?.authorPerformance || [];
  const trends = dashboard?.trends || [];
  const dailyViews = dashboard?.dailyViews || [];

  const maxDailyViews = Math.max(...dailyViews.map((d) => d.count), 1);
  const maxTrendCreated = Math.max(...trends.map((t) => t.created), 1);

  return (
    <div className="p-lg max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-lg">
        <Link to="/tools/newsletter" className="text-kore-mid hover:text-kore-ink">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <BarChart3 size={24} /> Newsletter Analytics
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            Engagement und Reichweite Ihrer Newsletter
          </p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-sm mb-lg">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-md py-sm text-small border ${
              period === p.key
                ? 'bg-kore-ink text-kore-white border-kore-ink'
                : 'border-kore-border text-kore-mid hover:text-kore-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md mb-xl">
          {[
            { label: 'Gesamt', value: kpis.total, icon: FileText, color: 'text-kore-ink' },
            { label: 'Veroeffentlicht', value: kpis.published, icon: Send, color: 'text-emerald-600' },
            { label: 'Entwuerfe', value: kpis.drafts, icon: Layers, color: 'text-amber-600' },
            { label: 'Archiviert', value: kpis.archived, icon: Archive, color: 'text-blue-600' },
            { label: 'Aufrufe gesamt', value: kpis.totalViews, icon: Eye, color: 'text-purple-600' },
            { label: 'Aufrufe / NL', value: kpis.avgViewsPerNewsletter, icon: TrendingUp, color: 'text-kore-brass' },
            { label: 'Abschnitte gesamt', value: kpis.totalSections, icon: Layers, color: 'text-kore-mid' },
            { label: 'Abschnitte / NL', value: kpis.avgSectionsPerNewsletter, icon: Layers, color: 'text-kore-mid' },
          ].map((k, i) => {
            const Icon = k.icon;
            return (
              <div key={i} className="bg-kore-white border border-kore-border p-md">
                <div className="flex items-center gap-sm mb-sm">
                  <Icon size={16} className={k.color} />
                  <span className="text-xs text-kore-mid uppercase">{k.label}</span>
                </div>
                <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Views Chart */}
      {dailyViews.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <Eye size={18} /> Aufrufe pro Tag (letzte 30 Tage)
          </h2>
          <div className="flex items-end gap-1 h-32">
            {dailyViews.map((d, i) => {
              const h = Math.max((d.count / maxDailyViews) * 100, 4);
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                  title={`${d.date}: ${d.count} Aufrufe`}
                >
                  <span className="text-xs font-bold text-purple-600 mb-1">
                    {d.count > 0 ? d.count : ''}
                  </span>
                  <div
                    className="w-full rounded-t bg-purple-500"
                    style={{ height: `${h}%` }}
                  />
                  {i % 5 === 0 && (
                    <div className="text-xs text-kore-mid mt-1">{d.date.slice(5)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {trends.length > 0 && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
            <TrendingUp size={18} /> Monatlicher Trend
          </h2>
          <div className="flex items-end gap-2 h-36">
            {trends.slice(-12).map((t, i) => {
              const createdH = Math.max((t.created / maxTrendCreated) * 100, 4);
              const publishedH = t.created > 0 ? Math.max((t.published / maxTrendCreated) * 100, 2) : 0;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                  title={`${t.month}: ${t.created} erstellt, ${t.published} veroeffentlicht, ${t.views} Aufrufe`}
                >
                  <span className="text-xs font-bold text-kore-ink mb-1">
                    {t.created > 0 ? t.created : ''}
                  </span>
                  <div className="w-full relative flex-1 flex flex-col justify-end">
                    <div
                      className="w-full rounded-t bg-kore-brass/30"
                      style={{ height: `${createdH}%` }}
                    />
                    <div
                      className="w-full rounded-t bg-emerald-500 absolute bottom-0"
                      style={{ height: `${publishedH}%` }}
                    />
                  </div>
                  <div className="text-xs text-kore-mid mt-1">{t.month.slice(5)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-lg mt-md text-xs text-kore-mid">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-kore-brass/30" /> Erstellt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Veroeffentlicht
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
        {/* Top Newsletters */}
        {topByViews.length > 0 && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
              <Eye size={18} /> Top Newsletter nach Aufrufen
            </h2>
            <div className="space-y-sm">
              {topByViews.map((n, i) => (
                <Link
                  key={n.id}
                  to={`/tools/newsletter/${n.id}`}
                  className="flex items-center gap-md p-md bg-kore-bg border border-kore-border hover:border-kore-ink transition-colors"
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                      i === 0
                        ? 'bg-amber-100 text-amber-700'
                        : i === 1
                          ? 'bg-gray-200 text-gray-600'
                          : i === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-kore-bg text-kore-mid'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-kore-ink text-small truncate">{n.title}</div>
                    <div className="text-xs text-kore-mid">
                      {n.creator?.name ?? '--'}{' '}
                      {n.publishedAt &&
                        ` | ${new Date(n.publishedAt).toLocaleDateString('de-DE')}`}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-purple-600">{n.views}</div>
                    <div className="text-xs text-kore-mid">Aufrufe</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Performance */}
        {authorPerf.length > 0 && (
          <div className="bg-kore-white border border-kore-border p-lg">
            <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm">
              <Users size={18} /> Autoren
            </h2>
            <div className="space-y-sm">
              {authorPerf.map((a) => {
                const maxViews = Math.max(...authorPerf.map((x) => x.totalViews), 1);
                const barW = Math.max((a.totalViews / maxViews) * 100, 4);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-md p-md bg-kore-bg border border-kore-border"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kore-brass to-amber-700 flex items-center justify-center text-white text-xs font-bold">
                      {a.name
                        .split(' ')
                        .map((w: string) => w[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-kore-ink text-small">{a.name}</div>
                      <div className="text-xs text-kore-mid">
                        {a.count} erstellt | {a.published} veroeffentlicht
                      </div>
                      <div className="h-2 bg-kore-bg rounded mt-1">
                        <div
                          className="h-full rounded bg-purple-500"
                          style={{ width: `${barW}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-purple-600">{a.totalViews}</div>
                      <div className="text-xs text-kore-mid">Aufrufe</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!kpis && (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-kore-mid">
          Keine Daten fuer diesen Zeitraum vorhanden.
        </div>
      )}
    </div>
  );
}
