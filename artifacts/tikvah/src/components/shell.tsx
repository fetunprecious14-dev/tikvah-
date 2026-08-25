import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowUpRight, Leaf, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLogoutUser } from '@workspace/api-client-react';
import { queryClient } from '@/lib/queryClient';
import { NotificationsMenu } from './notifications-menu';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-[hsl(var(--foreground))]" data-testid="link-logo">
      <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
        <Leaf size={16} strokeWidth={1.6} />
      </span>
      <span className="font-serif text-[23px] tracking-[-.03em]">tikvah</span>
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('tikvah-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tikvah-theme', dark ? 'dark' : 'light');
  }, [dark]);
  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label={dark ? 'Use light mode' : 'Use dark mode'}
      data-testid="button-theme"
      className="grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function useNavItems() {
  const { user } = useAuth();
  if (!user) {
    return [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/resources', label: 'Resources' },
      { href: '/professionals', label: 'Professional help' },
    ];
  }
  const items = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/conversations', label: 'Conversations' },
    { href: '/resources', label: 'Resources' },
    { href: '/professionals', label: 'Professional help' },
  ];
  if (user.role === 'admin') items.push({ href: '/admin', label: 'Admin' });
  return items;
}

export function Header() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navItems = useNavItems();
  const logout = useLogoutUser();

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => queryClient.clear() });
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-[74px] max-w-[1220px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
              className={`text-[13px] transition-colors hover:text-primary ${location === item.href ? 'font-semibold text-primary' : 'text-muted-foreground'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!isLoading && user && <NotificationsMenu />}
          <Link
            href="/crisis"
            data-testid="link-header-crisis"
            className="hidden items-center gap-2 rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition hover:border-primary hover:text-primary sm:flex"
          >
            Need help now <ArrowUpRight size={14} />
          </Link>
          {!isLoading &&
            (user ? (
              <button onClick={handleLogout} data-testid="button-logout" className="hidden rounded-full border border-border px-4 py-2 text-[12px] font-semibold text-foreground transition hover:border-primary hover:text-primary sm:flex">
                Sign out
              </button>
            ) : (
              <Link href="/login" data-testid="link-header-login" className="hidden rounded-full bg-primary px-4 py-2 text-[12px] font-semibold text-primary-foreground transition hover:-translate-y-0.5 sm:flex">
                Sign in
              </Link>
            ))}
          <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} data-testid="button-mobile-menu" className="grid size-9 place-items-center rounded-full text-foreground md:hidden">
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-border bg-background px-5 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-1">
            {navItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/crisis" onClick={() => setMobileOpen(false)} data-testid="link-mobile-crisis" className="mt-2 rounded-lg bg-primary px-3 py-3 text-sm text-primary-foreground">
              I need help now
            </Link>
            {user ? (
              <button onClick={handleLogout} data-testid="button-mobile-logout" className="rounded-lg px-3 py-3 text-left text-sm text-muted-foreground hover:bg-secondary">
                Sign out
              </button>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} data-testid="link-mobile-login" className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary">
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto grid max-w-[1220px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-[260px] text-sm leading-6 text-muted-foreground">A quiet place to put down what you are carrying.</p>
          <p className="mt-8 text-xs text-muted-foreground">Made with care for tender days.</p>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Explore</p>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/dashboard" data-testid="link-footer-dashboard" className="hover:text-primary">
              Your dashboard
            </Link>
            <Link href="/resources" data-testid="link-footer-resources" className="hover:text-primary">
              Resources
            </Link>
            <Link href="/professionals" data-testid="link-footer-professionals" className="hover:text-primary">
              Professional help
            </Link>
            <Link href="/crisis" data-testid="link-footer-crisis" className="hover:text-primary">
              Crisis support
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Learn</p>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/about" data-testid="link-footer-about" className="hover:text-primary">
              About Tikvah
            </Link>
            <Link href="/privacy" data-testid="link-footer-privacy" className="hover:text-primary">
              Privacy promise
            </Link>
          </div>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">A gentle reminder</p>
          <p className="text-sm leading-6 text-muted-foreground">You do not have to have the right words. You only have to begin.</p>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1220px] flex-col gap-2 border-t border-border/70 px-5 py-5 text-xs text-muted-foreground sm:px-8 md:flex-row md:justify-between">
        <span>© 2026 Tikvah</span>
        <span>Every conversation stays between you and our team.</span>
      </div>
    </footer>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell grain">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

export function Button({
  children,
  onClick,
  href,
  secondary = false,
  testId = 'button-action',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  secondary?: boolean;
  testId?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold transition duration-300 ${secondary ? 'border border-border bg-background text-foreground hover:border-primary hover:text-primary' : 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(44,80,60,.18)]'} ${disabled ? 'cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none' : ''}`;
  if (href)
    return (
      <Link href={href} className={cls} data-testid={testId}>
        {children}
      </Link>
    );
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} data-testid={testId}>
      {children}
    </button>
  );
}

export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-[1220px] px-5 pb-16 pt-16 sm:px-8 sm:pt-24 md:pb-20">
      <p className="reveal text-[11px] font-semibold uppercase tracking-[.2em] text-primary">{eyebrow}</p>
      <h1 className="reveal reveal-delay-1 mt-5 max-w-3xl font-serif text-[clamp(42px,7vw,76px)] leading-[.98] tracking-[-.045em] text-balance">{title}</h1>
      <div className="reveal reveal-delay-2 mt-7 max-w-xl text-[16px] leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
