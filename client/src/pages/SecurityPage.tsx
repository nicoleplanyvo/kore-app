import { useEffect, useState } from 'react';
import { Fingerprint, Trash2, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  isPasskeySupported,
  registerPasskey,
  listPasskeys,
  deletePasskey,
  type PasskeyInfo,
} from '../lib/passkey';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export function SecurityPage() {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const supported = isPasskeySupported();

  const load = async () => {
    setLoading(true);
    try {
      setPasskeys(await listPasskeys());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Laden fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleAdd = async () => {
    setError('');
    setNotice('');
    setAdding(true);
    try {
      await registerPasskey();
      setNotice('Passkey erfolgreich hinzugefügt.');
      await load();
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        // Nutzer hat abgebrochen — kein Fehler
      } else {
        setError(err instanceof Error ? err.message : 'Passkey konnte nicht hinzugefügt werden.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError('');
    setNotice('');
    try {
      await deletePasskey(id);
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entfernen fehlgeschlagen.');
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-md py-xl">
      <div className="flex items-center gap-md mb-xs">
        <ShieldCheck className="text-kore-brass" size={28} />
        <h1 className="font-display text-h2 text-kore-ink">Sicherheit</h1>
      </div>
      <p className="font-body text-small text-kore-mid mb-xl">
        Mit einem Passkey melden Sie sich ohne Passwort an — per Face ID, Touch ID oder
        Geräte-PIN. Passkeys sind phishing-sicher und an Ihr Gerät gebunden.
      </p>

      <div className="bg-kore-white border border-kore-border rounded-xl p-xl shadow-sm">
        <div className="flex items-center justify-between gap-md mb-lg">
          <div className="flex items-center gap-sm">
            <Fingerprint className="text-kore-brass" size={20} />
            <h2 className="font-display text-h3 text-kore-ink">Passkeys</h2>
          </div>
          {supported && (
            <Button onClick={handleAdd} disabled={adding} loading={adding} className="shrink-0">
              <span className="flex items-center gap-sm">
                <Plus size={16} />
                {adding ? 'Wird erstellt…' : 'Passkey hinzufügen'}
              </span>
            </Button>
          )}
        </div>

        {!supported && (
          <div className="px-md py-sm bg-kore-cream rounded-md mb-lg">
            <p className="font-body text-small text-kore-mid">
              Dieser Browser unterstützt keine Passkeys.
            </p>
          </div>
        )}

        {error && (
          <div className="px-md py-sm bg-red-50 rounded-md mb-lg">
            <p className="font-body text-small text-kore-error">{error}</p>
          </div>
        )}
        {notice && (
          <div className="px-md py-sm bg-green-50 rounded-md mb-lg">
            <p className="font-body text-small text-green-700">{notice}</p>
          </div>
        )}

        {loading ? (
          <p className="font-body text-small text-kore-faint py-md">Lädt…</p>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-xl">
            <Fingerprint className="text-kore-border mx-auto mb-md" size={40} />
            <p className="font-body text-small text-kore-mid">
              Noch kein Passkey eingerichtet. Fügen Sie einen hinzu, um sich künftig ohne
              Passwort anzumelden.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-kore-border">
            {passkeys.map((pk) => (
              <li key={pk.id} className="flex items-center justify-between gap-md py-md">
                <div className="flex items-center gap-md min-w-0">
                  <div className="w-[40px] h-[40px] rounded-full bg-kore-cream flex items-center justify-center shrink-0">
                    <Fingerprint className="text-kore-brass" size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-body text-kore-ink truncate">
                      {pk.name || 'Passkey'}
                      {pk.backedUp && (
                        <span className="ml-sm font-body text-[0.65rem] text-kore-brass">· Cloud-Sync</span>
                      )}
                    </p>
                    <p className="font-body text-small text-kore-faint truncate">
                      Erstellt {formatDate(pk.createdAt)} · Zuletzt genutzt {formatDate(pk.lastUsedAt)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(pk.id)}
                  aria-label="Passkey entfernen"
                  className="shrink-0 p-sm text-kore-faint hover:text-kore-error transition-colors rounded-md hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
