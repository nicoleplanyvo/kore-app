import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { api } from '../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    } catch { /* bewusst nicht anzeigen — keine Account-Enumeration */ }
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="bg-kore-white border border-kore-border rounded-xl p-xl sm:p-2xl shadow-lg max-w-[420px] w-full animate-slide-up">
      <div className="text-center mb-xl">
        <h1 className="font-display text-h1 text-kore-ink tracking-wider">KORE</h1>
        <p className="font-body text-small text-kore-brass mt-xs">Retail Platform</p>
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-xs">Passwort vergessen</h2>

      {sent ? (
        <>
          <p className="font-body text-small text-kore-mid mb-xl">
            Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum Zurücksetzen
            gesendet. Bitte prüfen Sie Ihr Postfach (auch den Spam-Ordner).
          </p>
          <Link to="/login" className="font-body text-small text-kore-brass hover:text-kore-ink transition-colors">
            &larr; Zurück zur Anmeldung
          </Link>
        </>
      ) : (
        <>
          <p className="font-body text-small text-kore-mid mb-xl">
            Geben Sie Ihre E-Mail-Adresse ein — wir senden Ihnen einen Link zum Zurücksetzen.
          </p>
          <form onSubmit={onSubmit} className="flex flex-col gap-lg">
            <Input
              label="E-Mail"
              type="email"
              autoComplete="email"
              placeholder="name@unternehmen.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={loading} loading={loading} className="w-full mt-sm">
              Link senden
            </Button>
          </form>
          <div className="mt-lg text-center">
            <Link to="/login" className="font-body text-small text-kore-brass hover:text-kore-ink transition-colors">
              &larr; Zurück zur Anmeldung
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
