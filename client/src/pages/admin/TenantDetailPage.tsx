import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantUpdateSchema, type TenantUpdateInput } from '@shared/validators';
import { Button, Input, Badge, Divider } from '@/components/ui';
import { ArrowLeft, Store, ExternalLink } from 'lucide-react';
import { useTenant, useUpdateTenant, useDeleteTenant } from '../../hooks/useTenants';
import t from '../../locales/de.json';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'brass'> = {
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'error',
  TRIALING: 'brass',
};

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tenant, isLoading } = useTenant(id);
  const updateTenant = useUpdateTenant(id!);
  const deleteTenant = useDeleteTenant();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TenantUpdateInput>({
    resolver: zodResolver(tenantUpdateSchema),
    values: tenant
      ? {
          name: tenant.name,
          slug: tenant.slug,
          contactName: tenant.contactName ?? '',
          contactEmail: tenant.contactEmail ?? '',
          contactPhone: tenant.contactPhone ?? '',
          maxUsers: tenant.maxUsers,
        }
      : undefined,
  });

  const onSubmit = async (data: TenantUpdateInput) => {
    setServerError('');
    try {
      await updateTenant.mutateAsync(data);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.common.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.tenants.deleteConfirm)) return;
    try {
      await deleteTenant.mutateAsync(id!);
      navigate('/admin/tenants');
    } catch {
      // Error handled by React Query
    }
  };

  if (isLoading) {
    return <p className="text-kore-mid font-body">{t.common.loading}</p>;
  }

  if (!tenant) {
    return <p className="text-kore-error font-body">Tenant nicht gefunden.</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/tenants')}
        className="flex items-center gap-sm text-kore-mid hover:text-kore-ink font-body text-small mb-lg transition-colors"
      >
        <ArrowLeft size={16} />
        {t.common.back}
      </button>

      <div className="flex flex-wrap items-center gap-md sm:gap-lg mb-lg sm:mb-xl">
        <h1 className="font-display text-h2 sm:text-h1 text-kore-ink">{tenant.name}</h1>
        <Badge variant={statusVariant[tenant.status]}>
          {t.status[tenant.status as keyof typeof t.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        {/* Tenant Form */}
        <div className="lg:col-span-2 bg-kore-white border border-kore-border p-xl">
          <h2 className="font-display text-h3 text-kore-ink mb-lg">{t.tenants.editTitle}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-lg">
            <Input label={t.tenants.name} {...register('name')} error={errors.name?.message} />
            <Input label={t.tenants.slug} {...register('slug')} error={errors.slug?.message} />
            <Input label={t.tenants.contactName} {...register('contactName')} error={errors.contactName?.message} />
            <Input label={t.tenants.contactEmail} type="email" {...register('contactEmail')} error={errors.contactEmail?.message} />
            <Input label={t.tenants.contactPhone} type="tel" {...register('contactPhone')} error={errors.contactPhone?.message} />
            <Input label={t.tenants.maxUsers} type="number" {...register('maxUsers', { valueAsNumber: true })} error={errors.maxUsers?.message} />

            {serverError && <p className="font-body text-small text-kore-error">{serverError}</p>}

            <div className="flex gap-md mt-md">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? t.common.loading : t.tenants.save}
              </Button>
            </div>
          </form>

          <Divider style={{ margin: '32px 0' }} />

          <button onClick={handleDelete} className="font-body text-small text-kore-error hover:underline">
            {t.tenants.delete}
          </button>
        </div>

        {/* Stores */}
        <div className="bg-kore-white border border-kore-border p-xl h-fit">
          <div className="flex items-center justify-between mb-lg">
            <h2 className="font-display text-h3 text-kore-ink">Stores</h2>
            <span className="font-body text-caption text-kore-mid">
              {tenant.stores?.length ?? tenant._count?.stores ?? 0} Stores
            </span>
          </div>

          <div className="flex flex-col gap-md">
            {tenant.stores && tenant.stores.length > 0 ? (
              tenant.stores.map((store) => (
                <Link
                  key={store.id}
                  to={`/admin/stores/${store.id}`}
                  className="flex items-center justify-between p-md border border-kore-border hover:border-kore-brass transition-colors group"
                >
                  <div className="flex items-center gap-md min-w-0">
                    <Store size={16} className="text-kore-mid flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-body text-body text-kore-ink font-normal truncate">{store.name}</p>
                      <p className="font-body text-small text-kore-mid">{store.city || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-sm flex-shrink-0">
                    <Badge variant="brass">{store._count?.tools ?? 0} Tools</Badge>
                    <ExternalLink size={14} className="text-kore-faint group-hover:text-kore-brass transition-colors" />
                  </div>
                </Link>
              ))
            ) : (
              <p className="font-body text-small text-kore-mid">Noch keine Stores vorhanden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
