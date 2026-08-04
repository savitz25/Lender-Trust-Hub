'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type AuthContext = 'lender' | 'general';

type MyLendingContextValue = {
  user: User | null;
  loading: boolean;
  authOpen: boolean;
  authContext: AuthContext;
  redirectPath: string;
  openAuth: (opts?: { context?: AuthContext; redirectPath?: string }) => void;
  closeAuth: () => void;
  requireAuth: (opts?: { context?: AuthContext; redirectPath?: string }) => boolean;
  /**
   * Sign out session only. Never clears `lth:my-lending:v1` local plans.
   * Cloud plan sync is Phase 4 — local remains source of truth.
   */
  signOutLocal: () => Promise<void>;
};

const MyLendingContext = createContext<MyLendingContextValue | null>(null);

/**
 * Network identity shell for My Lending.
 * Session + auth UI only. Guest localStorage is never wiped on sign-in/out.
 * Full cloud multi-plan merge is intentionally out of scope (Phase 4).
 */
export function MyLendingProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authContext, setAuthContext] = useState<AuthContext>('general');
  const [redirectPath, setRedirectPath] = useState('/my-lending');

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (event === 'SIGNED_IN' && nextUser) {
        setAuthOpen(false);
      }
      // SIGNED_OUT: keep localStorage intact — only drop in-memory user
    });

    // Surface ?auth=success|error on HQ after OAuth/magic redirect
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      if (auth === 'error') {
        setAuthOpen(true);
      }
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const openAuth = useCallback(
    (opts?: { context?: AuthContext; redirectPath?: string }) => {
      if (opts?.context) setAuthContext(opts.context);
      if (opts?.redirectPath) setRedirectPath(opts.redirectPath);
      setAuthOpen(true);
    },
    []
  );

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  const requireAuth = useCallback(
    (opts?: { context?: AuthContext; redirectPath?: string }) => {
      if (user) return true;
      openAuth(opts);
      return false;
    },
    [openAuth, user]
  );

  const signOutLocal = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    setUser(null);
    // Never clear lth:my-lending:v1
  }, []);

  const value = useMemo<MyLendingContextValue>(
    () => ({
      user,
      loading,
      authOpen,
      authContext,
      redirectPath,
      openAuth,
      closeAuth,
      requireAuth,
      signOutLocal,
    }),
    [user, loading, authOpen, authContext, redirectPath, openAuth, closeAuth, requireAuth, signOutLocal]
  );

  return <MyLendingContext.Provider value={value}>{children}</MyLendingContext.Provider>;
}

export function useMyLending() {
  const ctx = useContext(MyLendingContext);
  if (!ctx) {
    throw new Error('useMyLending must be used within MyLendingProvider');
  }
  return ctx;
}

/** Safe hook when provider may be absent */
export function useMyLendingOptional() {
  return useContext(MyLendingContext);
}
