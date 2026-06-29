import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Store as StoreIcon, Plus, Trash2, Check, Copy, UserPlus } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { api } from '../../lib/api';

interface StoreRow {
  name: string;
  city: string;
}

interface OnboardResult {
  tenant: { id: string; name: string; slug: string };
  stores: { id: string; name: string; city: string | null }[];
  tools: string[];
  admin: { name: string; email: string; tempPassword: string | null };
  loginUrl: string;
}

const PACKAGES: Record<string, { label: string; hint: string; keys: string[] }> = {
  pilot: {
    label: 'Pilot — VM Compliance + Audit',
    hint: 'Die zwei Hero-Tools (empfohlen für neue Piloten)',
    keys: ['standards.vm_foto_compliance', 'standards.excellence_tracker'],
  },
  standards: {
    label: 'Standards & Compliance',
    hint: 'Checklisten, Store Standards, Excellence Tracker, VM Compliance, SOP-Bibliothek',
    keys: [
      'standards.checklisten',
      'standards.store_standards',
      'standards.excellence_tracker',
      'standards.vm_foto_compliance',
      'standards.sop_bibliothek',
    ],
  },
  all: {
    label: 'Alle Tools',
    hint: 'Voller Funktionsumfang (alle 35 Tools)',
    keys: ['*'],
  },
};

export function OnboardingPage() {
  const [tenantName, setTenantName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [maxUsers, setMaxUsers] = useState('15');
  const [stores, setStores] = useState<StoreRow[]>([{ name: '', city: '' }]);
  const [pkg, setPkg] = useState<string>('pilot');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const updateStore = (i: number, field: keyof StoreRow, value: string) => {
    setStores((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };
  const addStore = () => setStores((prev) => [...prev, { name: '', city: '' }]);
  const removeStore = (i: number) => setStores((prev) => prev.filter((_, idx) => idx !== i));

  const reset = () => {
    setTenantName('');
    setContactEmail('');
    setMaxUsers('15');
    setStores([{ name: '', city: '' }]);
    setPkg('pilot');
    setAdminName('');
    setAdminEmail('');
    setResult(null);
    setError('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validStores = stores.filter((s) => s.name.trim().length >= 2);
    if (validStores.length === 0) return setError('Bitte mindestens einen Store mit Namen angeben.');
    setLoading(true);
    try {
      const res = await api<OnboardResult>('/api/admin/onboard', {
        method: 'POST',
        body: JSON.stringify({
          tenant: {
            name: tenantName,
            contactEmail: contactEmail || undefined,
            maxUsers: Number(maxUsers) || 15,
          },
          stores: validStores.map((s) => ({ name: s.name, city: s.city || undefined })),
          toolKeys: PACKAGES[pkg]!.keys,
          admin: { name: adminName, email: adminEmail },
        }),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anlegen fehlgeschlagen.');
    }
    setLoading(false);
  };

  const copyCredentials = async () => {
    if (!result) return;
    const text = `KORE Zugang\nURL: ${result.loginUrl}\nE-Mail: ${result.admin.email}\nPasswort: ${result.admin.tempPassword ?? '(selbst gesetzt)'}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // ── Erfolgs-Ansicht ───────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="bg-kore-white border border-kore-border rounded-xl p-xl shadow-sm">
          <div className="flex items-center gap-md mb-lg">
            <div className="w-[44px] h-[44px] rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <Check className="text-green-600" size={24} />
            </div>
            <div>
              <h1 className="font-display text-h2 text-kore-ink">Kunde angelegt</h1>
              <p className="font-body text-small text-kore-mid">{result.tenant.name} ist startklar.</p>
            </div>
          </div>

          <div className="bg-kore-cream rounded-lg p-lg mb-lg">
            <p className="font-body text-caption uppercase tracking-widest text-kore-mid mb-sm">Zugangsdaten (Admin)</p>
            <dl className="flex flex-col gap-xs font-body text-body text-kore-ink">
              <div className="flex justify-between gap-md"><dt className="text-kore-mid">URL</dt><dd className="font-medium">{result.loginUrl}</dd></div>
              <div className="flex justify-between gap-md"><dt className="text-kore-mid">E-Mail</dt><dd className="font-medium">{result.admin.email}</dd></div>
              <div className="flex justify-between gap-md">
                <dt className="text-kore-mid">Passwort</dt>
                <dd className="font-medium font-mono">{result.admin.tempPassword ?? '(selbst gesetzt)'}</dd>
              </div>
            </dl>
            {result.admin.tempPassword && (
              <p className="font-body text-small text-kore-error mt-md">
                ⚠ Dieses Passwort wird nur <strong>einmal</strong> angezeigt. Jetzt sicher kopieren und dem Kunden
                übermitteln — er sollte es beim ersten Login ändern.
              </p>
            )}
            <button
              onClick={copyCredentials}
              className="mt-md flex items-center gap-sm px-md py-sm rounded-md border border-kore-border text-kore-ink font-body text-small hover:bg-kore-white transition-colors"
            >
              <Copy size={15} />
              {copied ? 'Kopiert!' : 'Zugangsdaten kopieren'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-md mb-lg">
            <div className="px-md py-sm bg-kore-surface rounded-md">
              <p className="font-body text-caption text-kore-mid">Stores</p>
              <p className="font-body text-body text-kore-ink font-medium">{result.stores.map((s) => s.name).join(', ')}</p>
            </div>
            <div className="px-md py-sm bg-kore-surface rounded-md">
              <p className="font-body text-caption text-kore-mid">Freigeschaltete Tools</p>
              <p className="font-body text-body text-kore-ink font-medium">{result.tools.join(', ')}</p>
            </div>
          </div>

          <div className="flex gap-md">
            <Button onClick={reset} className="flex-1">Noch einen Kunden anlegen</Button>
            <Link to={`/admin/tenants/${result.tenant.id}`} className="flex-1">
              <Button variant="secondary" className="w-full">Zum Kunden</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Formular ──────────────────────────────────────────────────
  return (
    <div className="max-w-[720px] mx-auto">
      <div className="flex items-center gap-md mb-xs">
        <UserPlus className="text-kore-brass" size={28} />
        <h1 className="font-display text-h2 text-kore-ink">Neuen Kunden anlegen</h1>
      </div>
      <p className="font-body text-small text-kore-mid mb-xl">
        Legt Mandant, Stores, Tool-Paket und den Admin-Zugang in einem Schritt an.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-xl">
        {/* Firma */}
        <section className="bg-kore-white border border-kore-border rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md"><Building2 size={18} className="text-kore-brass" /><h2 className="font-display text-h3 text-kore-ink">Firma</h2></div>
          <div className="flex flex-col gap-md">
            <Input label="Firmenname *" value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="z. B. Dior Retail GmbH" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <Input label="Kontakt-E-Mail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="kontakt@firma.de" />
              <Input label="Max. Nutzer" type="number" value={maxUsers} onChange={(e) => setMaxUsers(e.target.value)} />
            </div>
          </div>
        </section>

        {/* Stores */}
        <section className="bg-kore-white border border-kore-border rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md"><StoreIcon size={18} className="text-kore-brass" /><h2 className="font-display text-h3 text-kore-ink">Stores</h2></div>
          <div className="flex flex-col gap-md">
            {stores.map((s, i) => (
              <div key={i} className="flex items-end gap-sm">
                <div className="flex-1"><Input label={i === 0 ? 'Store-Name *' : ''} value={s.name} onChange={(e) => updateStore(i, 'name', e.target.value)} placeholder="z. B. Flagship München" /></div>
                <div className="flex-1"><Input label={i === 0 ? 'Stadt' : ''} value={s.city} onChange={(e) => updateStore(i, 'city', e.target.value)} placeholder="München" /></div>
                {stores.length > 1 && (
                  <button type="button" onClick={() => removeStore(i)} aria-label="Store entfernen" className="shrink-0 p-sm mb-[2px] text-kore-faint hover:text-kore-error rounded-md hover:bg-red-50 transition-colors">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addStore} className="flex items-center gap-sm self-start font-body text-small text-kore-brass hover:text-kore-ink transition-colors">
              <Plus size={16} /> Weiteren Store hinzufügen
            </button>
          </div>
        </section>

        {/* Tool-Paket */}
        <section className="bg-kore-white border border-kore-border rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md"><Check size={18} className="text-kore-brass" /><h2 className="font-display text-h3 text-kore-ink">Tool-Paket</h2></div>
          <div className="flex flex-col gap-sm">
            {Object.entries(PACKAGES).map(([key, p]) => (
              <label key={key} className={`flex items-start gap-md px-md py-sm rounded-lg border cursor-pointer transition-colors ${pkg === key ? 'border-kore-brass bg-kore-brass/5' : 'border-kore-border hover:border-kore-mid'}`}>
                <input type="radio" name="package" value={key} checked={pkg === key} onChange={() => setPkg(key)} className="mt-[3px] accent-kore-brass" />
                <span>
                  <span className="block font-body text-body text-kore-ink font-medium">{p.label}</span>
                  <span className="block font-body text-small text-kore-mid">{p.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Admin-Zugang */}
        <section className="bg-kore-white border border-kore-border rounded-xl p-lg">
          <div className="flex items-center gap-sm mb-md"><UserPlus size={18} className="text-kore-brass" /><h2 className="font-display text-h3 text-kore-ink">Admin-Zugang</h2></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <Input label="Name *" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Vor- und Nachname" required />
            <Input label="E-Mail *" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@firma.de" required />
          </div>
          <p className="font-body text-small text-kore-faint mt-sm">Ein sicheres Start-Passwort wird automatisch erzeugt und nach dem Anlegen angezeigt.</p>
        </section>

        {error && (
          <div className="px-md py-sm bg-red-50 rounded-md">
            <p className="font-body text-small text-kore-error">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={loading} loading={loading} className="self-start">
          {loading ? 'Wird angelegt…' : 'Kunde anlegen'}
        </Button>
      </form>
    </div>
  );
}
