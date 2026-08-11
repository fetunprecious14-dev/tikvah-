import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Shell, Button } from '@/components/shell';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { loginSchema, type LoginFormValues } from '@/lib/authValidation';

export function Login() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  // Navigate once the auth context has actually observed the new user, rather
  // than immediately inside the submit handler — that would race the app
  // profile fetch and could bounce the auth-gated /dashboard route back here.
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const onSubmit = handleSubmit(async data => {
    setServerError('');
    const { error } = await supabase.auth.signInWithPassword(data);
    if (error) setServerError(error.message);
    // On success, onAuthStateChange (see lib/auth.tsx) picks up the new
    // session, which fetches the app profile and updates `user` above.
  });

  return (
    <Shell>
      <section className="mx-auto max-w-[520px] px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Welcome back</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-.03em] sm:text-5xl">Good to see you again.</h1>

        <form onSubmit={onSubmit} className="mt-10 space-y-5" noValidate>
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-semibold text-muted-foreground">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary underline underline-offset-4" data-testid="link-forgot-password">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              data-testid="input-password"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            {errors.password && <p className="mt-1.5 text-xs text-destructive">{errors.password.message}</p>}
          </div>
          {serverError && <p className="text-sm text-destructive" role="alert">{serverError}</p>}
          <Button type="submit" disabled={isSubmitting} testId="button-login">
            Sign in <ArrowRight size={15} />
          </Button>
        </form>

        <p className="mt-8 text-sm text-muted-foreground">
          New to Tikvah?{' '}
          <Link href="/register" className="text-primary underline underline-offset-4" data-testid="link-to-register">Create an account</Link>
        </p>
      </section>
    </Shell>
  );
}
