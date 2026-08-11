import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Shell, Button } from '@/components/shell';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { readAuthRedirectError } from '@/lib/authRedirectError';
import { PENDING_VERIFICATION_EMAIL_KEY } from './register';

export function VerifyEmail() {
  // Confirming the emailed link establishes a session automatically (see
  // detectSessionInUrl in lib/auth.tsx) — this page just watches for that
  // rather than handling a token of its own.
  const { user, isLoading } = useAuth();
  const [linkError] = useState(readAuthRedirectError);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const pendingEmail = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);

  const handleResend = async () => {
    if (!pendingEmail) return;
    setResendState('sending');
    const { error } = await supabase.auth.resend({ type: 'signup', email: pendingEmail });
    setResendState(error ? 'error' : 'sent');
  };

  const status: 'pending' | 'success' | 'error' = isLoading ? 'pending' : linkError ? 'error' : user ? 'success' : 'pending';

  return (
    <Shell>
      <section className="mx-auto max-w-[520px] px-5 py-24 text-center sm:px-8 sm:py-32">
        {status === 'pending' && !linkError && (
          <>
            <p className="text-sm text-muted-foreground">Confirming your email…</p>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              If you landed here without clicking a link from your inbox, open the confirmation email we sent when you registered.
            </p>
          </>
        )}

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
              {linkError ? linkError.replaceAll('+', ' ') : 'It may have expired.'}
            </p>
            {pendingEmail && (
              <div className="mt-8">
                <Button onClick={handleResend} disabled={resendState === 'sending' || resendState === 'sent'} testId="button-resend-verification">
                  {resendState === 'sent' ? 'New link sent — check your email' : 'Send a new verification link'}
                </Button>
                {resendState === 'error' && <p className="mt-3 text-xs text-destructive">Something went wrong. Please try again.</p>}
              </div>
            )}
          </>
        )}
      </section>
    </Shell>
  );
}
