import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auditRequestSchema, type AuditRequestInput } from '@shared/validators';
import { Send, CheckCircle } from 'lucide-react';
import t from '../locales/de.json';
import { usePageMeta } from '../hooks/usePageMeta';

export function AuditPage() {
  usePageMeta({
    title: 'Audit anfragen | Operative Painpoint-Analyse für Ihren Retail | KORE',
    description: 'Lassen Sie uns Ihre operativen Painpoints im Einzelhandel analysieren. Im KORE Audit identifizieren wir Schwachstellen und zeigen, wie individuelle Strategien und maßgeschneiderte Tools Ihren Umsatz steigern.',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuditRequestInput>({
    resolver: zodResolver(auditRequestSchema),
  });

  const API_URL = import.meta.env.VITE_API_URL ?? '';

  const onSubmit = async (data: AuditRequestInput) => {
    setSubmitError(null);
    try {
      const res = await fetch(`${API_URL}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Anfrage fehlgeschlagen');
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
      );
    }
  };

  return (
    <div className="pt-14">
      <section className="section-padding">
        <div className="container-narrow">
          <p className="label-default mb-4">{t.audit.heading}</p>
          <h1 className="font-display text-h1 text-kore-ink">
            {t.audit.heading}
          </h1>
          <p className="font-display text-lead italic text-kore-mid mt-4 mb-12">
            {t.audit.lead}
          </p>

          {submitted ? (
            <div className="card-accent">
              <div className="flex items-start gap-4">
                <CheckCircle size={24} className="text-kore-success shrink-0 mt-1" />
                <div>
                  <p className="font-display text-h3 text-kore-ink mb-2">Anfrage erhalten!</p>
                  <p className="font-body text-body font-normal text-kore-mid">
                    {t.audit.form.success}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-default block mb-2">{t.audit.form.name}</label>
                  <input
                    {...register('name')}
                    className="input-default"
                    placeholder="Max Mustermann"
                  />
                  {errors.name && (
                    <p className="font-body text-small text-kore-error mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="label-default block mb-2">{t.audit.form.company}</label>
                  <input
                    {...register('company')}
                    className="input-default"
                    placeholder="Unternehmen GmbH"
                  />
                  {errors.company && (
                    <p className="font-body text-small text-kore-error mt-1">{errors.company.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-default block mb-2">{t.audit.form.storeCount}</label>
                  <select {...register('storeCount')} className="input-default">
                    <option value="">Bitte wählen</option>
                    <option value="1">1 Store</option>
                    <option value="2-5">2 – 5 Stores</option>
                    <option value="6-20">6 – 20 Stores</option>
                    <option value="20+">20+ Stores</option>
                  </select>
                  {errors.storeCount && (
                    <p className="font-body text-small text-kore-error mt-1">{errors.storeCount.message}</p>
                  )}
                </div>

                <div>
                  <label className="label-default block mb-2">{t.audit.form.email}</label>
                  <input
                    {...register('email')}
                    type="email"
                    className="input-default"
                    placeholder="max@example.com"
                  />
                  {errors.email && (
                    <p className="font-body text-small text-kore-error mt-1">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="label-default block mb-2">{t.audit.form.challenge}</label>
                <textarea
                  {...register('challenge')}
                  className="input-default min-h-[150px] resize-y"
                  placeholder="Was ist Ihre größte operative Herausforderung im Store?"
                />
                {errors.challenge && (
                  <p className="font-body text-small text-kore-error mt-1">{errors.challenge.message}</p>
                )}
              </div>

              {submitError && (
                <div className="bg-kore-error/10 border border-kore-error/30 rounded-md p-4">
                  <p className="font-body text-small text-kore-error">{submitError}</p>
                </div>
              )}

              <button type="submit" disabled={isSubmitting} className="btn-brass self-start">
                <Send size={16} />
                {isSubmitting ? 'Wird gesendet...' : t.audit.form.submit}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Was Sie erwartet */}
      <section className="section-padding bg-kore-surface">
        <div className="container-default">
          <p className="label-default mb-8">Was Sie erwartet</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-default">
              <p className="font-display text-h2 text-kore-brass-lt mb-2">01</p>
              <h3 className="font-display text-h3 text-kore-ink mb-3">Erstgespräch</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Wir lernen Ihr Unternehmen kennen und verstehen Ihre Herausforderungen.
              </p>
            </div>
            <div className="card-default">
              <p className="font-display text-h2 text-kore-brass-lt mb-2">02</p>
              <h3 className="font-display text-h3 text-kore-ink mb-3">Store-Analyse</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Wir analysieren einen Ihrer Stores anhand unserer bewährten Audit-Methodik.
              </p>
            </div>
            <div className="card-default">
              <p className="font-display text-h2 text-kore-brass-lt mb-2">03</p>
              <h3 className="font-display text-h3 text-kore-ink mb-3">Ergebnisbericht</h3>
              <p className="font-body text-small font-normal text-kore-mid">
                Sie erhalten einen konkreten Bericht mit Quick Wins und strategischen Empfehlungen.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
