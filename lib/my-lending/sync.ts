/**
 * My Lending V1.1 — light multi-device sync foundation.
 *
 * Guest: device localStorage only (lth:my-lending:v1).
 * Signed-in: prefer user-scoped local cache + optional Supabase workspace blob.
 *
 * No plan-level merge / conflict UI. Last-write-wins by client_updated_at.
 * Cloud table may be absent until migration is applied — fail soft.
 */

import type { MyLendingState } from '@/lib/my-lending/types';
import {
  getMyLendingStorageUserId,
  getStateMaxUpdatedAt,
  isMyLendingStateEmpty,
  loadState,
  replaceStateFromRemote,
} from '@/lib/my-lending/storage';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import type { Json } from '@/types/supabase';

export type SyncPullResult =
  | 'applied_remote'
  | 'kept_local'
  | 'pushed_local'
  | 'empty'
  | 'skipped'
  | 'error';

export type SyncPushResult = 'ok' | 'skipped' | 'error';

function asWorkspacePayload(raw: unknown): MyLendingState | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as MyLendingState;
  if (!Array.isArray(o.plans) || !Array.isArray(o.savedLenders)) return null;
  return o;
}

/**
 * Pull cloud workspace if newer than local signed-in cache.
 * If local is newer (or cloud empty), push local once.
 */
export async function pullMyLendingWorkspace(
  userId: string
): Promise<SyncPullResult> {
  if (!userId) return 'skipped';
  if (getMyLendingStorageUserId() !== userId) return 'skipped';

  const supabase = createBrowserSupabaseClient();
  if (!supabase) return 'skipped';

  try {
    const { data, error } = await supabase
      .from('my_lending_workspaces')
      .select('payload, client_updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Table missing or RLS — foundation only
      if (typeof console !== 'undefined') {
        console.info('[my-lending-sync] pull skipped:', error.message);
      }
      return 'error';
    }

    const local = loadState();
    const localTs = getStateMaxUpdatedAt(local);
    const remotePayload = data ? asWorkspacePayload(data.payload) : null;
    const remoteTs =
      typeof data?.client_updated_at === 'string' ? data.client_updated_at : '';

    if (remotePayload && remoteTs && remoteTs > localTs) {
      const ok = replaceStateFromRemote(remotePayload);
      return ok ? 'applied_remote' : 'error';
    }

    if (!isMyLendingStateEmpty(local) && (!remotePayload || localTs > remoteTs)) {
      const push = await pushMyLendingWorkspace(userId, local);
      return push === 'ok' ? 'pushed_local' : push === 'skipped' ? 'kept_local' : 'error';
    }

    if (isMyLendingStateEmpty(local) && !remotePayload) return 'empty';
    return 'kept_local';
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[my-lending-sync] pull failed', e);
    return 'error';
  }
}

/** Upsert full workspace blob for the signed-in user. */
export async function pushMyLendingWorkspace(
  userId: string,
  state?: MyLendingState
): Promise<SyncPushResult> {
  if (!userId) return 'skipped';
  if (getMyLendingStorageUserId() && getMyLendingStorageUserId() !== userId) {
    return 'skipped';
  }

  const supabase = createBrowserSupabaseClient();
  if (!supabase) return 'skipped';

  const payload = state ?? loadState();
  const clientUpdatedAt = getStateMaxUpdatedAt(payload) || new Date().toISOString();

  try {
    const { error } = await supabase.from('my_lending_workspaces').upsert(
      {
        user_id: userId,
        payload: payload as unknown as Json,
        client_updated_at: clientUpdatedAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    if (error) {
      if (typeof console !== 'undefined') {
        console.info('[my-lending-sync] push skipped:', error.message);
      }
      return 'error';
    }
    return 'ok';
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[my-lending-sync] push failed', e);
    return 'error';
  }
}

/** Debounced push used by storage after local save when signed in. */
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleMyLendingCloudPush(userId: string, state: MyLendingState): void {
  if (!userId) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushMyLendingWorkspace(userId, state);
  }, 800);
}
