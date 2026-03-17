import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Clock, X, Star } from 'lucide-react';
import {
  useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment,
  useClientelingStores, useClientelingUsers, useCustomers,
} from '../../../hooks/useClienteling';

const TYPE_LABELS: Record<string, string> = { BERATUNG: 'Beratung', STYLE_BERATUNG: 'Style-Beratung', VIP_EVENT: 'VIP-Event', PERSONAL_SHOPPING: 'Personal Shopping', ANPROBE: 'Anprobe', SONSTIGES: 'Sonstiges' };
const STATUS_LABELS: Record<string, string> = { GEPLANT: 'Geplant', BESTAETIGT: 'Bestaetigt', ABGESCHLOSSEN: 'Abgeschlossen', ABGESAGT: 'Abgesagt' };
const STATUS_COLORS: Record<string, string> = { GEPLANT: 'bg-blue-100 text-blue-700', BESTAETIGT: 'bg-emerald-100 text-emerald-700', ABGESCHLOSSEN: 'bg-gray-100 text-gray-600', ABGESAGT: 'bg-red-100 text-red-700' };

export function AppointmentsPage() {
  const [storeId, setStoreId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: stores } = useClientelingStores();
  const { data: users } = useClientelingUsers();
  const { data: customerData } = useCustomers({ pageSize: 200 });
  const customers = customerData?.data ?? [];

  const { data: appointments, isLoading } = useAppointments({
    storeId: storeId || undefined,
    status: statusFilter || undefined,
  });

  const create = useCreateAppointment();
  const updateApt = useUpdateAppointment();
  const deleteApt = useDeleteAppointment();

  const [form, setForm] = useState({
    title: '', type: 'BERATUNG', storeId: '', clientId: '', advisorId: '',
    startsAt: '', endsAt: '', notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { ...form };
    if (!data['clientId']) delete data['clientId'];
    if (!data['advisorId']) delete data['advisorId'];
    create.mutate(data, {
      onSuccess: () => { setShowForm(false); setForm({ title: '', type: 'BERATUNG', storeId: '', clientId: '', advisorId: '', startsAt: '', endsAt: '', notes: '' }); },
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    updateApt.mutate({ id, status });
  };

  // Group appointments by date
  const grouped: Record<string, any[]> = {};
  (appointments ?? []).forEach((a: any) => {
    const dateKey = new Date(a.startsAt).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(a);
  });

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/clienteling" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink flex items-center gap-sm"><Calendar size={24} /> Termine</h1>
          <p className="text-body text-kore-mid mt-xs">Kundentermine planen und verwalten</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-xs px-lg py-md-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass transition-colors">
          <Plus size={16} /> Neuer Termin
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-kore-white border border-kore-border p-xl mb-xl space-y-md">
          <h2 className="font-display text-h3 text-kore-ink mb-sm">Termin anlegen</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Titel *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Typ</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Store *</label>
              <select value={form.storeId} onChange={e => setForm({ ...form, storeId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required>
                <option value="">-- Waehlen --</option>
                {(stores ?? []).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Kunde (optional)</label>
              <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="">-- Kein Kunde --</option>
                {customers.map((c: any) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Berater (optional)</label>
              <select value={form.advisorId} onChange={e => setForm({ ...form, advisorId: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="">-- Ich selbst --</option>
                {(users ?? []).map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Beginn *</label>
                <input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Ende *</label>
                <input type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" required />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-small text-kore-mid mb-xs">Notizen</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
          </div>
          <div className="flex gap-sm">
            <button type="submit" disabled={create.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass disabled:opacity-50 transition-colors">
              {create.isPending ? 'Speichern...' : 'Termin anlegen'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-md py-sm border border-kore-border text-small hover:border-kore-ink transition-colors">Abbrechen</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex gap-md mb-xl">
        {stores && stores.length > 1 && (
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="border border-kore-border px-md py-sm text-body">
            <option value="">Alle Stores</option>
            {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-kore-border px-md py-sm text-body">
          <option value="">Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Appointment List */}
      {isLoading ? (
        <div className="text-body text-kore-mid">Lade Termine...</div>
      ) : !appointments?.length ? (
        <div className="bg-kore-white border border-kore-border p-3xl flex flex-col items-center text-center">
          <Calendar size={48} className="text-kore-faint mb-lg" />
          <h2 className="font-display text-h2 text-kore-ink mb-md">Keine Termine</h2>
          <p className="text-body text-kore-mid max-w-md">Legen Sie Ihren ersten Kundentermin an.</p>
        </div>
      ) : (
        <div className="space-y-xl">
          {Object.entries(grouped).map(([dateLabel, apts]) => (
            <div key={dateLabel}>
              <h3 className="font-display text-h3 text-kore-ink mb-md">{dateLabel}</h3>
              <div className="space-y-sm">
                {apts.map((a: any) => (
                  <div key={a.id} className="bg-kore-white border border-kore-border p-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-sm mb-xs">
                          <span className="font-medium text-kore-ink">{a.title}</span>
                          <span className="text-small text-kore-mid px-sm py-xs bg-kore-bg">{TYPE_LABELS[a.type] ?? a.type}</span>
                          <span className={`px-sm py-xs text-small ${STATUS_COLORS[a.status] ?? 'bg-kore-bg text-kore-mid'}`}>{STATUS_LABELS[a.status] ?? a.status}</span>
                        </div>
                        <div className="flex items-center gap-md text-small text-kore-mid">
                          <span className="flex items-center gap-xs"><Clock size={12} /> {new Date(a.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}--{new Date(a.endsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                          {a.store && <span>{a.store.name}</span>}
                          {a.advisor && <span>Berater: {a.advisor.name}</span>}
                          {a.client && (
                            <Link to={`/tools/clienteling/customers/${a.client.id}`} className="flex items-center gap-xs hover:text-kore-ink transition-colors">
                              {a.client.firstName} {a.client.lastName}
                              {a.client.vipLevel && <Star size={10} className="text-amber-500" />}
                            </Link>
                          )}
                        </div>
                        {a.notes && <p className="text-small text-kore-mid mt-xs">{a.notes}</p>}
                      </div>
                      <div className="flex items-center gap-xs ml-md">
                        {a.status === 'GEPLANT' && (
                          <button onClick={() => handleStatusChange(a.id, 'BESTAETIGT')} className="px-sm py-xs text-small bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors">Bestaetigen</button>
                        )}
                        {a.status === 'BESTAETIGT' && (
                          <button onClick={() => handleStatusChange(a.id, 'ABGESCHLOSSEN')} className="px-sm py-xs text-small bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">Abschliessen</button>
                        )}
                        {(a.status === 'GEPLANT' || a.status === 'BESTAETIGT') && (
                          <button onClick={() => handleStatusChange(a.id, 'ABGESAGT')} className="px-sm py-xs text-small bg-red-50 text-red-600 hover:bg-red-100 transition-colors">Absagen</button>
                        )}
                        <button onClick={() => deleteApt.mutate(a.id)} className="p-xs text-kore-faint hover:text-red-600 transition-colors"><X size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
