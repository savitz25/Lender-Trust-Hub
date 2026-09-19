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
  getMyLendingStorageGeneration,
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
  | 'confirmed_local'
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
  const generation = getMyLendingStorageGeneration();
  const current = () => getMyLendingStorageUserId() === userId && getMyLendingStorageGeneration() === generation;

  const supabase = createBrowserSupabaseClient();
  if (!supabase) return 'skipped';

  try {
    const { data, error } = await supabase
      .from('my_lending_workspaces')
      .select('payload, client_updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!current()) return 'skipped';
    if (error) {
      // Table missing or RLS — foundation only
      if (typeof console !== 'undefined') {
        console.info('[my-lending-sync] pull skipped:', error.message);
      }
      return 'error';
    }

    // The request may finish after sign-out or an account switch. Never apply
    // another owner's payload to the now-active workspace.
    if (getMyLendingStorageUserId() !== userId) return 'skipped';
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
      if (!current()) return 'skipped';
      return push === 'ok' ? 'pushed_local' : push === 'skipped' ? 'kept_local' : 'error';
    }

    if (isMyLendingStateEmpty(local) && !remotePayload) return 'empty';
    // Equal timestamps alone are not a receipt. Only exact matching research
    // can restore confirmation without writing or replacing the local copy.
    if (remotePayload && JSON.stringify(remotePayload) === JSON.stringify(local)) return 'confirmed_local';
    return 'kept_local';
  } catch (e) {
    if (!current()) return 'skipped';
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
  if (getMyLendingStorageUserId() !== userId) {
    return 'skipped';
  }
  const generation = getMyLendingStorageGeneration();
  const current = () => getMyLendingStorageUserId() === userId && getMyLendingStorageGeneration() === generation;

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

    // The dispatched request may have completed for the old owner. This does
    // not roll it back; it only withholds acknowledgment from the new context.
    if (!current()) return 'skipped';
    if (error) {
      if (typeof console !== 'undefined') {
        console.info('[my-lending-sync] push skipped:', error.message);
      }
      return 'error';
    }
    return 'ok';
  } catch (e) {
    if (!current()) return 'skipped';
    if (typeof console !== 'undefined') console.warn('[my-lending-sync] push failed', e);
    return 'error';
  }
}

/** Debounced push used by storage after local save when signed in. */
let pushTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleMyLendingCloudPush(userId: string, state: MyLendingState, onResult?: (result: SyncPushResult) => void): void {
  if (!userId) return;
  const generation = getMyLendingStorageGeneration();
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (getMyLendingStorageUserId() !== userId || getMyLendingStorageGeneration() !== generation) {
      onResult?.('skipped');
      return;
    }
    void pushMyLendingWorkspace(userId, state).then(result => onResult?.(result));
  }, 800);
}
