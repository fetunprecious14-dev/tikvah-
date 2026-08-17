import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetCurrentUser } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { getAdminAccessState } from './admin-state';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // retry is disabled globally in queryClient.ts — a 401 here just means "signed out".
  const { data, isLoading } = useGetCurrentUser();

  return <AuthContext.Provider value={{ user: data ?? null, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-5 text-sm text-muted-foreground" role="status">
      {children}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) navigate('/login');
  }, [isLoading, user, navigate]);

  if (isLoading) return <Centered>Preparing your space…</Centered>;
  if (!user) return null;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const access = getAdminAccessState(user, isLoading);

  useEffect(() => {
    if (access === 'signed-out') navigate('/login');
  }, [access, navigate]);

  if (access === 'loading') return <Centered>Checking access…</Centered>;
  if (access === 'signed-out') return null;
  if (access === 'denied') {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-5">
        <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]" role="alert" data-testid="admin-access-denied">
          <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-primary">Admin access required</p>
          <h1 className="mt-4 font-serif text-4xl">This room is for the Tikvah team.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            You are signed in, but this account does not have administrator access.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground" data-testid="link-admin-denied-dashboard">
              Go to your dashboard
            </Link>
            <Link href="/" className="rounded-full border border-border px-5 py-3 text-sm font-semibold" data-testid="link-admin-denied-home">
              Go home
            </Link>
          </div>
        </section>
      </main>
    );
  }
  return <>{children}</>;
}
