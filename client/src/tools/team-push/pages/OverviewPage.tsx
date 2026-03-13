import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Plus, AlertTriangle, AlertCircle } from 'lucide-react';
import { useTeamMessages, useCreateTeamMessage } from '../../../hooks/useTeamPush';

const PRIORITY_ICONS: Record<string, any> = { NORMAL: null, HIGH: <AlertTriangle size={14} className="text-amber-500" />, URGENT: <AlertCircle size={14} className="text-red-500" /> };
const PRIORITY_COLORS: Record<string, string> = { NORMAL: '', HIGH: 'border-l-4 border-l-amber-500', URGENT: 'border-l-4 border-l-red-500' };
const TARGET_LABELS: Record<string, string> = { ALL: 'Alle', STORE: 'Store', ROLE: 'Rolle' };

export function OverviewPage() {
  const { data: messages, isLoading } = useTeamMessages();
  const create = useCreateTeamMessage();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', priority: 'NORMAL', targetType: 'ALL' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(form, { onSuccess: () => { setShowForm(false); setForm({ title: '', body: '', priority: 'NORMAL', targetType: 'ALL' }); } });
  };

  return (
    <div className="p-xl max-w-5xl">
      <div className="flex items-center justify-between mb-2xl">
        <div>
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Send size={24} /> Team Push</h1>
          <p className="text-body text-kore-mid mt-xs">Wichtige Nachrichten an das Team senden.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90">
          <Plus size={16} /> Neue Nachricht
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-lg mb-xl space-y-md">
          <div>
            <label className="block text-small text-kore-mid mb-xs">Titel</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Nachricht</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={4} className="w-full border border-kore-border px-md py-sm text-body" required />
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Priorität</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Zielgruppe</label>
              <select value={form.targetType} onChange={e => setForm({ ...form, targetType: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="ALL">Alle</option>
                <option value="STORE">Store</option>
                <option value="ROLE">Rolle</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">Nachricht senden</button>
        </form>
      )}

      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Nachrichten...</div>
      ) : !messages?.length ? (
        <div className="bg-kore-white border border-kore-border p-2xl text-center text-body text-kore-mid">Noch keine Nachrichten vorhanden.</div>
      ) : (
        <div className="space-y-sm">
          {messages.map((m: any) => (
            <Link key={m.id} to={`/tools/team-push/messages/${m.id}`} className={`block bg-kore-white border border-kore-border p-md hover:border-kore-ink transition-colors ${PRIORITY_COLORS[m.priority] ?? ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  {PRIORITY_ICONS[m.priority]}
                  <span className="font-medium text-kore-ink">{m.title}</span>
                </div>
                <span className="text-small text-kore-mid">{TARGET_LABELS[m.targetType] ?? m.targetType}</span>
              </div>
              <div className="flex gap-md text-small text-kore-mid mt-xs">
                <span>{m.sender?.name ?? '—'}</span>
                <span>{new Date(m.createdAt).toLocaleString('de-DE')}</span>
                <span>{m._count?.reads ?? 0} gelesen</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
