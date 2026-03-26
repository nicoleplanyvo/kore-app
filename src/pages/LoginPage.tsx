import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '../lib/validators';
import { useLogin } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import t from '../locales/de.json';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError('');
    try {
      await login.mutateAsync(data);
      navigate('/', { replace: true });
    } catch {
      setError(t.login.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
      <div className="text-center mb-lg">
        <h2 className="font-display text-h2 text-kore-ink">{t.login.title}</h2>
        <p className="text-small text-kore-mid mt-xs">{t.login.subtitle}</p>
      </div>

      {error && (
        <div className="bg-kore-error/10 text-kore-error text-small px-md py-md-sm">
          {error}
        </div>
      )}

      <Input
        id="email"
        type="email"
        label={t.login.email}
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        id="password"
        type="password"
        label={t.login.password}
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        disabled={login.isPending}
        className="w-full"
        size="lg"
      >
        {login.isPending ? t.common.loading : t.login.submit}
      </Button>
    </form>
  );
}
