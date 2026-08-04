import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Check, LockKeyhole } from 'lucide-react';
import { useCreateConversation, useResendVerificationEmail } from '@workspace/api-client-react';
import { Shell, Button } from '@/components/shell';
import { useAuth } from '@/lib/auth';

const quotes = [
  'You are allowed to take up space.',
  'You do not have to have the right words. You only have to begin.',
  'Small steps still move you forward.',
  'It is okay to not be okay right now.',
];

const prompts = ['What’s on your mind today?', 'How are you really doing?', 'What feels heavy right now?', 'What would help, even a little?'];

export function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [prompt] = useState(() => prompts[Math.floor(Math.random() * prompts.length)]);
  const [quote] = useState(() => quotes[Math.floor(Math.random() * quotes.length)]);
  const [text, setText] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const createConversation = useCreateConversation();
  const resend = useResendVerificationEmail();
  const [resendDone, setResendDone] = useState(false);

  const draftKey = user ? `tikvah-draft-${user.id}` : null;

  useEffect(() => {
    if (!draftKey) return;
    const saved = localStorage.getItem(draftKey);
    if (saved) {
      setText(saved);
      setDraftSaved(true);
    }
    // Only load the saved draft once, when we know who the user is.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const submit = () => {
    if (!text.trim() || createConversation.isPending) return;
    createConversation.mutate(
      { data: { body: text } },
      {
        onSuccess: conversation => {
          if (draftKey) localStorage.removeItem(draftKey);
          navigate(`/conversations/${conversation.id}`);
        },
      },
    );
  };

  const saveDraft = () => {
    if (draftKey) localStorage.setItem(draftKey, text);
    setDraftSaved(true);
  };

  return (
    <Shell>
      <section className="mx-auto max-w-[900px] px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        {user && !user.emailVerified && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/50 px-5 py-4 text-sm">
            <span className="text-muted-foreground">Please verify your email to make sure we can always reach you.</span>
            <button
              onClick={() => resend.mutate(undefined, { onSuccess: () => setResendDone(true) })}
              disabled={resend.isPending || resendDone}
              data-testid="button-resend-verification-dashboard"
              className="font-semibold text-primary underline underline-offset-4 disabled:opacity-60"
            >
              {resendDone ? 'Sent — check your email' : 'Resend verification email'}
            </button>
          </div>
        )}

        <p className="reveal text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}</p>
        <p className="reveal reveal-delay-1 mt-4 font-serif text-2xl italic leading-snug text-muted-foreground">"{quote}"</p>

        <div className="reveal reveal-delay-2 mt-10 rounded-[28px] border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-9">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-accent" /> New conversation
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole size={12} /> Only our team can read this</span>
          </div>
          <p className="mt-8 font-serif text-3xl leading-tight sm:text-4xl">{prompt}</p>
          <textarea
            value={text}
            onChange={e => {
              setText(e.target.value);
              setDraftSaved(false);
            }}
            data-testid="textarea-dashboard"
            placeholder="Write as much or as little as you want. There's no character limit, and no rush."
            className="mt-6 min-h-[220px] w-full resize-none rounded-2xl border border-border bg-background/60 p-4 text-[16px] leading-7 outline-none placeholder:text-muted-foreground/60 focus:border-primary sm:min-h-[260px]"
          />
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {draftSaved && text ? 'Draft saved on this device.' : text.length > 0 ? `${text.length} characters` : 'No pressure. A sentence is enough.'}
            </span>
            <div className="flex gap-2">
              <Button onClick={saveDraft} secondary disabled={!text.trim()} testId="button-save-draft">Save draft</Button>
              <Button onClick={submit} disabled={!text.trim() || createConversation.isPending} testId="button-submit-entry">
                {createConversation.isPending ? 'Sending…' : <>Send to the Tikvah team <ArrowRight size={15} /></>}
              </Button>
            </div>
          </div>
          {createConversation.isSuccess && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-primary"><Check size={13} /> Sent — we'll write back soon.</p>
          )}
        </div>

        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-4 text-sm">
          <Button href="/conversations" secondary testId="button-view-conversations">See your conversations</Button>
          <Button href="/resources" secondary testId="button-view-resources">Browse the resource library</Button>
        </div>
      </section>
    </Shell>
  );
}
