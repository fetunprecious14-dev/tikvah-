import { ArrowRight, ArrowUpRight, LockKeyhole } from 'lucide-react';
import { Shell, Button } from '@/components/shell';
import { useAuth } from '@/lib/auth';

export function Home() {
  const { user } = useAuth();

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1220px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 md:grid-cols-[1.02fr_.98fr] md:gap-20">
          <div className="relative z-10">
            <p className="reveal flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-primary">
              <span className="size-1.5 rounded-full bg-accent" /> A private place to be heard
            </p>
            <h1 className="reveal reveal-delay-1 mt-6 max-w-[640px] font-serif text-[clamp(52px,7.2vw,94px)] leading-[.91] tracking-[-.055em] text-balance">
              You can put it down <em className="text-primary">here.</em>
            </h1>
            <p className="reveal reveal-delay-2 mt-8 max-w-[450px] text-[17px] leading-7 text-muted-foreground">
              Tikvah is a private space to share what's on your mind and hear back from a real person on our team. Not a forum. Not a feed. Just you, and someone who's listening.
            </p>
            <div className="reveal reveal-delay-3 mt-9 flex flex-wrap gap-3">
              <Button href={user ? '/dashboard' : '/register'} testId="button-begin-writing">
                {user ? 'Go to your dashboard' : 'Get started'} <ArrowRight size={15} />
              </Button>
              <Button href="/about" secondary testId="button-learn-more">How Tikvah works</Button>
            </div>
            <div className="reveal reveal-delay-3 mt-7 flex items-center gap-2 text-xs text-muted-foreground">
              <LockKeyhole size={13} className="text-primary" /> Only you and the Tikvah team can ever read what you write.
            </div>
          </div>
          <div className="relative min-h-[390px] sm:min-h-[480px]">
            <div className="absolute left-[8%] top-[9%] h-[78%] w-[76%] rounded-[55%_45%_52%_48%/46%_44%_56%_54%] bg-[#d8d4bf] opacity-70 dark:bg-[#4a5344]" />
            <div className="absolute right-0 top-[18%] h-[60%] w-[42%] rounded-[46%_54%_64%_36%/53%_40%_60%_47%] bg-[#b4c0a4] opacity-80 dark:bg-[#536652]" />
            <div className="absolute bottom-[2%] left-[3%] h-[45%] w-[48%] rounded-[53%_47%_40%_60%/44%_66%_34%_56%] bg-[#c4ad8e] opacity-65 dark:bg-[#806c53]" />
            <div className="absolute left-[18%] top-[24%] size-[43%] rounded-full border border-primary/30" />
            <div className="absolute left-[31%] top-[36%] size-[31%] rounded-full border border-primary/40" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 480" fill="none" aria-hidden="true">
              <path d="M250 430C252 344 246 274 253 204C259 141 288 85 331 45" stroke="#385d48" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M250 344C214 308 177 304 136 317M252 291C296 249 338 250 380 262M255 233C220 194 207 161 209 127M264 171C300 140 320 111 329 76" stroke="#385d48" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M139 317C157 284 186 277 213 293C190 317 167 328 139 317ZM380 262C358 227 329 221 301 238C324 261 348 270 380 262ZM209 127C174 116 149 132 139 160C169 163 192 151 209 127ZM329 76C361 65 385 79 397 105C367 108 345 98 329 76Z" fill="#385d48" fillOpacity=".85" />
              <path d="M250 430C250 430 244 449 230 462M251 430C251 430 260 450 275 462" stroke="#385d48" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="absolute bottom-0 right-0 rounded-2xl border border-border bg-card/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:right-[3%] sm:p-5">
              <p className="text-[11px] uppercase tracking-[.14em] text-muted-foreground">A thought for today</p>
              <p className="mt-2 max-w-[180px] font-serif text-xl leading-tight">You are allowed to take up space.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-border/80 bg-secondary/45">
        <div className="mx-auto grid max-w-[1220px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 md:gap-12">
          {[
            ['01', 'Create a private account', 'Just your name, email, and a password — nothing public, no profile.'],
            ['02', 'Say what’s on your mind', 'Write as much or as little as you want, whenever you need to.'],
            ['03', 'Hear back from a real person', 'A member of the Tikvah team reads and replies with care.'],
          ].map(([num, title, copy]) => (
            <div key={num} className="flex gap-4">
              <span className="font-mono text-[11px] text-accent">{num}</span>
              <div>
                <h2 className="font-serif text-2xl">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[1220px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary-foreground/65">If today feels urgent</p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight tracking-[-.04em]">You deserve support that is human, immediate, and close.</h2>
          </div>
          <Button href="/crisis" secondary testId="button-crisis-home">See crisis support <ArrowUpRight size={15} /></Button>
        </div>
      </section>
    </Shell>
  );
}
