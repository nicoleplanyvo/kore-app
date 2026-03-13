import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantCreateSchema, type TenantCreateInput } from '@shared/validators';
import { Button, Input } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import { useCreateTenant } from '../../hooks/useTenants';
import t from '../../locales/de.json';

export function TenantCreatePage() {
  const navigate = useNavigate();
  const createTenant = useCreateTenant();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<TenantCreateInput>({
    resolver: zodResolver(tenantCreateSchema),
    defaultValues: {
      maxUsers: 15,
    },
  });

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register('name').onChange(e);
    const slug = e.target.value
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setValue('slug', slug);
  };

  const onSubmit = async (data: TenantCreateInput) => {
    setServerError('');
    try {
      const tenant = await createTenant.mutateAsync(data);
      navigate(`/admin/tenants/${tenant.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.common.error);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/admin/tenants')}
        className="flex items-center gap-sm text-kore-mid hover:text-kore-ink font-body text-small mb-lg transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <h1 className="font-display text-h1 text-kore-ink mb-xl">{t.tenants.createTitle}</h1>

      <div className="bg-kore-white border border-kore-border p-xl max-w-[640px]">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg">
          <Input
            label={t.tenants.name}
            {...register('name')}
            onChange={handleNameChange}
            error={errors.name?.message}
          />
          <Input
            label={t.tenants.slug}
            {...register('slug')}
            error={errors.slug?.message}
          />
          <Input
            label={t.tenants.contactName}
            {...register('contactName')}
            error={errors.contactName?.message}
          />
          <Input
            label={t.tenants.contactEmail}
            type="email"
            {...register('contactEmail')}
            error={errors.contactEmail?.message}
          />
          <Input
            label={t.tenants.contactPhone}
            type="tel"
            {...register('contactPhone')}
            error={errors.contactPhone?.message}
          />
          <Input
            label={t.tenants.maxUsers}
            type="number"
            {...register('maxUsers', { valueAsNumber: true })}
            error={errors.maxUsers?.message}
          />

          {serverError && (
            <p className="font-body text-small text-kore-error">{serverError}</p>
          )}

          <div className="flex gap-md mt-md">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t.common.loading : t.tenants.save}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/tenants')}
            >
              {t.tenants.cancel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
