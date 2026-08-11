import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, Link } from 'wouter';
import { ArrowRight, X } from 'lucide-react';
import { Shell, Button } from '@/components/shell';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/auth';
import { readAuthRedirectError } from '@/lib/authRedirectError';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/authValidation';

export function ResetPassword() {
  const [, navigate] = useLocation();
  // No token/code handling of our own: clicking the emailed link redirects
  // here with Supabase already having established a real (recovery) session
  // via detectSessionInUrl — see lib/auth.tsx's onAuthStateChange listener,
  // which is what populates `session` below.
  const { session, isLoading } = useAuth();
  const [linkError] = useState(readAuthRedirectError);
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  if (isLoading) {
    return (
      <Shell>
        <section className="mx-auto max-w-[520px] px-5 py-24 text-center sm:px-8 sm:py-32">
          <p className="text-sm text-muted-foreground">Confirming your reset link…</p>
        </section>
      </Shell>
    );
  }

  if (linkError || !session) {
    return (
      <Shell>
        <section className="mx-auto max-w-[520px] px-5 py-24 text-center sm:px-8 sm:py-32">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive text-destructive-foreground"><X size={22} /></span>
          <h1 className="mt-6 font-serif text-4xl leading-tight">This link isn't working.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {linkError ? linkError.replaceAll('+', ' ') : 'It may be missing or expired.'} Request a new reset link.
          </p>
          <div className="mt-8"><Button href="/forgot-password" testId="button-reset-request-new">Request a new link</Button></div>
        </section>
      </Shell>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    setServerError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setServerError(error.message);
      return;
    }
    // The recovery session is already a real session, so no separate login
    // step is needed — same as before, straight to the dashboard.
    navigate('/dashboard');
  });

  return (
    <Shell>
      <section className="mx-auto max-w-[520px] px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Reset your password</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-.03em] sm:text-5xl">Choose a new password.</h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">New password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              data-testid="input-password"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {errors.password ? (
              <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>
            ) : (
              <p className="mt-1.5 text-xs text-muted-foreground">At least 10 characters.</p>
            )}
          </div>
          {serverError && (
            <p className="text-sm text-destructive" role="alert">
              {serverError}{' '}
              <Link href="/forgot-password" className="underline underline-offset-4" data-testid="link-reset-request-new">
                Request a new link
              </Link>
            </p>
          )}
          <Button type="submit" disabled={isSubmitting} testId="button-reset-password">
            Set new password <ArrowRight size={15} />
          </Button>
        </form>
      </section>
    </Shell>
  );
}
