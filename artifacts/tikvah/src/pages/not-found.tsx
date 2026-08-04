import { Compass } from 'lucide-react';
import { Shell, Button } from '@/components/shell';

export default function NotFound() {
  return (
    <Shell>
      <section className="mx-auto max-w-[560px] px-5 py-28 text-center sm:px-8">
        <Compass className="mx-auto text-primary" size={26} strokeWidth={1.4} />
        <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">This page wandered off.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">We couldn't find what you were looking for. Let's get you back somewhere familiar.</p>
        <div className="mt-8"><Button href="/" testId="button-not-found-home">Return home</Button></div>
      </section>
    </Shell>
  );
}
