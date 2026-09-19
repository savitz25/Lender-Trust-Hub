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
import {
  getMyLendingStorageMode,
  getMyLendingStorageUserId,
  getMyLendingStorageGeneration,
  registerMyLendingCloudPush,
  setMyLendingStorageIdentity,
} from '@/lib/my-lending/storage';
import {
  pullMyLendingWorkspace,
  scheduleMyLendingCloudPush,
  type SyncPullResult,
} from '@/lib/my-lending/sync';

type AuthContext = 'lender' | 'general';

export type WorkspaceStorageInfo = {
  mode: 'guest' | 'signed_in';
  syncStatus: 'idle' | 'syncing' | 'synced' | 'local_only' | 'error';
  lastPull?: SyncPullResult;
};

type MyLendingContextValue = {
  user: User | null;
  loading: boolean;
  authOpen: boolean;
  authContext: AuthContext;
  redirectPath: string;
  workspaceStorage: WorkspaceStorageInfo;
  openAuth: (opts?: { context?: AuthContext; redirectPath?: string }) => void;
  closeAuth: () => void;
  requireAuth: (opts?: { context?: AuthContext; redirectPath?: string }) => boolean;
  /**
   * Sign out session only. Never clears guest or user local workspace caches.
   * Active storage switches back to guest device key.
   */
  signOutLocal: () => Promise<void>;
};

const MyLendingContext = createContext<MyLendingContextValue | null>(null);

/**
 * Network identity shell for My Lending.
 * Session + auth UI + V1.1 storage identity / light cloud sync foundation.
 * Guest localStorage is never wiped on sign-in/out.
 */
export function MyLendingProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authContext, setAuthContext] = useState<AuthContext>('general');
  const [redirectPath, setRedirectPath] = useState('/my-lending');
  const [workspaceStorage, setWorkspaceStorage] = useState<WorkspaceStorageInfo>({
    mode: 'guest',
    syncStatus: 'local_only',
  });

  useEffect(() => {
    let mounted = true;
    let latestPush = 0;
    registerMyLendingCloudPush((userId, state) => {
      const generation = getMyLendingStorageGeneration();
      const operation = ++latestPush;
      scheduleMyLendingCloudPush(userId, state, result => {
        if (!mounted || operation !== latestPush || getMyLendingStorageUserId() !== userId ||
          getMyLendingStorageGeneration() !== generation || result === 'skipped') return;
        setWorkspaceStorage(prev => ({ ...prev, mode: 'signed_in', syncStatus: result === 'ok' ? 'synced' : 'error' }));
      });
      setWorkspaceStorage((prev) => ({
        ...prev,
        mode: 'signed_in',
        syncStatus: 'idle',
      }));
    });
    return () => { mounted = false; registerMyLendingCloudPush(null); };
  }, []);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      const finishLoading = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(finishLoading);
    }

    let mounted = true;
    let identityVersion = 0;
    let authEventReceived = false;

    async function applyIdentity(nextUser: User | null) {
      if (!mounted) return;
      const version = ++identityVersion;
      setLoading(true);
      const { mode } = setMyLendingStorageIdentity(nextUser?.id ?? null);
      if (!nextUser) {
        if (!mounted) return;
        setWorkspaceStorage({ mode: 'guest', syncStatus: 'local_only' });
        setLoading(false);
        return;
      }
      if (!mounted) return;
      setWorkspaceStorage({ mode, syncStatus: 'syncing' });
      const result = await pullMyLendingWorkspace(nextUser.id);
      if (!mounted || version !== identityVersion) return;
      setWorkspaceStorage({
        mode: getMyLendingStorageMode(),
        syncStatus:
          result === 'error'
            ? 'error'
            : result === 'applied_remote' || result === 'pushed_local' || result === 'confirmed_local'
              ? 'synced'
              : 'local_only',
        lastPull: result,
      });
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted || authEventReceived || error) return;
      const next = data.user ?? null;
      setUser(next);
      void applyIdentity(next);
    }).catch(() => { /* Keep unresolved auth pending; Save offers a timed retry. */ });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      authEventReceived = true;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (event === 'SIGNED_IN' && nextUser) {
        setAuthOpen(false);
      }
      void applyIdentity(nextUser);
    });

    let authErrorTimer: number | undefined;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      if (auth === 'error') {
        authErrorTimer = window.setTimeout(() => setAuthOpen(true), 0);
      }
    }

    return () => {
      mounted = false;
      identityVersion++;
      if (authErrorTimer !== undefined) window.clearTimeout(authErrorTimer);
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
    setMyLendingStorageIdentity(null);
    setWorkspaceStorage({ mode: 'guest', syncStatus: 'local_only' });
  }, []);

  const value = useMemo<MyLendingContextValue>(
    () => ({
      user,
      loading,
      authOpen,
      authContext,
      redirectPath,
      workspaceStorage,
      openAuth,
      closeAuth,
      requireAuth,
      signOutLocal,
    }),
    [
      user,
      loading,
      authOpen,
      authContext,
      redirectPath,
      workspaceStorage,
      openAuth,
      closeAuth,
      requireAuth,
      signOutLocal,
    ]
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
