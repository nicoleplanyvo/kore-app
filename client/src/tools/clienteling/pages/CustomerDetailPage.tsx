import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, Plus, MessageSquare, Calendar, Trash2, Edit3,
  Phone, Mail, ShieldCheck, ShieldOff, Gift, Award, Save, X,
} from 'lucide-react';
import {
  useCustomer, useUpdateCustomer, useDeleteCustomer, useAddInteraction,
} from '../../../hooks/useClienteling';

const VIP_COLORS: Record<string, string> = {
  GOLD: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-gray-100 text-gray-700',
  BRONZE: 'bg-orange-100 text-orange-700',
};
const TYPE_LABELS: Record<string, string> = { VISIT: 'Besuch', CALL: 'Anruf', EMAIL: 'E-Mail', SMS: 'SMS', WHATSAPP: 'WhatsApp', EVENT: 'Event' };
const TYPE_COLORS: Record<string, string> = { VISIT: 'bg-emerald-100 text-emerald-700', CALL: 'bg-blue-100 text-blue-700', EMAIL: 'bg-purple-100 text-purple-700', SMS: 'bg-cyan-100 text-cyan-700', WHATSAPP: 'bg-green-100 text-green-700', EVENT: 'bg-amber-100 text-amber-700' };
const APT_TYPE_LABELS: Record<string, string> = { BERATUNG: 'Beratung', STYLE_BERATUNG: 'Style-Beratung', VIP_EVENT: 'VIP-Event', PERSONAL_SHOPPING: 'Personal Shopping', ANPROBE: 'Anprobe', SONSTIGES: 'Sonstiges' };
const APT_STATUS_COLORS: Record<string, string> = { GEPLANT: 'bg-blue-100 text-blue-700', BESTAETIGT: 'bg-emerald-100 text-emerald-700', ABGESCHLOSSEN: 'bg-gray-100 text-gray-600', ABGESAGT: 'bg-red-100 text-red-700' };

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomer(id);
  const update = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const addInteraction = useAddInteraction();

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [iForm, setIForm] = useState({ type: 'VISIT', date: '', notes: '', purchaseAmount: '', channel: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) return <div className="p-xl text-body text-kore-mid">Lade Kundendaten...</div>;
  if (!customer) return <div className="p-xl text-body text-kore-mid">Kunde nicht gefunden.</div>;

  const startEdit = () => {
    setEditForm({
      firstName: customer.firstName, lastName: customer.lastName,
      email: customer.email ?? '', phone: customer.phone ?? '', whatsapp: customer.whatsapp ?? '',
      preferences: customer.preferences ?? '', sizes: customer.sizes ?? '',
      birthday: customer.birthday ? customer.birthday.slice(0, 10) : '',
      vipLevel: customer.vipLevel ?? '', loyaltyPoints: customer.loyaltyPoints ?? 0,
      notes: customer.notes ?? '',
      consentEmail: customer.consentEmail ?? false,
      consentSms: customer.consentSms ?? false,
      consentWhatsapp: customer.consentWhatsapp ?? false,
      consentGeneral: customer.consentGeneral ?? false,
    });
    setEditing(true);
  };

  const saveEdit = () => {
    update.mutate({ id: customer.id, ...editForm, loyaltyPoints: Number(editForm.loyaltyPoints) || 0, birthday: editForm.birthday || undefined }, {
      onSuccess: () => setEditing(false),
    });
  };

  const handleDelete = () => {
    deleteCustomer.mutate(customer.id, { onSuccess: () => navigate('/tools/clienteling') });
  };

  const handleInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    addInteraction.mutate(
      { customerId: customer.id, ...iForm, purchaseAmount: iForm.purchaseAmount ? Number(iForm.purchaseAmount) : undefined, date: iForm.date || undefined, channel: iForm.channel || undefined },
      { onSuccess: () => { setShowInteractionForm(false); setIForm({ type: 'VISIT', date: '', notes: '', purchaseAmount: '', channel: '' }); } },
    );
  };

  const ConsentIcon = ({ ok }: { ok: boolean }) => ok
    ? <ShieldCheck size={14} className="text-emerald-600" />
    : <ShieldOff size={14} className="text-red-400" />;

  return (
    <div className="p-xl max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/clienteling" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="font-display text-h1 text-kore-ink">{customer.firstName} {customer.lastName}</h1>
          <p className="text-body text-kore-mid mt-xs">
            {customer.store?.name ?? '--'}{customer.email ? ` · ${customer.email}` : ''}{customer.phone ? ` · ${customer.phone}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-sm">
          {customer.vipLevel && (
            <span className={`flex items-center gap-xs px-md py-sm text-small font-medium ${VIP_COLORS[customer.vipLevel] ?? 'bg-kore-bg text-kore-mid'}`}>
              <Star size={14} /> {customer.vipLevel}
            </span>
          )}
          <button onClick={startEdit} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small hover:border-kore-ink transition-colors">
            <Edit3 size={14} /> Bearbeiten
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-xs px-md py-sm border border-red-200 text-red-600 text-small hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> DSGVO-Loeschung
          </button>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="bg-red-50 border border-red-200 p-lg mb-xl">
          <h3 className="font-display text-h3 text-red-700 mb-sm">DSGVO-konforme Loeschung</h3>
          <p className="text-body text-red-600 mb-md">Alle Kundendaten, Interaktionen und Aufgaben werden unwiderruflich geloescht. Diese Aktion kann nicht rueckgaengig gemacht werden.</p>
          <div className="flex gap-sm">
            <button onClick={handleDelete} disabled={deleteCustomer.isPending} className="px-md py-sm bg-red-600 text-white text-small hover:bg-red-700 disabled:opacity-50">
              {deleteCustomer.isPending ? 'Loesche...' : 'Endgueltig loeschen'}
            </button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-md py-sm border border-kore-border text-small hover:border-kore-ink">Abbrechen</button>
          </div>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <div className="bg-kore-white border border-kore-border p-xl mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Kundendaten bearbeiten</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-md mb-lg">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Vorname</label>
              <input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Nachname</label>
              <input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">E-Mail</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Telefon</label>
              <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">WhatsApp</label>
              <input value={editForm.whatsapp} onChange={e => setEditForm({ ...editForm, whatsapp: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Geburtstag</label>
              <input type="date" value={editForm.birthday} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">VIP-Level</label>
              <select value={editForm.vipLevel} onChange={e => setEditForm({ ...editForm, vipLevel: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="">Kein VIP</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silber</option>
                <option value="GOLD">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Loyalty-Punkte</label>
              <input type="number" value={editForm.loyaltyPoints} onChange={e => setEditForm({ ...editForm, loyaltyPoints: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Groessen</label>
              <input value={editForm.sizes} onChange={e => setEditForm({ ...editForm, sizes: e.target.value })} placeholder="z.B. 42, M, US 9" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Vorlieben / Praeferenzen</label>
              <textarea value={editForm.preferences} onChange={e => setEditForm({ ...editForm, preferences: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Notizen</label>
              <textarea value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
          <div className="mb-lg">
            <label className="block text-small text-kore-mid mb-sm">DSGVO-Einwilligung</label>
            <div className="flex flex-wrap gap-lg">
              {[
                { key: 'consentGeneral', label: 'Allgemein' },
                { key: 'consentEmail', label: 'E-Mail' },
                { key: 'consentSms', label: 'SMS' },
                { key: 'consentWhatsapp', label: 'WhatsApp' },
              ].map(c => (
                <label key={c.key} className="flex items-center gap-xs text-body cursor-pointer">
                  <input type="checkbox" checked={editForm[c.key] ?? false} onChange={e => setEditForm({ ...editForm, [c.key]: e.target.checked })} className="accent-kore-brass" />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-sm">
            <button onClick={saveEdit} disabled={update.isPending} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass disabled:opacity-50 transition-colors">
              <Save size={14} /> {update.isPending ? 'Speichern...' : 'Speichern'}
            </button>
            <button onClick={() => setEditing(false)} className="flex items-center gap-xs px-md py-sm border border-kore-border text-small hover:border-kore-ink transition-colors">
              <X size={14} /> Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-md mb-xl">
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Kaeufe</span>
          <span className="font-display text-h2 text-kore-ink">{customer.totalPurchases}</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Umsatz</span>
          <span className="font-display text-h2 text-emerald-700">{(customer.totalSpent ?? 0).toFixed(0)} EUR</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Loyalty-Punkte</span>
          <span className="font-display text-h2 text-kore-brass">{customer.loyaltyPoints ?? 0}</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Interaktionen</span>
          <span className="font-display text-h2 text-kore-ink">{customer.interactions?.length ?? 0}</span>
        </div>
        <div className="bg-kore-white border border-kore-border p-lg text-center">
          <span className="block text-small text-kore-mid mb-xs">Letzter Besuch</span>
          <span className="text-body text-kore-ink">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('de-DE') : '--'}</span>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-xl mb-xl">
        {/* Contact & Preferences */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Profil</h2>
          <div className="space-y-md text-body">
            {customer.email && <div className="flex items-center gap-sm"><Mail size={14} className="text-kore-mid" /> {customer.email}</div>}
            {customer.phone && <div className="flex items-center gap-sm"><Phone size={14} className="text-kore-mid" /> {customer.phone}</div>}
            {customer.whatsapp && <div className="flex items-center gap-sm text-green-700">WhatsApp: {customer.whatsapp}</div>}
            {customer.birthday && <div className="flex items-center gap-sm"><Gift size={14} className="text-kore-mid" /> {new Date(customer.birthday).toLocaleDateString('de-DE')}</div>}
            {customer.sizes && <div><span className="text-kore-mid">Groessen:</span> {customer.sizes}</div>}
            {customer.preferences && <div><span className="text-kore-mid">Vorlieben:</span> {customer.preferences}</div>}
            {customer.notes && <div><span className="text-kore-mid">Notizen:</span> {customer.notes}</div>}
          </div>
        </div>

        {/* DSGVO Consent */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">DSGVO-Einwilligung</h2>
          <div className="space-y-md text-body">
            {[
              { key: 'consentGeneral', label: 'Allgemeine Einwilligung' },
              { key: 'consentEmail', label: 'E-Mail-Kommunikation' },
              { key: 'consentSms', label: 'SMS-Kommunikation' },
              { key: 'consentWhatsapp', label: 'WhatsApp-Kommunikation' },
            ].map(c => (
              <div key={c.key} className="flex items-center gap-sm">
                <ConsentIcon ok={customer[c.key]} />
                <span className={customer[c.key] ? 'text-kore-ink' : 'text-kore-faint'}>{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-small text-kore-faint mt-lg">Erstellt von {customer.creator?.name ?? '--'} am {new Date(customer.createdAt).toLocaleDateString('de-DE')}</p>
        </div>
      </div>

      {/* Appointments */}
      {customer.appointments && customer.appointments.length > 0 && (
        <div className="mb-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Calendar size={18} /> Termine</h2>
          <div className="space-y-sm">
            {customer.appointments.map((a: any) => (
              <div key={a.id} className="bg-kore-white border border-kore-border p-md flex items-center justify-between">
                <div>
                  <span className="font-medium text-kore-ink">{a.title}</span>
                  <div className="text-small text-kore-mid">
                    {APT_TYPE_LABELS[a.type] ?? a.type} · {new Date(a.startsAt).toLocaleDateString('de-DE')} {new Date(a.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}--{new Date(a.endsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    {a.advisor && ` · ${a.advisor.name}`}
                  </div>
                </div>
                <span className={`px-sm py-xs text-small ${APT_STATUS_COLORS[a.status] ?? 'bg-kore-bg text-kore-mid'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions */}
      <div className="mb-xl">
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-display text-h3 text-kore-ink flex items-center gap-sm"><MessageSquare size={18} /> Kommunikationshistorie</h2>
          <button onClick={() => setShowInteractionForm(!showInteractionForm)} className="flex items-center gap-xs px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass transition-colors">
            <Plus size={14} /> Interaktion erfassen
          </button>
        </div>

        {showInteractionForm && (
          <form onSubmit={handleInteraction} className="bg-kore-white border border-kore-border p-lg mb-md space-y-md">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
              <div>
                <label className="block text-small text-kore-mid mb-xs">Typ</label>
                <select value={iForm.type} onChange={e => setIForm({ ...iForm, type: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body">
                  <option value="VISIT">Besuch</option>
                  <option value="CALL">Anruf</option>
                  <option value="EMAIL">E-Mail</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Kanal</label>
                <input value={iForm.channel} onChange={e => setIForm({ ...iForm, channel: e.target.value })} placeholder="z.B. In-Store, Online" className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Datum</label>
                <input type="date" value={iForm.date} onChange={e => setIForm({ ...iForm, date: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
              <div>
                <label className="block text-small text-kore-mid mb-xs">Kaufbetrag (EUR)</label>
                <input type="number" step="0.01" value={iForm.purchaseAmount} onChange={e => setIForm({ ...iForm, purchaseAmount: e.target.value })} className="w-full border border-kore-border px-md py-sm text-body" />
              </div>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Notizen</label>
              <textarea value={iForm.notes} onChange={e => setIForm({ ...iForm, notes: e.target.value })} rows={2} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <button type="submit" disabled={addInteraction.isPending} className="px-md py-sm bg-kore-ink text-kore-white text-small hover:bg-kore-brass disabled:opacity-50 transition-colors">
              {addInteraction.isPending ? 'Speichern...' : 'Interaktion speichern'}
            </button>
          </form>
        )}

        {!customer.interactions?.length ? (
          <div className="bg-kore-white border border-kore-border p-lg text-center text-body text-kore-mid">Noch keine Interaktionen erfasst.</div>
        ) : (
          <div className="space-y-sm">
            {customer.interactions.map((i: any) => (
              <div key={i.id} className="bg-kore-white border border-kore-border p-md">
                <div className="flex items-center justify-between mb-xs">
                  <div className="flex items-center gap-sm">
                    <span className={`px-sm py-xs text-small ${TYPE_COLORS[i.type] ?? 'bg-kore-bg text-kore-mid'}`}>{TYPE_LABELS[i.type] ?? i.type}</span>
                    {i.channel && <span className="text-small text-kore-faint">{i.channel}</span>}
                    <span className="text-small text-kore-mid">{new Date(i.date).toLocaleDateString('de-DE')}</span>
                    <span className="text-small text-kore-faint">von {i.user?.name ?? '--'}</span>
                  </div>
                  {i.purchaseAmount > 0 && <span className="text-small font-medium text-emerald-700">{i.purchaseAmount.toFixed(2)} EUR</span>}
                </div>
                {i.notes && <p className="text-body text-kore-mid">{i.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations placeholder */}
      <div className="bg-kore-white border border-kore-border p-xl">
        <h2 className="font-display text-h3 text-kore-ink mb-md flex items-center gap-sm"><Award size={18} /> Empfehlungen</h2>
        <p className="text-body text-kore-mid">
          Basierend auf der Kaufhistorie und den Vorlieben koennen hier manuell Produktempfehlungen hinterlegt werden.
          {customer.preferences && <><br />Aktuelle Vorlieben: <span className="text-kore-ink font-medium">{customer.preferences}</span></>}
          {customer.sizes && <><br />Groessen: <span className="text-kore-ink font-medium">{customer.sizes}</span></>}
        </p>
      </div>
    </div>
  );
}
