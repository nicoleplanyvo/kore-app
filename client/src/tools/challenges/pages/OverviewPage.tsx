import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Plus, Users, Target } from 'lucide-react';
import { useChallenges, useCreateChallenge } from '../../../hooks/useChallenges';

const STATUS_COLORS: Record<string, string> = { DRAFT: 'bg-kore-mid', ACTIVE: 'bg-emerald-500', COMPLETED: 'bg-blue-500', CANCELLED: 'bg-red-500' };
const STATUS_LABELS: Record<string, string> = { DRAFT: 'Entwurf', ACTIVE: 'Aktiv', COMPLETED: 'Beendet', CANCELLED: 'Abgebrochen' };
const TYPE_LABELS: Record<string, string> = { INDIVIDUAL: 'Einzeln', TEAM: 'Team', STORE: 'Store' };

export function OverviewPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, isLoading } = useChallenges({ page, status: status || undefined });
  const createChallenge = useCreateChallenge();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'INDIVIDUAL', metric: '', targetValue: 0, startDate: '', endDate: '', reward: '' });

  const handleCreate = () => {
    createChallenge.mutate({ ...form, targetValue: Number(form.targetValue) }, {
      onSuccess: () => { setShowCreate(false); setForm({ title: '', description: '', type: 'INDIVIDUAL', metric: '', targetValue: 0, startDate: '', endDate: '', reward: '' }); },
    });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Challenges</h1>
          <p className="text-body text-kore-mid mt-xs">Wettbewerbe & Gamification für das Team</p>
        </div>
      </div>

      <div className="flex gap-md mb-xl flex-wrap">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="border border-kore-border px-md py-sm text-small bg-kore-white">
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="COMPLETED">Beendet</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 transition-opacity flex items-center gap-xs">
          <Plus size={14} /> Neue Challenge
        </button>
      </div>

      {showCreate && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h3 className="font-medium text-kore-ink mb-md">Neue Challenge erstellen</h3>
          <div className="grid grid-cols-2 gap-md mb-md">
            <input placeholder="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border border-kore-border px-md py-sm text-small bg-kore-white">
              <option value="INDIVIDUAL">Einzeln</option>
              <option value="TEAM">Team</option>
              <option value="STORE">Store</option>
            </select>
            <input placeholder="Metrik (z.B. Umsatz)" value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="number" placeholder="Zielwert" value={form.targetValue || ''} onChange={(e) => setForm({ ...form, targetValue: Number(e.target.value) })} className="border border-kore-border px-md py-sm text-small" />
            <input type="date" placeholder="Start" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input type="date" placeholder="Ende" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
            <input placeholder="Belohnung" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} className="border border-kore-border px-md py-sm text-small" />
          </div>
          <textarea placeholder="Beschreibung" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-kore-border px-md py-sm text-small mb-md" rows={2} />
          <div className="flex gap-sm">
            <button onClick={handleCreate} disabled={!form.title || createChallenge.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Erstellen</button>
            <button onClick={() => setShowCreate(false)} className="px-md py-sm border border-kore-border text-small">Abbrechen</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade...</div>
      ) : !data?.data?.length ? (
        <div className="text-body text-kore-mid">Keine Challenges gefunden.</div>
      ) : (
        <>
          <div className="space-y-md">
            {data.data.map((ch: any) => (
              <Link key={ch.id} to={`/tools/challenges/${ch.id}`} className="block bg-kore-white border border-kore-border p-lg hover:border-kore-ink transition-colors">
                <div className="flex items-center justify-between mb-sm">
                  <h3 className="font-medium text-kore-ink flex items-center gap-xs">
                    <Trophy size={16} /> {ch.title}
                  </h3>
                  <div className="flex items-center gap-xs">
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[ch.status] ?? 'bg-kore-mid'}`} />
                    <span className="text-small text-kore-mid">{STATUS_LABELS[ch.status] ?? ch.status}</span>
                  </div>
                </div>
                {ch.description && <p className="text-small text-kore-mid mb-sm line-clamp-2">{ch.description}</p>}
                <div className="flex gap-lg text-small text-kore-mid">
                  <span>{TYPE_LABELS[ch.type] ?? ch.type}</span>
                  {ch.metric && <span className="flex items-center gap-xs"><Target size={12} /> {ch.metric}: {ch.targetValue}</span>}
                  <span className="flex items-center gap-xs"><Users size={12} /> {ch._count?.participants ?? 0} Teilnehmer</span>
                  {ch.reward && <span>🏆 {ch.reward}</span>}
                </div>
                {ch.startDate && ch.endDate && (
                  <div className="text-small text-kore-mid mt-xs">
                    {new Date(ch.startDate).toLocaleDateString('de-DE')} – {new Date(ch.endDate).toLocaleDateString('de-DE')}
                  </div>
                )}
              </Link>
            ))}
          </div>
          {data.total > data.pageSize && (
            <div className="flex gap-sm mt-lg">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Zurück</button>
              <span className="px-md py-sm text-small text-kore-mid">Seite {data.page} / {Math.ceil(data.total / data.pageSize)}</span>
              <button disabled={page * data.pageSize >= data.total} onClick={() => setPage(page + 1)} className="px-md py-sm border border-kore-border text-small disabled:opacity-40">Weiter</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
