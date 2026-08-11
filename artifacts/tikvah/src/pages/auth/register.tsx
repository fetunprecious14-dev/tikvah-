import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { registerProfile, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Shell, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { registerSchema, type RegisterFormValues } from '@/lib/authValidation';

// Read by verify-email.tsx's "resend confirmation" action — Supabase's
// signUp doesn't return an email address anywhere the confirmation-pending
// page could otherwise get it from, since there's no session yet.
export const PENDING_VERIFICATION_EMAIL_KEY = 'tikvah:pending-verification-email';

export function Register() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [serverError, setServerError] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  // Navigate once the auth context has actually observed the new user, rather
  // than immediately inside the submit handler — that would race the app
  // profile fetch and could bounce the auth-gated /dashboard route back here.
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setServerError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // display-only metadata; the profile row is the source of truth for role/authorization
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    if (data.session) {
      // No email confirmation required (or it's off for this project) —
      // we already have a session, so create the profile now rather than
      // waiting for it to self-heal on the next authenticated request.
      try {
        const profile = await registerProfile({ name });
        queryClient.setQueryData(getGetCurrentUserQueryKey(), profile);
      } catch (profileError) {
        // Non-fatal: requireAuth on the API creates a profile lazily from
        // signup metadata the first time an authenticated request succeeds.
        setServerError(profileError instanceof Error ? profileError.message : 'Something went wrong finishing setup. Try signing in.');
      }
    } else {
      sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
      setPendingConfirmation(true);
    }
  });

  if (pendingConfirmation) {
    return (
      <Shell>
        <section className="mx-auto max-w-[520px] px-5 py-24 text-center sm:px-8 sm:py-32">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={22} /></span>
          <h1 className="mt-6 font-serif text-4xl leading-tight">Check your email.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            We've sent a confirmation link to finish setting up your account. Once you confirm, you can sign in.
          </p>
          <div className="mt-8"><Button href="/login" testId="button-register-to-login">Go to sign in</Button></div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mx-auto max-w-[520px] px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Create your account</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-.03em] sm:text-5xl">A quiet place to begin.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Just your name, email, and a password. No public profile, no phone number.
        </p>

        <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
          <div>
            <label htmlFor="name" className="text-xs font-semibold text-muted-foreground">Your name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register('name')}
              data-testid="input-name"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {errors.name && <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              data-testid="input-email"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {errors.email && <p className="mt-1.5 text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">Password</label>
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
          {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting} testId="button-register">
            Create account <ArrowRight size={15} />
          </Button>
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline underline-offset-4" data-testid="link-to-login">Sign in</Link>
        </p>
      </section>
    </Shell>
  );
}
