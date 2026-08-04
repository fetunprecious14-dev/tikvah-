import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearch, useLocation, Link } from 'wouter';
import { ArrowRight, X } from 'lucide-react';
import { useResetPassword, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Shell, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';

const passwordSchema = z.object({
  password: z.string().min(10, 'At least 10 characters.').max(200),
});

type PasswordForm = z.infer<typeof passwordSchema>;

export function ResetPassword() {
  const search = useSearch();
  const token = new URLSearchParams(search).get('token');
  const [, navigate] = useLocation();
  const [serverError, setServerError] = useState('');
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  if (!token) {
    return (
      <Shell>
        <section className="mx-auto max-w-[520px] px-5 py-24 text-center sm:px-8 sm:py-32">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive text-destructive-foreground"><X size={22} /></span>
          <h1 className="mt-6 font-serif text-4xl leading-tight">This link isn't working.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">It may be missing its token. Request a new reset link.</p>
          <div className="mt-8"><Button href="/forgot-password" testId="button-reset-request-new">Request a new link</Button></div>
        </section>
      </Shell>
    );
  }

  const onSubmit = handleSubmit(data => {
    setServerError('');
    resetPassword.mutate(
      { data: { token, password: data.password } },
      {
        onSuccess: user => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
          navigate('/dashboard');
        },
        onError: error => setServerError(error instanceof Error ? error.message : 'This link may have expired. Request a new one.'),
      },
    );
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
