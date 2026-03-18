import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@shared/validators';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '../stores/authStore';
import { api, setAccessToken } from '../lib/api';
import type { AuthUser } from '@shared/types';
import t from '../locales/de.json';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      setAccessToken(null);
      const res = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAuth(res.user, res.accessToken);
      navigate('/app', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.login.error);
    }
  };

  return (
    <div className="bg-kore-white border border-kore-border rounded-xl p-xl sm:p-2xl shadow-lg max-w-[420px] w-full animate-slide-up">
      {/* Logo */}
      <div className="text-center mb-xl">
        <h1 className="font-display text-h1 text-kore-ink tracking-wider">KORE</h1>
        <p className="font-body text-small text-kore-brass mt-xs">Retail Platform</p>
      </div>

      <h2 className="font-display text-h3 text-kore-ink mb-xs">{t.login.title}</h2>
      <p className="font-body text-small text-kore-mid mb-xl">{t.login.subtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg">
        <Input
          label={t.login.email}
          type="email"
          autoComplete="email"
          placeholder="name@unternehmen.de"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label={t.login.password}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        {serverError && (
          <div className="flex items-center gap-sm px-md py-sm bg-red-50 rounded-md">
            <p className="font-body text-small text-kore-error">{serverError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="w-full mt-sm"
        >
          {isSubmitting ? t.common.loading : t.login.submit}
        </Button>
      </form>
    </div>
  );
}
