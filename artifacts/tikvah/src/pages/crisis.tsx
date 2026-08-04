import { useState } from 'react';
import { Check, Copy, ExternalLink, Heart, LockKeyhole, MessageCircleHeart, Phone } from 'lucide-react';
import { Link } from 'wouter';
import { Shell } from '@/components/shell';

export function Crisis() {
  const [copied, setCopied] = useState(false);
  const copyNumber = () => {
    navigator.clipboard?.writeText('988');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Shell>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-[1220px] px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary-foreground/65">Immediate support</p>
          <h1 className="mt-5 max-w-3xl font-serif text-[clamp(48px,7vw,80px)] leading-[.95] tracking-[-.05em]">You matter in this moment.</h1>
          <p className="mt-7 max-w-xl text-[17px] leading-7 text-primary-foreground/75">
            If you may hurt yourself or someone else, or cannot stay safe, please connect with a person who can be with you
            right now. You do not have to explain everything.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-[1220px] px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border-2 border-primary bg-card p-7">
            <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Phone size={19} /></span>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-primary">United States & Canada</p>
            <h2 className="mt-3 font-serif text-3xl">Call or text 988</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">The Suicide & Crisis Lifeline is free, confidential, and available 24/7.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href="tel:988" data-testid="link-call-988" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">
                Call 988 <Phone size={13} />
              </a>
              <button onClick={copyNumber} data-testid="button-copy-988" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold">
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy number'}
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-7">
            <span className="grid size-11 place-items-center rounded-full bg-secondary text-primary"><MessageCircleHeart size={19} /></span>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-primary">Elsewhere</p>
            <h2 className="mt-3 font-serif text-3xl">Find your local line</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Find a crisis service in your country through the International Association for Suicide Prevention.</p>
            <a
              href="https://www.iasp.info/resources/Crisis_Centres/"
              target="_blank"
              rel="noreferrer"
              data-testid="link-international-support"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary underline underline-offset-4"
            >
              Visit crisis centres <ExternalLink size={13} />
            </a>
          </div>
          <div className="rounded-2xl border border-border bg-card p-7">
            <span className="grid size-11 place-items-center rounded-full bg-secondary text-primary"><Heart size={19} /></span>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-primary">Right now</p>
            <h2 className="mt-3 font-serif text-3xl">Get closer to people</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Move toward another person, unlock your door, or ask someone you trust to stay with you. You can simply say: "I need company."
            </p>
          </div>
        </div>
        <div className="mx-auto mt-16 max-w-2xl border-t border-border pt-10">
          <h2 className="font-serif text-3xl">If it is not an emergency, but it is still hard</h2>
          <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
            You can explore a{' '}
            <Link href="/resources" className="text-primary underline underline-offset-4" data-testid="link-crisis-resources">
              small practice from our resource library
            </Link>
            , or write to us in your{' '}
            <Link href="/dashboard" className="text-primary underline underline-offset-4" data-testid="link-crisis-dashboard">
              private dashboard
            </Link>
            . A member of our team will read it and write back. Support does not have to start perfectly.
          </p>
          <div className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
            <LockKeyhole size={13} className="text-primary" /> Tikvah is not an emergency service. If you are in immediate danger, call your local emergency number.
          </div>
        </div>
      </section>
    </Shell>
  );
}
