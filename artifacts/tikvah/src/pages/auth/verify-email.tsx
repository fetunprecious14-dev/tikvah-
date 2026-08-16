import { useEffect, useRef, useState } from 'react';
import { useSearch } from 'wouter';
import { Check, X } from 'lucide-react';
import { useVerifyEmail, useResendVerificationEmail, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Shell, Button } from '@/components/shell';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';

export function VerifyEmail() {
  const search = useSearch();
  const token = new URLSearchParams(search).get('token');
  const { user } = useAuth();
  const verifyEmail = useVerifyEmail();
  const resend = useResendVerificationEmail();
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>(token ? 'pending' : 'idle');
  const [resendDone, setResendDone] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail.mutate(
      { data: { token } },
      {
        onSuccess: user => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
          setStatus('success');
        },
        onError: () => setStatus('error'),
      },
    );
  }, [token, verifyEmail]);

  return (
    <Shell>
      <section className="mx-auto max-w-[520px] px-5 py-24 text-center sm:px-8 sm:py-32">
        {status === 'pending' && <p className="text-sm text-muted-foreground">Confirming your email…</p>}

        {status === 'success' && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={22} /></span>
            <h1 className="mt-6 font-serif text-4xl leading-tight">Your email is confirmed.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Thank you for verifying — you're all set.</p>
            <div className="mt-8"><Button href="/dashboard" testId="button-verify-continue">Go to your dashboard</Button></div>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive text-destructive-foreground"><X size={22} /></span>
            <h1 className="mt-6 font-serif text-4xl leading-tight">This link isn't working.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              It may have expired. {user ? 'Request a new one below.' : 'Sign in and request a new one from your dashboard.'}
            </p>
            {user && (
              <div className="mt-8">
                <Button
                  onClick={() => resend.mutate(undefined, { onSuccess: () => setResendDone(true) })}
                  disabled={resend.isPending || resendDone}
                  testId="button-resend-verification"
                >
                  {resendDone ? 'New link sent — check your email' : 'Send a new verification link'}
                </Button>
              </div>
            )}
          </>
        )}

        {status === 'idle' && (
          <>
            <h1 className="font-serif text-4xl leading-tight">Verify your email</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Open the verification link we sent you, or request a new one from your dashboard.
            </p>
          </>
        )}
      </section>
    </Shell>
  );
}
