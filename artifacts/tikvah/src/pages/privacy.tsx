import { ShieldCheck } from 'lucide-react';
import { Shell, PageIntro } from '@/components/shell';

const sections: Array<[string, string]> = [
  [
    'What we collect',
    'Your name, email address, and password to create an account, plus whatever you choose to write to us. We never ask for a phone number, a public username, or a profile picture.',
  ],
  [
    'Who can read what you write',
    'Only you and authorized members of the Tikvah team. There are no public profiles, no other users who can see your writing, and no way for anyone else on Tikvah to find or contact you.',
  ],
  [
    'How your data is protected',
    'Your password is hashed, never stored in plain text. Your conversations are encrypted at rest in our database and only ever transmitted over secure connections. Sessions are stored as httpOnly cookies that JavaScript cannot read.',
  ],
  [
    'When we act without waiting for you to ask',
    'If something you write suggests you may be in danger of harming yourself or someone else, we flag it for urgent review by our team so a person can look at it as quickly as possible — alongside showing you crisis resources immediately.',
  ],
  [
    'What we do not do',
    'We do not sell your personal information, build advertising profiles from your writing, or share your conversations with anyone outside the Tikvah team.',
  ],
  [
    'Questions',
    'If you have a concern about privacy or safety, reach out at hello@tikvah.space. We will answer as plainly as we can.',
  ],
];

export function Privacy() {
  return (
    <Shell>
      <PageIntro eyebrow="Your privacy, plainly" title={<>You should not have to trade privacy for a place to be heard.</>}>
        Tikvah is built to ask for as little as possible, and to protect closely what you do share. Here is what that means in
        everyday language.
      </PageIntro>
      <section className="mx-auto max-w-[850px] px-5 pb-24 sm:px-8">
        <div className="space-y-10">
          {sections.map(([title, copy], i) => (
            <article key={title} className="border-t border-border pt-7">
              <div className="flex gap-6">
                <span className="font-mono text-xs text-accent">0{i + 1}</span>
                <div>
                  <h2 className="font-serif text-3xl">{title}</h2>
                  <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{copy}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-14 rounded-2xl bg-secondary/60 p-6 text-sm leading-6 text-muted-foreground">
          <ShieldCheck className="mb-3 text-primary" size={19} /> This page describes how Tikvah is built, not a substitute for
          a jurisdiction-specific legal privacy policy.
        </div>
      </section>
    </Shell>
  );
}
