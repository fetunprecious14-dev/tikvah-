import { ArrowRight, Wind } from 'lucide-react';
import { Shell, PageIntro, Button } from '@/components/shell';

export function About() {
  return (
    <Shell>
      <PageIntro eyebrow="Why Tikvah exists" title={<>A little more room for the <em className="text-primary">truth.</em></>}>
        Tikvah means hope. Not the loud, demanding kind — the quiet kind that makes space for the next breath. We built this
        place so no one has to carry a hard season entirely alone.
      </PageIntro>
      <section className="border-y border-border/80 bg-secondary/35">
        <div className="mx-auto grid max-w-[1220px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Our promise</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight">Privacy is not a feature. It is the foundation.</h2>
          </div>
          <div className="space-y-7 text-[16px] leading-7 text-muted-foreground">
            <p>
              Tikvah is a private correspondence between you and our team — never a public forum. There are no profiles,
              no followers, no comments, and no way for other users to see or contact you. Every conversation is strictly
              between you and the Tikvah team.
            </p>
            <p>
              When you write to us, a real person reads it and writes back with care. Your writing is encrypted in our
              database, and only you and authorized Tikvah team members can ever see it.
            </p>
            <p>We are not a replacement for professional or emergency care. We are a caring first step, and a steady presence after it.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1220px] px-5 py-20 sm:px-8 sm:py-28">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[.2em] text-primary">The Tikvah principles</p>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            ['No performance', 'There is no right way to feel, write, or ask for help here.'],
            ['Private by design', 'Only you and the Tikvah team can ever read what you share.'],
            ['Gentle, not vague', 'We offer warmth without pretending hard things are easy.'],
            ['Human when it matters', 'A real person reads and replies — never an automated response.'],
          ].map(([title, copy], i) => (
            <div key={title} className="rounded-2xl border border-border p-7 sm:p-9">
              <span className="font-mono text-xs text-accent">0{i + 1}</span>
              <h2 className="mt-8 font-serif text-2xl">{title}</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1220px] px-5 pb-24 text-center sm:px-8">
        <div className="mx-auto max-w-2xl rounded-[28px] bg-[#d7c9b2]/45 px-6 py-14 dark:bg-[#5a5447]/30 sm:px-12">
          <Wind className="mx-auto text-primary" size={25} strokeWidth={1.4} />
          <h2 className="mt-5 font-serif text-4xl">There is no rush.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Take what is useful. Leave what is not. Come back whenever you need a place to begin again.
          </p>
          <div className="mt-7">
            <Button href="/register" testId="button-about-register">Create your private account <ArrowRight size={15} /></Button>
          </div>
        </div>
      </section>
    </Shell>
  );
}
