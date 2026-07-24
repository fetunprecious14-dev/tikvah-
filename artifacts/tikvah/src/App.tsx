import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, CircleHelp,
  Clock3, Copy, ExternalLink, Heart, Leaf, Menu, Moon, Phone, Search, ShieldCheck,
  Sun, X, Wind, LockKeyhole, SlidersHorizontal, MapPin, Languages,
  MessageCircleHeart
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type IconType = typeof Heart;

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/journal', label: 'Journal' },
  { href: '/resources', label: 'Resources' },
  { href: '/therapists', label: 'Find support' },
];

function Logo() {
  return <Link href="/" className="flex items-center gap-2.5 text-[hsl(var(--foreground))]" data-testid="link-logo">
    <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
      <Leaf size={16} strokeWidth={1.6} />
    </span>
    <span className="font-serif text-[23px] tracking-[-.03em]">tikvah</span>
  </Link>;
}

function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('tikvah-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tikvah-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
    <div className="mx-auto flex h-[74px] max-w-[1220px] items-center justify-between px-5 sm:px-8">
      <Logo />
      <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
        {navItems.map(item => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
          className={`text-[13px] transition-colors hover:text-primary ${location === item.href ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{item.label}</Link>)}
      </nav>
      <div className="flex items-center gap-2">
        <button onClick={() => setDark(!dark)} aria-label={dark ? 'Use light mode' : 'Use dark mode'} data-testid="button-theme"
          className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <Link href="/crisis" data-testid="link-header-crisis" className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition hover:border-primary hover:text-primary sm:flex">
          Need help now <ArrowUpRight size={14} />
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu"
          className="grid size-9 place-items-center rounded-full text-foreground md:hidden">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
      </div>
    </div>
    {mobileOpen && <nav className="border-t border-border bg-background px-5 py-4 md:hidden" aria-label="Mobile navigation">
      <div className="flex flex-col gap-1">
        {navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`}
          className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">{item.label}</Link>)}
        <Link href="/about" onClick={() => setMobileOpen(false)} data-testid="link-mobile-about" className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary">About Tikvah</Link>
        <Link href="/crisis" onClick={() => setMobileOpen(false)} data-testid="link-mobile-crisis" className="mt-2 rounded-lg bg-primary px-3 py-3 text-sm text-primary-foreground">I need help now</Link>
      </div>
    </nav>}
  </header>;
}

function Footer() {
  return <footer className="border-t border-border/80">
    <div className="mx-auto grid max-w-[1220px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
      <div>
        <Logo />
        <p className="mt-5 max-w-[260px] text-sm leading-6 text-muted-foreground">A quiet place to put down what you are carrying.</p>
        <p className="mt-8 text-xs text-muted-foreground">Made with care for tender days.</p>
      </div>
      <div><p className="mb-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Explore</p><div className="flex flex-col gap-3 text-sm">
        <Link href="/journal" data-testid="link-footer-journal" className="hover:text-primary">Private journal</Link><Link href="/resources" data-testid="link-footer-resources" className="hover:text-primary">Resources</Link><Link href="/therapists" data-testid="link-footer-therapists" className="hover:text-primary">Find a therapist</Link>
      </div></div>
      <div><p className="mb-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Learn</p><div className="flex flex-col gap-3 text-sm">
        <Link href="/about" data-testid="link-footer-about" className="hover:text-primary">About Tikvah</Link><Link href="/privacy" data-testid="link-footer-privacy" className="hover:text-primary">Privacy promise</Link><Link href="/crisis" data-testid="link-footer-crisis" className="hover:text-primary">Crisis support</Link>
      </div></div>
      <div><p className="mb-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">A gentle reminder</p><p className="text-sm leading-6 text-muted-foreground">You do not have to have the right words. You only have to begin.</p></div>
    </div>
    <div className="mx-auto flex max-w-[1220px] flex-col gap-2 border-t border-border/70 px-5 py-5 text-xs text-muted-foreground sm:px-8 md:flex-row md:justify-between"><span>© 2025 Tikvah</span><span>Your words belong to you.</span></div>
  </footer>;
}

function Shell({ children }: { children: ReactNode }) {
  return <div className="site-shell grain"><Header /><main>{children}</main><Footer /></div>;
}

function Button({ children, onClick, href, secondary = false, testId = 'button-action', type = 'button' }: { children: ReactNode; onClick?: () => void; href?: string; secondary?: boolean; testId?: string; type?: 'button' | 'submit' }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition duration-300 ${secondary ? 'border border-border bg-background text-foreground hover:border-primary hover:text-primary' : 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(44,80,60,.18)]'}`;
  if (href) return <Link href={href} className={cls} data-testid={testId}>{children}</Link>;
  return <button type={type} onClick={onClick} className={cls} data-testid={testId}>{children}</button>;
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: React.ReactNode; children: React.ReactNode }) {
  return <section className="mx-auto max-w-[1220px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24 md:pb-20">
    <p className="reveal text-[11px] font-semibold uppercase tracking-[.2em] text-primary">{eyebrow}</p>
    <h1 className="reveal reveal-delay-1 mt-5 max-w-3xl font-serif text-[clamp(42px,7vw,76px)] leading-[.98] tracking-[-.045em] text-balance">{title}</h1>
    <div className="reveal reveal-delay-2 mt-7 max-w-xl text-[16px] leading-7 text-muted-foreground">{children}</div>
  </section>;
}

function Home() {
  const [prompt, setPrompt] = useState('What feels heavy today?');
  const prompts = ['What feels heavy today?', 'What do you wish someone knew?', 'What are you making room for?', 'What would kindness sound like?'];
  return <Shell>
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-[1220px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 md:grid-cols-[1.02fr_.98fr] md:gap-20">
        <div className="relative z-10">
          <p className="reveal flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.2em] text-primary"><span className="size-1.5 rounded-full bg-accent" /> A private place to be honest</p>
          <h1 className="reveal reveal-delay-1 mt-6 max-w-[640px] font-serif text-[clamp(52px,7.2vw,94px)] leading-[.91] tracking-[-.055em] text-balance">You can put it down <em className="text-primary">here.</em></h1>
          <p className="reveal reveal-delay-2 mt-8 max-w-[450px] text-[17px] leading-7 text-muted-foreground">Tikvah is a quiet, anonymous space for the things you are not ready to say out loud. No performance. No judgment. Just room to breathe.</p>
          <div className="reveal reveal-delay-3 mt-9 flex flex-wrap gap-3"><Button href="/journal" testId="button-begin-writing">Begin writing <ArrowRight size={15} /></Button><Button href="/about" secondary testId="button-learn-more">How Tikvah works</Button></div>
          <div className="reveal reveal-delay-3 mt-7 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole size={13} className="text-primary" /> Nothing is saved unless you choose to save it.</div>
        </div>
        <div className="relative min-h-[390px] sm:min-h-[480px]">
          <div className="absolute left-[8%] top-[9%] h-[78%] w-[76%] rounded-[55%_45%_52%_48%/46%_44%_56%_54%] bg-[#d8d4bf] opacity-70 dark:bg-[#4a5344]" />
          <div className="absolute right-0 top-[18%] h-[60%] w-[42%] rounded-[46%_54%_64%_36%/53%_40%_60%_47%] bg-[#b4c0a4] opacity-80 dark:bg-[#536652]" />
          <div className="absolute bottom-[2%] left-[3%] h-[45%] w-[48%] rounded-[53%_47%_40%_60%/44%_66%_34%_56%] bg-[#c4ad8e] opacity-65 dark:bg-[#806c53]" />
          <div className="absolute left-[18%] top-[24%] size-[43%] rounded-full border border-primary/30" />
          <div className="absolute left-[31%] top-[36%] size-[31%] rounded-full border border-primary/40" />
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 480" fill="none" aria-hidden="true">
            <path d="M250 430C252 344 246 274 253 204C259 141 288 85 331 45" stroke="#385d48" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M250 344C214 308 177 304 136 317M252 291C296 249 338 250 380 262M255 233C220 194 207 161 209 127M264 171C300 140 320 111 329 76" stroke="#385d48" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M139 317C157 284 186 277 213 293C190 317 167 328 139 317ZM380 262C358 227 329 221 301 238C324 261 348 270 380 262ZM209 127C174 116 149 132 139 160C169 163 192 151 209 127ZM329 76C361 65 385 79 397 105C367 108 345 98 329 76Z" fill="#385d48" fillOpacity=".85"/>
            <path d="M250 430C250 430 244 449 230 462M251 430C251 430 260 450 275 462" stroke="#385d48" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <div className="absolute bottom-0 right-0 rounded-2xl border border-border bg-card/90 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:right-[3%] sm:p-5">
            <p className="text-[11px] uppercase tracking-[.14em] text-muted-foreground">A thought for today</p><p className="mt-2 max-w-[180px] font-serif text-xl leading-tight">You are allowed to take up space.</p>
          </div>
        </div>
      </div>
    </section>
    <section className="border-y border-border/80 bg-secondary/45"><div className="mx-auto grid max-w-[1220px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 md:gap-12">
      {[['01', 'Arrive as you are', 'No account, identity, or polished version of yourself required.'], ['02', 'Let it out', 'Write privately, browse words from others, or simply sit with a feeling.'], ['03', 'Find your next step', 'When you are ready, gentle tools and human support are here.']].map(([num, title, copy]) => <div key={num} className="flex gap-4"><span className="font-mono text-[11px] text-accent">{num}</span><div><h2 className="font-serif text-2xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p></div></div>)}
    </div></section>
    <section className="mx-auto max-w-[1220px] px-5 py-20 sm:px-8 sm:py-28"><div className="grid items-start gap-12 md:grid-cols-[.7fr_1.3fr]"><div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">A small beginning</p><h2 className="mt-4 max-w-sm font-serif text-4xl leading-tight tracking-[-.04em]">Start with one honest sentence.</h2></div><div className="rounded-[28px] border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-9"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 rounded-full bg-accent" /> Anonymous journal</span><span className="text-xs text-muted-foreground">Private by default</span></div><p className="mt-10 font-serif text-3xl leading-tight sm:text-4xl">{prompt}</p><div className="mt-8 flex flex-wrap gap-2">{prompts.map(p => <button key={p} onClick={() => setPrompt(p)} data-testid={`button-prompt-${prompts.indexOf(p)}`} className={`rounded-full border px-3 py-2 text-xs transition ${prompt === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:border-primary'}`}>{p}</button>)}</div><Button href="/journal" testId="button-open-journal">Open the journal <ArrowRight size={15} /></Button></div></div></section>
    <section className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-[1220px] flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 md:flex-row md:items-center"><div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary-foreground/65">If today feels urgent</p><h2 className="mt-3 max-w-xl font-serif text-4xl leading-tight tracking-[-.04em]">You deserve support that is human, immediate, and close.</h2></div><Button href="/crisis" secondary testId="button-crisis-home">See crisis support <ArrowUpRight size={15} /></Button></div></section>
  </Shell>;
}

function About() {
  return <Shell><PageIntro eyebrow="Why Tikvah exists" title={<>A little more room for the <em className="text-primary">truth.</em></>}>Tikvah means hope. Not the loud, demanding kind — the quiet kind that makes space for the next breath. We made this place for the in-between moments.</PageIntro>
    <section className="border-y border-border/80 bg-secondary/35"><div className="mx-auto grid max-w-[1220px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[.8fr_1.2fr] md:py-24"><div><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">Our promise</p><h2 className="mt-4 font-serif text-4xl leading-tight">Safety is not a feature. It is the foundation.</h2></div><div className="space-y-7 text-[16px] leading-7 text-muted-foreground"><p>Tikvah was shaped by a simple belief: expression can be a form of care. Sometimes the first step toward feeling better is not advice — it is having somewhere to set the feeling down.</p><p>Everything here is designed to ask less of you. You can remain anonymous. You can leave at any time. You can read quietly without sharing a single thing.</p><p>We are not a replacement for professional care. We are the soft place before the next step.</p></div></div></section>
    <section className="mx-auto max-w-[1220px] px-5 py-20 sm:px-8 sm:py-28"><p className="text-center text-[11px] font-semibold uppercase tracking-[.2em] text-primary">The Tikvah principles</p><div className="mt-12 grid gap-5 md:grid-cols-2">{[['No performance', 'There is no right way to feel, write, heal, or arrive here.'], ['Privacy by default', 'Your journal lives on your device. We do not ask for your name or email.'], ['Gentle, not vague', 'We offer warmth without pretending hard things are easy.'], ['Human when it matters', 'When a quiet space is not enough, we make the path to real support clear.']].map(([title, copy], i) => <div key={title} className="rounded-2xl border border-border p-7 sm:p-9"><span className="font-mono text-xs text-accent">0{i + 1}</span><h2 className="mt-8 font-serif text-2xl">{title}</h2><p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{copy}</p></div>)}</div></section>
    <section className="mx-auto max-w-[1220px] px-5 pb-24 text-center sm:px-8"><div className="mx-auto max-w-2xl rounded-[28px] bg-[#d7c9b2]/45 px-6 py-14 dark:bg-[#5a5447]/30 sm:px-12"><Wind className="mx-auto text-primary" size={25} strokeWidth={1.4} /><h2 className="mt-5 font-serif text-4xl">There is no rush.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">Take what is useful. Leave what is not. Come back when you need a place to begin again.</p><div className="mt-7"><Button href="/journal" testId="button-about-journal">Visit the journal <ArrowRight size={15} /></Button></div></div></section>
  </Shell>;
}

const resources = [
  { id: 'grounding', type: 'Practice', title: 'A five-minute return to the room', desc: 'A sensory grounding exercise for when your thoughts have moved too far ahead.', time: '5 min', icon: Wind },
  { id: 'sleep', type: 'Read', title: 'When rest will not come', desc: 'A softer way to meet a restless night — without adding pressure to sleep.', time: '4 min', icon: Moon },
  { id: 'boundaries', type: 'Practice', title: 'The kind boundary', desc: 'Words for protecting your energy without needing to explain everything.', time: '3 min', icon: ShieldCheck },
  { id: 'breath', type: 'Practice', title: 'A longer exhale', desc: 'A simple breathing pattern to signal safety to a busy nervous system.', time: '2 min', icon: Wind },
  { id: 'grief', type: 'Read', title: 'Grief is not a straight line', desc: 'Notes for the days when a memory changes the shape of the room.', time: '6 min', icon: Heart },
  { id: 'asking', type: 'Read', title: 'How to ask for what you need', desc: 'A small script for opening a difficult conversation with someone you trust.', time: '5 min', icon: MessageCircleHeart },
];

function Resources() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<typeof resources[number] | null>(null);
  const filtered = resources.filter(r => (filter === 'All' || r.type === filter) && `${r.title} ${r.desc}`.toLowerCase().includes(search.toLowerCase()));
  return <Shell><PageIntro eyebrow="A shelf for the hard days" title={<>Useful things, when you need them.</>}>Small practices and honest reading for the moments that do not fit neatly into a search box. Take one thing. Leave the rest.</PageIntro>
    <section className="mx-auto max-w-[1220px] px-5 pb-24 sm:px-8"><div className="flex flex-col gap-4 border-y border-border py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2"><SlidersHorizontal size={15} className="mt-2 text-muted-foreground" />{['All', 'Practice', 'Read'].map(f => <button key={f} onClick={() => setFilter(f)} data-testid={`button-filter-${f.toLowerCase()}`} className={`rounded-full px-4 py-2 text-xs transition ${filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>{f}</button>)}</div><label className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground sm:w-64"><Search size={15} /><input value={search} onChange={e => setSearch(e.target.value)} data-testid="input-resource-search" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" placeholder="Search the shelf" /></label></div>
      {filtered.length ? <div className="mt-10 grid gap-5 md:grid-cols-2">{filtered.map((r, i) => { const Icon = r.icon; return <button key={r.id} onClick={() => setActive(r)} data-testid={`card-resource-${r.id}`} className="group flex gap-5 rounded-2xl border border-border bg-card p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-soft)] sm:p-7"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Icon size={20} strokeWidth={1.4} /></span><span className="flex-1"><span className="flex items-start justify-between gap-3"><span><span className="text-[10px] font-semibold uppercase tracking-[.17em] text-primary">{r.type}</span><span className="mt-2 block font-serif text-2xl leading-tight">{r.title}</span></span><ArrowUpRight size={18} className="shrink-0 text-muted-foreground transition group-hover:text-primary" /></span><span className="mt-3 block text-sm leading-6 text-muted-foreground">{r.desc}</span><span className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13} /> {r.time}</span></span></button> })}</div> : <div className="py-20 text-center"><CircleHelp className="mx-auto text-muted-foreground" /><p className="mt-4 font-serif text-2xl">Nothing quite matches that search.</p><button onClick={() => setSearch('')} className="mt-3 text-sm text-primary underline underline-offset-4" data-testid="button-clear-search">Clear search</button></div>}
    </section>
    {active && <div className="fixed inset-0 z-40 grid place-items-center bg-foreground/20 p-5 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="max-w-lg rounded-[24px] border border-border bg-card p-7 shadow-[var(--shadow-soft)] sm:p-10"><div className="flex justify-end"><button onClick={() => setActive(null)} aria-label="Close resource" data-testid="button-close-resource" className="grid size-8 place-items-center rounded-full hover:bg-secondary"><X size={17} /></button></div><p className="text-[10px] font-semibold uppercase tracking-[.17em] text-primary">{active.type} · {active.time}</p><h2 className="mt-3 font-serif text-4xl leading-tight">{active.title}</h2><p className="mt-5 text-[15px] leading-7 text-muted-foreground">{active.desc}</p><div className="mt-7 rounded-xl bg-secondary/70 p-5 text-sm leading-7">Begin gently. Notice one thing you can see, one thing you can hear, and one place your body is supported. There is nothing to get right here — just a moment to return to.</div><div className="mt-7"><Button onClick={() => setActive(null)} testId="button-close-resource-continue">I have enough for now</Button></div></div></div>}
  </Shell>;
}

function Journal() {
  const [entries, setEntries] = useState<{ id: number; text: string; date: string }[]>(() => { try { return JSON.parse(localStorage.getItem('tikvah-entries') || '[]'); } catch { return []; } });
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const save = () => { if (!text.trim()) return; const next = [{ id: Date.now(), text: text.trim(), date: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date()) }, ...entries]; setEntries(next); localStorage.setItem('tikvah-entries', JSON.stringify(next)); setText(''); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const clearAll = () => { setEntries([]); localStorage.removeItem('tikvah-entries'); };
  return <Shell><PageIntro eyebrow="Your private journal" title={<>A place for the words that need somewhere to go.</>}>This journal is yours alone. It stays in this browser, on this device. You do not need an account, and you never need to share what you write.</PageIntro>
    <section className="mx-auto grid max-w-[1220px] gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[26px] border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-8"><div className="flex items-center justify-between border-b border-border pb-5"><span className="flex items-center gap-2 text-xs font-semibold text-primary"><span className="size-2 rounded-full bg-accent" /> New entry</span><span className="text-xs text-muted-foreground"><LockKeyhole size={12} className="mr-1 inline" /> Local only</span></div><textarea value={text} onChange={e => setText(e.target.value)} data-testid="textarea-journal" className="mt-7 min-h-[300px] w-full resize-none bg-transparent font-serif text-[27px] leading-[1.3] outline-none placeholder:text-muted-foreground/55 sm:min-h-[360px] sm:text-4xl" placeholder="What would you like to put down?" /><div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-muted-foreground">{text.length > 0 ? `${text.length} characters` : 'No pressure. A sentence is enough.'}</span><Button onClick={save} testId="button-save-entry">{saved ? <><Check size={15} /> Saved here</> : <>Save privately <ArrowRight size={15} /></>}</Button></div></div><aside><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">A gentle prompt</p><p className="mt-4 font-serif text-3xl leading-tight">What is asking to be noticed?</p><p className="mt-4 text-sm leading-6 text-muted-foreground">You do not have to solve it today. Just let it be seen by you.</p><div className="mt-10 border-t border-border pt-6"><div className="flex items-center justify-between"><h2 className="font-serif text-2xl">Past entries</h2>{entries.length > 0 && <button onClick={clearAll} data-testid="button-clear-entries" className="text-xs text-muted-foreground underline underline-offset-4 hover:text-destructive">Clear all</button>}</div>{entries.length ? <div className="mt-5 space-y-3">{entries.slice(0, 4).map(e => <div key={e.id} data-testid={`entry-${e.id}`} className="rounded-xl border border-border bg-card p-4"><p className="line-clamp-3 text-sm leading-6">{e.text}</p><p className="mt-3 text-[11px] text-muted-foreground">{e.date}</p></div>)}</div> : <div className="mt-5 rounded-xl bg-secondary/50 p-5 text-sm leading-6 text-muted-foreground">Your saved entries will gently gather here. They are not sent anywhere.</div>}</div></aside></section>
  </Shell>;
}

const therapists = [
  { name: 'Dr. Mira Shah', initials: 'MS', location: 'New York · Online', specialties: ['Anxiety', 'Grief'], languages: ['English', 'Hindi'], mode: 'Video', note: 'Warm, collaborative care for people navigating change and uncertainty.' },
  { name: 'Elena Ruiz, LCSW', initials: 'ER', location: 'California · Online', specialties: ['Trauma', 'Identity'], languages: ['English', 'Spanish'], mode: 'Video', note: 'A grounded space to reconnect with your body, story, and sense of choice.' },
  { name: 'Jon Bell, LMFT', initials: 'JB', location: 'Oregon · In person', specialties: ['Relationships', 'Anxiety'], languages: ['English'], mode: 'Both', note: 'Curious, practical therapy for patterns that no longer feel like yours.' },
  { name: 'Amina Okafor, LCSW', initials: 'AO', location: 'Illinois · Online', specialties: ['Grief', 'Depression'], languages: ['English', 'French'], mode: 'Video', note: 'A patient, culturally responsive approach to grief and low seasons.' },
];

function Therapists() {
  const [specialty, setSpecialty] = useState('All');
  const [mode, setMode] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);
  const specialties = ['All', 'Anxiety', 'Grief', 'Trauma', 'Relationships'];
  const visible = therapists.filter(t => (specialty === 'All' || t.specialties.includes(specialty)) && (mode === 'All' || t.mode === mode || t.mode === 'Both'));
  return <Shell><PageIntro eyebrow="Support, when you are ready" title={<>You do not have to carry it <em className="text-primary">alone.</em></>}>A starting place for finding a licensed therapist. Browse without signing up. When you reach out, you can say exactly as much — or as little — as you want.</PageIntro>
    <section className="mx-auto max-w-[1220px] px-5 pb-24 sm:px-8"><div className="flex flex-col gap-4 border-y border-border py-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-muted-foreground">Focus</span>{specialties.map(s => <button key={s} onClick={() => setSpecialty(s)} data-testid={`button-specialty-${s.toLowerCase()}`} className={`rounded-full px-3.5 py-2 text-xs ${specialty === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>{s}</button>)}</div><label className="flex items-center gap-2 text-xs text-muted-foreground"><span>Format</span><select value={mode} onChange={e => setMode(e.target.value)} data-testid="select-therapist-mode" className="rounded-full border border-border bg-background px-3 py-2 text-foreground outline-none"><option>All</option><option>Video</option><option>In person</option></select></label></div><div className="mt-10 space-y-4">{visible.map(t => <div key={t.name} data-testid={`card-therapist-${t.initials}`} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#c6d0bd] font-serif text-xl text-primary dark:bg-[#52624e]">{t.initials}</span><div className="flex-1"><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><h2 className="font-serif text-2xl">{t.name}</h2><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={12} /> {t.location}</p></div><div className="flex gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-secondary px-3 py-1.5">{t.mode}</span>{t.languages.map(l => <span key={l} className="hidden items-center gap-1 rounded-full border border-border px-3 py-1.5 sm:flex"><Languages size={11} /> {l}</span>)}</div></div><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{t.note}</p><div className="mt-5 flex flex-wrap items-center gap-2">{t.specialties.map(s => <span key={s} className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground">{s}</span>)}</div></div><button onClick={() => setExpanded(expanded === t.name ? null : t.name)} aria-label={`View ${t.name}`} data-testid={`button-view-therapist-${t.initials}`} className="grid size-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary">{expanded === t.name ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></div>{expanded === t.name && <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">You can reach out with a simple “Hello, I found you through Tikvah.”</p><Button onClick={() => window.open('mailto:hello@example.com?subject=Therapy inquiry', '_self')} testId={`button-contact-therapist-${t.initials}`}>Start an email <ExternalLink size={14} /></Button></div>}</div>)}</div><p className="mt-8 text-center text-xs text-muted-foreground">Tikvah does not receive payment for these listings. Always verify credentials and fit for yourself.</p></section>
  </Shell>;
}

function Privacy() {
  return <Shell><PageIntro eyebrow="Your privacy, plainly" title={<>You should not have to trade privacy for a place to breathe.</>}>Tikvah is built to ask for less. Here is what that means in everyday language.</PageIntro><section className="mx-auto max-w-[850px] px-5 pb-24 sm:px-8"><div className="space-y-10">{[['What we collect', 'Nothing by default. You can use the journal without an account, and your entries are stored locally in your browser. We do not see, read, or receive them.'], ['What stays with you', 'Your writing, preferences, and theme setting remain on your device. Clearing your browser data may remove them, so export or copy anything you want to keep.'], ['What we do not do', 'We do not sell personal information, build advertising profiles, or use your private writing to train a model.'], ['A note about resources', 'When you choose to open an external support link or contact a therapist, that interaction is governed by their privacy practices, not ours.'], ['Questions', 'If you have a concern about privacy or safety, reach out at hello@tikvah.space. We will answer as plainly as we can.']].map(([title, copy], i) => <article key={title} className="border-t border-border pt-7"><div className="flex gap-6"><span className="font-mono text-xs text-accent">0{i + 1}</span><div><h2 className="font-serif text-3xl">{title}</h2><p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">{copy}</p></div></div></article>)}</div><div className="mt-14 rounded-2xl bg-secondary/60 p-6 text-sm leading-6 text-muted-foreground"><ShieldCheck className="mb-3 text-primary" size={19} /> This is a presentation experience, not legal advice. For a production launch, Tikvah would publish a reviewed, jurisdiction-specific privacy policy.</div></section></Shell>;
}

function Crisis() {
  const [copied, setCopied] = useState(false);
  const copyNumber = () => { navigator.clipboard?.writeText('988'); setCopied(true); setTimeout(() => setCopied(false), 2200); };
  return <Shell><section className="bg-primary text-primary-foreground"><div className="mx-auto max-w-[1220px] px-5 py-16 sm:px-8 sm:py-24"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary-foreground/65">Immediate support</p><h1 className="mt-5 max-w-3xl font-serif text-[clamp(48px,7vw,80px)] leading-[.95] tracking-[-.05em]">You matter in this moment.</h1><p className="mt-7 max-w-xl text-[17px] leading-7 text-primary-foreground/75">If you may hurt yourself or someone else, or cannot stay safe, please connect with a person who can be with you right now. You do not have to explain everything.</p></div></section><section className="mx-auto max-w-[1220px] px-5 py-16 sm:px-8 sm:py-24"><div className="grid gap-5 md:grid-cols-3"><div className="rounded-2xl border-2 border-primary bg-card p-7"><span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground"><Phone size={19} /></span><p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-primary">United States & Canada</p><h2 className="mt-3 font-serif text-3xl">Call or text 988</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">The Suicide & Crisis Lifeline is free, confidential, and available 24/7.</p><div className="mt-6 flex flex-wrap gap-2"><a href="tel:988" data-testid="link-call-988" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground">Call 988 <Phone size={13} /></a><button onClick={copyNumber} data-testid="button-copy-988" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-semibold">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy number'}</button></div></div><div className="rounded-2xl border border-border bg-card p-7"><span className="grid size-11 place-items-center rounded-full bg-secondary text-primary"><MessageCircleHeart size={19} /></span><p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-primary">Elsewhere</p><h2 className="mt-3 font-serif text-3xl">Find your local line</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Find a crisis service in your country through the International Association for Suicide Prevention.</p><a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noreferrer" data-testid="link-international-support" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary underline underline-offset-4">Visit crisis centres <ExternalLink size={13} /></a></div><div className="rounded-2xl border border-border bg-card p-7"><span className="grid size-11 place-items-center rounded-full bg-secondary text-primary"><Heart size={19} /></span><p className="mt-6 text-[11px] font-semibold uppercase tracking-[.16em] text-primary">Right now</p><h2 className="mt-3 font-serif text-3xl">Get closer to people</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Move toward another person, unlock your door, or ask someone you trust to stay with you. You can simply say: “I need company.”</p></div></div><div className="mx-auto mt-16 max-w-2xl border-t border-border pt-10"><h2 className="font-serif text-3xl">If it is not an emergency, but it is still hard</h2><p className="mt-4 text-[15px] leading-7 text-muted-foreground">You can visit the <Link href="/therapists" className="text-primary underline underline-offset-4" data-testid="link-crisis-therapists">therapist directory</Link>, explore a <Link href="/resources" className="text-primary underline underline-offset-4" data-testid="link-crisis-resources">small practice</Link>, or write one sentence in the <Link href="/journal" className="text-primary underline underline-offset-4" data-testid="link-crisis-journal">private journal</Link>. Support does not have to start perfectly.</p><div className="mt-7 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole size={13} className="text-primary" /> Tikvah is not an emergency service. If you are in immediate danger, call your local emergency number.</div></div></section></Shell>;
}

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/about" component={About} />
    <Route path="/resources" component={Resources} />
    <Route path="/privacy" component={Privacy} />
    <Route path="/journal" component={Journal} />
    <Route path="/therapists" component={Therapists} />
    <Route path="/crisis" component={Crisis} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;