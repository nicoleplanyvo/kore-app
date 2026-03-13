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
    <div className="bg-kore-white border border-kore-border p-xl">
      <h2 className="font-display text-h3 text-kore-ink mb-xs">{t.login.title}</h2>
      <p className="font-body text-small text-kore-mid mb-xl">{t.login.subtitle}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg">
        <Input
          label={t.login.email}
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label={t.login.password}
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />

        {serverError && (
          <p className="font-body text-small text-kore-error">{serverError}</p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: '8px' }}
        >
          {isSubmitting ? t.common.loading : t.login.submit}
        </Button>
      </form>
    </div>
  );
}
