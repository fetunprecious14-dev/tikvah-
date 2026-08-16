import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useRegisterUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { RegisterUserBody, type RegisterRequest } from '@workspace/api-zod';
import { Shell, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

export function Register() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [serverError, setServerError] = useState('');
  const registerUser = useRegisterUser();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({ resolver: zodResolver(RegisterUserBody) });

  // Navigate once the auth context has actually observed the new user, rather
  // than immediately inside the mutation callback — that would race the
  // context update and could bounce the auth-gated /dashboard route back here.
  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const onSubmit = handleSubmit(data => {
    setServerError('');
    registerUser.mutate(
      { data },
      {
        onSuccess: user => queryClient.setQueryData(getGetCurrentUserQueryKey(), user),
        onError: error => setServerError(error instanceof Error ? error.message : 'Something went wrong. Please try again.'),
      },
    );
  });

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
