import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/ui';
import { api } from '../lib/api';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Mindestens 8 Zeichen.');
    if (password !== confirm) return setError('Die Passwörter stimmen nicht überein.');
    setLoading(true);
    try {
      await api('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Zurücksetzen fehlgeschlagen.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-kore-white border border-kore-border rounded-xl p-xl sm:p-2xl shadow-lg max-w-[420px] w-full animate-slide-up">
      <div className="text-center mb-xl">
        <h1 className="font-display text-h1 text-kore-ink tracking-wider">KORE</h1>
        <p className="font-body text-small text-kore-brass mt-xs">Retail Platform</p>
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-xs">Neues Passwort</h2>

      {!token ? (
        <>
          <p className="font-body text-small text-kore-mid mb-xl">
            Dieser Link ist unvollständig. Bitte fordern Sie den Reset-Link erneut an.
          </p>
          <Link to="/forgot-password" className="font-body text-small text-kore-brass hover:text-kore-ink transition-colors">
            Neuen Link anfordern
          </Link>
        </>
      ) : done ? (
        <p className="font-body text-small text-kore-mid">
          Passwort geändert. Sie werden zur Anmeldung weitergeleitet…
        </p>
      ) : (
        <>
          <p className="font-body text-small text-kore-mid mb-xl">Vergeben Sie ein neues Passwort (mind. 8 Zeichen).</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-lg">
            <Input
              label="Neues Passwort"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Passwort bestätigen"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {error && (
              <div className="flex items-center gap-sm px-md py-sm bg-red-50 rounded-md">
                <p className="font-body text-small text-kore-error">{error}</p>
              </div>
            )}
            <Button type="submit" disabled={loading} loading={loading} className="w-full mt-sm">
              Passwort speichern
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
