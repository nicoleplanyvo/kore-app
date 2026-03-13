import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Users, Star, Plus, MessageSquare, CheckSquare } from 'lucide-react';
import { useClient, useUpdateClient, useAddInteraction, useAddClientTask } from '../../../hooks/useClienteling';

const TYPE_LABELS: Record<string, string> = { VISIT: 'Besuch', CALL: 'Anruf', EMAIL: 'E-Mail', EVENT: 'Event' };
const TYPE_COLORS: Record<string, string> = { VISIT: 'bg-emerald-100 text-emerald-700', CALL: 'bg-blue-100 text-blue-700', EMAIL: 'bg-purple-100 text-purple-700', EVENT: 'bg-amber-100 text-amber-700' };
const TASK_STATUS_COLORS: Record<string, string> = { OPEN: 'bg-blue-100 text-blue-700', DONE: 'bg-emerald-100 text-emerald-700', CANCELLED: 'bg-red-100 text-red-700' };

export function ClientDetailPage() {
  const { id } = useParams();
  const { data: client, isLoading } = useClient(id);
  const update = useUpdateClient();
  const addInteraction = useAddInteraction();
  const addTask = useAddClientTask();

  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ type: 'VISIT', date: '', notes: '', purchaseAmount: '' });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '' });

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade...</div>;
  if (!client) return <div className="p-xl text-body text-kore-mid">Kunde nicht gefunden.</div>;

  const handleInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    addInteraction.mutate(
      { clientId: client.id, ...interactionForm, purchaseAmount: interactionForm.purchaseAmount ? Number(interactionForm.purchaseAmount) : undefined },
      { onSuccess: () => { setShowInteractionForm(false); setInteractionForm({ type: 'VISIT', date: '', notes: '', purchaseAmount: '' }); } },
    );
  };

  const handleTask = (e: React.FormEvent) => {
    e.preventDefault();
    addTask.mutate(
      { clientId: client.id, ...taskForm },
      { onSuccess: () => { setShowTaskForm(false); setTaskForm({ title: '', dueDate: '' }); } },
    );
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/clienteling" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm">
            <Users size={24} /> {client.firstName} {client.lastName}
          </h1>
          <p className="text-body text-kore-mid mt-xs">
            {client.store?.name ?? '—'} · {client.email || '—'} · {client.phone || '—'}
          </p>
        </div>
        {client.vipLevel && (
          <span className="flex items-center gap-xs px-md py-sm bg-amber-100 text-amber-700 text-small font-medium">
            <Star size={14} /> {client.vipLevel}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Käufe gesamt</span>
          <span className="font-display text-h2 text-kore-ink">{client.totalPurchases}</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Interaktionen</span>
          <span className="font-display text-h2 text-kore-ink">{client.interactions?.length ?? 0}</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Offene Tasks</span>
          <span className="font-display text-h2 text-kore-ink">{client.tasks?.filter((t: any) => t.status === 'OPEN').length ?? 0}</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Letzter Besuch</span>
          <span className="text-body text-kore-ink">{client.lastVisit ? new Date(client.lastVisit).toLocaleDateString('de-DE') : '—'}</span>
        </div>
      </div>

      {/* Preferences */}
      {client.preferences && (
        <div className="bg-kore-white border border-kore-border p-lg mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-sm">Präferenzen</h2>
          <p className="text-body text-kore-mid">{client.preferences}</p>
        </div>
      )}

      {/* Interactions */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm"><MessageSquare size={18} /> Interaktionen</h2>
          <button onClick={() => setShowInteractionForm(!showInteractionForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={14} /> Neu
          </button>
        </div>

        {showInteractionForm && (
          <form onSubmit={handleInteraction} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div className="grid grid-cols-3 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Typ</label>
                <select value={interactionForm.type} onChange={e => setInteractionForm({ ...interactionForm, type: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                  <option value="VISIT">Besuch</option>
                  <option value="CALL">Anruf</option>
                  <option value="EMAIL">E-Mail</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Datum</label>
                <input type="date" value={interactionForm.date} onChange={e => setInteractionForm({ ...interactionForm, date: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Kaufbetrag (€)</label>
                <input type="number" step="0.01" value={interactionForm.purchaseAmount} onChange={e => setInteractionForm({ ...interactionForm, purchaseAmount: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Notizen</label>
              <textarea value={interactionForm.notes} onChange={e => setInteractionForm({ ...interactionForm, notes: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <button type="submit" disabled={addInteraction.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
              {addInteraction.isPending ? 'Speichern...' : 'Interaktion speichern'}
            </button>
          </form>
        )}

        {!client.interactions?.length ? (
          <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Noch keine Interaktionen.</div>
        ) : (
          <div className="space-y-sm">
            {client.interactions.map((i: any) => (
              <div key={i.id} className="bg-kore-white border border-kore-border p-md">
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <span className={`px-sm py-xs text-small ${TYPE_COLORS[i.type] ?? 'bg-kore-bg text-kore-mid'}`}>{TYPE_LABELS[i.type] ?? i.type}</span>
                    <span className="text-small text-kore-mid">{new Date(i.date).toLocaleDateString('de-DE')}</span>
                    <span className="text-small text-kore-mid">von {i.user?.name ?? '—'}</span>
                  </div>
                  {i.purchaseAmount > 0 && <span className="text-small font-medium text-emerald-700">{i.purchaseAmount?.toFixed(2)} €</span>}
                </div>
                {i.notes && <p className="text-body text-kore-mid">{i.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm"><CheckSquare size={18} /> Aufgaben</h2>
          <button onClick={() => setShowTaskForm(!showTaskForm)} className="flex items-center gap-xs px-sm py-xs bg-kore-ink text-kore-white text-small hover:opacity-90">
            <Plus size={14} /> Neu
          </button>
        </div>

        {showTaskForm && (
          <form onSubmit={handleTask} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Titel</label>
                <input value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Fällig am</label>
                <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
            </div>
            <button type="submit" disabled={addTask.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:opacity-90 disabled:opacity-50">
              {addTask.isPending ? 'Speichern...' : 'Aufgabe anlegen'}
            </button>
          </form>
        )}

        {!client.tasks?.length ? (
          <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Noch keine Aufgaben.</div>
        ) : (
          <div className="space-y-sm">
            {client.tasks.map((t: any) => (
              <div key={t.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                <div>
                  <span className="font-medium text-kore-ink">{t.title}</span>
                  {t.dueDate && <span className="text-small text-kore-mid ml-sm">Fällig: {new Date(t.dueDate).toLocaleDateString('de-DE')}</span>}
                </div>
                <span className={`px-sm py-xs text-small ${TASK_STATUS_COLORS[t.status] ?? 'bg-kore-bg text-kore-mid'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
