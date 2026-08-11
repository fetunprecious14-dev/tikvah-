import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import type { Session } from '@supabase/supabase-js';
import { useGetCurrentUser, getGetCurrentUserQueryKey, setAuthTokenGetter } from '@workspace/api-client-react';
import type { User } from '@workspace/api-client-react';
import { supabase } from './supabaseClient';
import { queryClient } from './queryClient';

// Registered once at module load, not inside a component — the getter reads
// the *current* session fresh on every call via getSession() (a cheap local
// read; supabase-js refreshes the token in the background as needed), so a
// single registration stays correct across sign-in/sign-out without ever
// needing to be re-registered.
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // supabase-js fires `onAuthStateChange` with an `INITIAL_SESSION` event as
  // soon as it's finished checking storage for an existing session — this
  // flag tracks that, so the very first render (before we know either way)
  // can still show a loading state instead of flashing "signed out".
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Clear every cached query — not just this one — whenever a session
      // ends, by whatever means: the logout button, a token that fails to
      // refresh, or the session being revoked elsewhere. This is the only
      // place that's true for *every* case; a click handler on the logout
      // button alone would miss the other two, and `data` below is
      // deliberately not re-gated on `session` (see its comment), so nothing
      // else would clear this query's cache on those paths either.
      if (!newSession) queryClient.clear();
      setSession(newSession);
      setSessionChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Only *auto-fetch* the app profile once there's a Supabase session —
  // otherwise this is a guaranteed 401 (retry is disabled globally in
  // queryClient.ts, so that 401 would just sit there rather than retry).
  // Deliberately not gating the returned `user` on `session` too: `enabled`
  // only controls automatic fetching, not what `data` reflects, and register
  // seeds this same query's cache directly right after profile creation
  // (see register.tsx) — gating on `session` here would hide that seeded
  // value until the (already-redundant) state-change event catches up. The
  // `onAuthStateChange` handler above is what keeps this safe on sign-out.
  const { data, isLoading: isProfileLoading } = useGetCurrentUser({
    // queryKey is spelled out even though the hook would default to the same
    // value — the generated type requires it on an explicit `query` override.
    query: { queryKey: getGetCurrentUserQueryKey(), enabled: !!session },
  });

  const user = data ?? null;
  const isLoading = !sessionChecked || (!!session && isProfileLoading);

  return <AuthContext.Provider value={{ user, session, isLoading }}>{children}</AuthContext.Provider>;
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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) navigate('/');
  }, [isLoading, user, navigate]);

  if (isLoading) return <Centered>Checking access…</Centered>;
  if (!user || user.role !== 'admin') return null;
  return <>{children}</>;
}
