import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateCustomer, useClientelingStores } from '../../../hooks/useClienteling';

export function CreateCustomerPage() {
  const navigate = useNavigate();
  const create = useCreateCustomer();
  const { data: stores } = useClientelingStores();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', whatsapp: '',
    preferences: '', sizes: '', birthday: '', vipLevel: '', notes: '',
    storeId: '',
    consentGeneral: false, consentEmail: false, consentSms: false, consentWhatsapp: false,
  });

  const set = (key: string, value: string | boolean) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { ...form };
    if (!data['email']) delete data['email'];
    if (!data['vipLevel']) delete data['vipLevel'];
    if (!data['birthday']) delete data['birthday'];
    create.mutate(data, {
      onSuccess: () => navigate('/tools/clienteling'),
    });
  };

  return (
    <div className="p-xl max-w-4xl">
      <div className="flex items-center gap-md mb-2xl">
        <Link to="/tools/clienteling" className="text-kore-mid hover:text-kore-ink transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display text-h1 text-kore-ink">Neuer Kunde</h1>
          <p className="text-body text-kore-mid mt-xs">Kundenprofil mit DSGVO-Einwilligung anlegen</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-xl">
        {/* Personal Data */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Persoenliche Daten</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Vorname *</label>
              <input value={form.firstName} onChange={e => set('firstName', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Nachname *</label>
              <input value={form.lastName} onChange={e => set('lastName', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" required />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Geburtstag</label>
              <input type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Kontaktdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">E-Mail</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Telefon</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">WhatsApp</label>
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Vorlieben und Groessen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="block text-small text-kore-mid mb-xs">Vorlieben / Praeferenzen</label>
              <textarea value={form.preferences} onChange={e => set('preferences', e.target.value)} rows={3} placeholder="z.B. Sneaker, Premium-Marken, Casual-Style" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Groessen</label>
              <input value={form.sizes} onChange={e => set('sizes', e.target.value)} placeholder="z.B. Oberteil M, Hose 32, Schuh 42" className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
        </div>

        {/* Store & VIP */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">Zuordnung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {stores && stores.length > 0 && (
              <div>
                <label className="block text-small text-kore-mid mb-xs">Store</label>
                <select value={form.storeId} onChange={e => set('storeId', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                  <option value="">-- Automatisch --</option>
                  {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-small text-kore-mid mb-xs">VIP-Level</label>
              <select value={form.vipLevel} onChange={e => set('vipLevel', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body">
                <option value="">Kein VIP</option>
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silber</option>
                <option value="GOLD">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-small text-kore-mid mb-xs">Notizen</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} className="w-full border border-kore-border px-md py-sm text-body" />
            </div>
          </div>
        </div>

        {/* DSGVO Consent */}
        <div className="bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-sm">DSGVO-Einwilligung</h2>
          <p className="text-small text-kore-mid mb-lg">Bitte dokumentieren Sie die erteilten Einwilligungen des Kunden.</p>
          <div className="space-y-md">
            {[
              { key: 'consentGeneral', label: 'Allgemeine Einwilligung zur Datenspeicherung', desc: 'Der Kunde stimmt der Speicherung seiner personenbezogenen Daten zu.' },
              { key: 'consentEmail', label: 'E-Mail-Kommunikation', desc: 'Der Kunde stimmt dem Erhalt von E-Mail-Nachrichten zu.' },
              { key: 'consentSms', label: 'SMS-Kommunikation', desc: 'Der Kunde stimmt dem Erhalt von SMS-Nachrichten zu.' },
              { key: 'consentWhatsapp', label: 'WhatsApp-Kommunikation', desc: 'Der Kunde stimmt dem Erhalt von WhatsApp-Nachrichten zu.' },
            ].map(c => (
              <label key={c.key} className="flex items-start gap-md cursor-pointer">
                <input
                  type="checkbox"
                  checked={(form as any)[c.key]}
                  onChange={e => set(c.key, e.target.checked)}
                  className="mt-1 accent-kore-brass"
                />
                <div>
                  <span className="text-body text-kore-ink font-medium">{c.label}</span>
                  <p className="text-small text-kore-mid">{c.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-sm">
          <button type="submit" disabled={create.isPending || !form.firstName || !form.lastName} className="flex items-center gap-xs px-xl py-md-sm bg-kore-ink text-kore-white text-small font-medium uppercase tracking-widest hover:bg-kore-brass disabled:opacity-50 transition-colors">
            <Save size={16} /> {create.isPending ? 'Speichern...' : 'Kunden anlegen'}
          </button>
          <Link to="/tools/clienteling" className="flex items-center gap-xs px-xl py-md-sm border border-kore-border text-kore-ink text-small font-medium uppercase tracking-widest hover:border-kore-ink transition-colors">
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
