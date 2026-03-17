import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Sun, Moon, Star, CheckCircle, BarChart3 } from 'lucide-react';
import { useBriefings, useBriefingStores, useMarkBriefingRead } from '../../../hooks/useBriefings';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  MORNING: <Sun size={16} className="text-amber-500" />,
  EVENING: <Moon size={16} className="text-indigo-500" />,
  SPECIAL: <Star size={16} className="text-emerald-500" />,
};
const TYPE_LABELS: Record<string, string> = { MORNING: 'Morgen-Briefing', EVENING: 'Abend-Briefing', SPECIAL: 'Sonder-Briefing' };

export function OverviewPage() {
  const [storeId, setStoreId] = useState('');
  const [page, setPage] = useState(1);
  const { data: stores } = useBriefingStores();
  const { data: result, isLoading } = useBriefings({ storeId: storeId || undefined, page });
  const markRead = useMarkBriefingRead();

  const today = new Date().toISOString().split('T')[0];
  const briefings = result?.data ?? [];
  const todayBriefing = briefings.find((b: any) => b.date === today);
  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 1;

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Taegliches Store-Briefing</h1>
          <p className="text-body text-kore-mid mt-xs">Strukturierte Tagesinformationen fuer das Team erstellen und lesen.</p>
        </div>
        <div className="flex items-center gap-md">
          <Link to="/tools/briefings/dashboard" className="flex items-center gap-xs px-md py-sm border border-kore-border text-kore-ink text-small hover:border-kore-ink transition-colors">
            <BarChart3 size={16} /> Dashboard
          </Link>
          <Link to="/tools/briefings/create" className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={16} /> Neues Briefing
          </Link>
        </div>
      </div>

      {/* Store selector */}
      {stores && stores.length > 1 && (
        <div className="mb-xl">
          <select
            value={storeId}
            onChange={(e) => { setStoreId(e.target.value); setPage(1); }}
            className="border border-kore-border px-md py-sm text-body"
          >
            <option value="">Alle Stores</option>
            {stores.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* Today's briefing highlight */}
      {todayBriefing && (
        <div className="bg-kore-white border-2 border-kore-brass p-xl mb-xl">
          <div className="flex items-center justify-between mb-md">
            <div className="flex items-center gap-sm">
              {TYPE_ICONS[todayBriefing.type] ?? <FileText size={16} className="text-kore-mid" />}
              <span className="font-display text-h3 text-kore-ink">Heutiges Briefing</span>
            </div>
            <span className="text-small text-kore-brass font-medium uppercase tracking-widest">{TYPE_LABELS[todayBriefing.type] ?? todayBriefing.type}</span>
          </div>
          <Link to={`/tools/briefings/${todayBriefing.id}`} className="block">
            <h2 className="font-display text-h2 text-kore-ink mb-sm hover:text-kore-brass transition-colors">{todayBriefing.title}</h2>
          </Link>
          <div className="flex items-center gap-lg text-small text-kore-mid mb-lg">
            <span>{todayBriefing.creator?.name ?? '—'}</span>
            {todayBriefing.store && <span>{todayBriefing.store.name}</span>}
            <span>{todayBriefing._count?.acknowledgments ?? 0} gelesen</span>
          </div>
          <div className="flex items-center gap-md">
            <button
              onClick={() => markRead.mutate(todayBriefing.id)}
              disabled={markRead.isPending}
              className="flex items-center gap-xs px-md py-sm bg-emerald-600 text-kore-white text-small hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle size={16} /> Gelesen bestaetigen
            </button>
            <Link to={`/tools/briefings/${todayBriefing.id}`} className="px-md py-sm border border-kore-border text-kore-ink text-small hover:border-kore-ink transition-colors">
              Details ansehen
            </Link>
          </div>
        </div>
      )}

      {/* KPI cards */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-xl mb-xl">
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Briefings gesamt</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{result.total}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Heute</span>
            <div className="font-display text-h1 text-kore-ink mt-sm">{todayBriefing ? '1' : '0'}</div>
          </div>
          <div className="bg-kore-white border border-kore-border p-xl">
            <span className="text-caption text-kore-mid uppercase tracking-widest">Seite</span>
            <div className="font-display text-h2 text-kore-ink mt-sm">{page} / {totalPages}</div>
          </div>
        </div>
      )}

      {/* Briefing list */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Briefings...</div>
      ) : !briefings.length ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <FileText size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Noch keine Briefings</h2>
          <p className="text-body text-kore-mid max-w-md mb-xl">Erstellen Sie das erste Tages-Briefing fuer Ihr Team.</p>
          <Link to="/tools/briefings/create" className="flex items-center gap-sm bg-kore-ink text-kore-white px-xl py-md-sm text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
            <Plus size={16} /> Briefing erstellen
          </Link>
        </div>
      ) : (
        <>
          <h2 className="font-display text-h3 text-kore-ink mb-md">Alle Briefings</h2>
          <div className="space-y-sm">
            {briefings.map((b: any) => (
              <Link key={b.id} to={`/tools/briefings/${b.id}`} className="block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm">
                    {TYPE_ICONS[b.type] ?? <FileText size={16} className="text-kore-mid" />}
                    <span className="font-medium text-kore-ink">{b.title}</span>
                    {b.date === today && <span className="px-xs py-px bg-kore-brass text-kore-white text-caption uppercase tracking-widest">Heute</span>}
                  </div>
                  <span className="text-small text-kore-mid">{TYPE_LABELS[b.type] ?? b.type}</span>
                </div>
                <div className="flex gap-md text-small text-kore-mid mt-xs">
                  <span>{new Date(b.date + 'T00:00:00').toLocaleDateString('de-DE')}</span>
                  <span>{b.creator?.name ?? '—'}</span>
                  <span>{b._count?.acknowledgments ?? 0} gelesen</span>
                  {b.store && <span>{b.store.name}</span>}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-md mt-xl">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-md py-sm border border-kore-border text-small disabled:opacity-30">Zurueck</button>
              <span className="text-small text-kore-mid">Seite {page} von {totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-md py-sm border border-kore-border text-small disabled:opacity-30">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
