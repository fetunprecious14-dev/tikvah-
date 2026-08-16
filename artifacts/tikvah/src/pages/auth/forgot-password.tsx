import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'wouter';
import { useRequestPasswordReset } from '@workspace/api-client-react';
import { RequestPasswordResetBody, type RequestPasswordResetRequest } from '@workspace/api-zod';
import { Shell, Button } from '@/components/shell';

export function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const requestReset = useRequestPasswordReset();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetRequest>({ resolver: zodResolver(RequestPasswordResetBody) });

  const onSubmit = handleSubmit(data => {
    requestReset.mutate({ data }, { onSuccess: () => setSent(true) });
  });

  return (
    <Shell>
      <section className="mx-auto max-w-[520px] px-5 py-20 sm:px-8 sm:py-28">
        {sent ? (
          <>
            <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={22} /></span>
            <h1 className="mt-6 font-serif text-4xl leading-tight tracking-[-.03em]">Check your email.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              If an account exists for that email, we've sent a link to reset your password. It's valid for one hour.
            </p>
            <div className="mt-8"><Button href="/login" testId="button-forgot-back-to-login">Back to sign in</Button></div>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Forgot your password?</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight tracking-[-.03em] sm:text-5xl">No worries. Let's fix that.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Enter your email and we'll send you a link to choose a new password.</p>

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
              <Button type="submit" disabled={isSubmitting} testId="button-request-reset">
                Send reset link <ArrowRight size={15} />
              </Button>
            </form>

            <p className="mt-8 text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link href="/login" className="text-primary underline underline-offset-4" data-testid="link-back-to-login">Sign in</Link>
            </p>
          </>
        )}
      </section>
    </Shell>
  );
}
