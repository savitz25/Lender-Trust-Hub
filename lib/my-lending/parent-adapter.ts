/**
 * Lender-side parent Save prep.
 * Device Save/Unsave uses the existing My Lending store.
 * A resolved numeric NMLS can be queued locally for a later account sync.
 * PRODUCTION_PARENT_SYNC is off: this module never calls Ask.
 */

import { cleanNmlsId } from '../verification/nmls';
import {
  isLenderSaved,
  loadState,
  removeSavedLender,
  shortlistLender,
  type UpsertSavedLenderInput,
  type UpsertSavedLenderResult,
} from './storage';

export const PRODUCTION_PARENT_SYNC = false;
export const PARENT_PENDING_KEY = 'lth:lender-parent-pending:v1';

/**
 * National /lender/{slug} pages use a different published grain
 * (nmls-inst, gleif-lei, or fdic-cert). They have no profile Save control.
 * institution_id UUIDs and slugs are not a Save identity. HMDA LEI-cell
 * counts are publication statistics, not a profile.
 */
export const NATIONAL_PROFILE_SAVE = 'not_in_scope' as const;

export type MarketplaceSaveIdentity = {
  profileClass: 'marketplace_company';
  namespace: 'nmls';
  nativeId: string;
  jurisdiction: 'US';
  publicationSource: 'lender_trust_hub_catalog';
  publicationGrain: 'company_nmls';
  returnPath: string;
};

export type ParentPrepAck =
  | {
      ok: true;
      action: 'save' | 'unsave';
      identity: MarketplaceSaveIdentity;
      localQueued: true;
      pendingSync: false;
      acknowledged: 'save' | 'unsave';
      watchCreated: false;
      parentSync: 'off';
    }
  | {
      ok: false;
      reason: 'identity_unresolved' | 'device_save_blocked' | 'device_remove_blocked' | 'pending_storage_blocked' | 'not_saved';
      localQueued: false;
      pendingSync: false;
      watchCreated: false;
      parentSync: 'off';
    };

type PendingParentOp = {
  action: 'save' | 'unsave';
  nativeId: string;
  namespace: 'nmls';
  returnPath: string;
  acknowledged: 'save' | 'unsave';
  watchCreated: false;
  parentSync: 'off';
  at: string;
};

export type DeviceProfileSaveResult = {
  device: UpsertSavedLenderResult;
  parent: ParentPrepAck;
  watchCreated: false;
};

export type DeviceProfileUnsaveResult = {
  removed: boolean;
  error?: string;
  parent: ParentPrepAck;
  watchCreated: false;
};

function closed(reason: Extract<ParentPrepAck, { ok: false }>['reason']): ParentPrepAck {
  return {
    ok: false,
    reason,
    localQueued: false,
    pendingSync: false,
    watchCreated: false,
    parentSync: 'off',
  };
}

/** Slug is the return path only. Missing or non-numeric NMLS fails closed. */
export function resolveMarketplaceSaveIdentity(input: {
  lenderSlug: string;
  nmlsId?: string | null;
}): MarketplaceSaveIdentity | null {
  const nativeId = cleanNmlsId(input.nmlsId);
  const slug = input.lenderSlug.trim();
  if (!nativeId || !slug) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) return null;
  return {
    profileClass: 'marketplace_company',
    namespace: 'nmls',
    nativeId,
    jurisdiction: 'US',
    publicationSource: 'lender_trust_hub_catalog',
    publicationGrain: 'company_nmls',
    returnPath: `/lenders/${slug}`,
  };
}

function readPending(): PendingParentOp[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PARENT_PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is PendingParentOp =>
        Boolean(row) &&
        typeof row === 'object' &&
        (row as PendingParentOp).namespace === 'nmls' &&
        ((row as PendingParentOp).action === 'save' || (row as PendingParentOp).action === 'unsave') &&
        typeof (row as PendingParentOp).nativeId === 'string'
    );
  } catch {
    return [];
  }
}

function writePending(rows: PendingParentOp[]): boolean {
  if (typeof window === 'undefined') return false;
  if (PRODUCTION_PARENT_SYNC) return false;
  try {
    localStorage.setItem(PARENT_PENDING_KEY, JSON.stringify(rows));
    return true;
  } catch {
    return false;
  }
}

export function listPendingParentOps(): PendingParentOp[] {
  return readPending();
}

function queuePending(identity: MarketplaceSaveIdentity, action: 'save' | 'unsave'): ParentPrepAck {
  if (PRODUCTION_PARENT_SYNC) return closed('identity_unresolved');
  const next = readPending().filter((row) => row.nativeId !== identity.nativeId);
  const op: PendingParentOp = {
    action,
    nativeId: identity.nativeId,
    namespace: 'nmls',
    returnPath: identity.returnPath,
    acknowledged: action,
    watchCreated: false,
    parentSync: 'off',
    at: new Date().toISOString(),
  };
  next.push(op);
  if (!writePending(next)) return closed('pending_storage_blocked');
  return {
    ok: true,
    action,
    identity,
    localQueued: true,
    pendingSync: false,
    acknowledged: action,
    watchCreated: false,
    parentSync: 'off',
  };
}

export function deviceFirstProfileSave(
  input: UpsertSavedLenderInput
): DeviceProfileSaveResult {
  const device = shortlistLender(input);
  if (!device.ok) {
    return { device, parent: closed('device_save_blocked'), watchCreated: false };
  }
  const identity = resolveMarketplaceSaveIdentity({
    lenderSlug: input.lenderSlug,
    nmlsId: input.nmlsId,
  });
  if (!identity) {
    return { device, parent: closed('identity_unresolved'), watchCreated: false };
  }
  return { device, parent: queuePending(identity, 'save'), watchCreated: false };
}

export function acknowledgeDeviceSave(
  input: UpsertSavedLenderInput,
  device: UpsertSavedLenderResult
): ParentPrepAck {
  if (!device.ok) return closed('device_save_blocked');
  const identity = resolveMarketplaceSaveIdentity({
    lenderSlug: input.lenderSlug,
    nmlsId: input.nmlsId,
  });
  if (!identity) return closed('identity_unresolved');
  return queuePending(identity, 'save');
}

export function deviceFirstProfileUnsave(input: {
  lenderSlug: string;
  nmlsId?: string | null;
}): DeviceProfileUnsaveResult {
  const saved = isLenderSaved(input.lenderSlug);
  if (!saved) {
    return { removed: false, parent: closed('not_saved'), watchCreated: false };
  }
  const result = removeSavedLender(input.lenderSlug);
  if (!result.ok) {
    return { removed: false, error: result.error, parent: closed('device_remove_blocked'), watchCreated: false };
  }
  if (!result.removed) {
    return { removed: false, parent: closed('not_saved'), watchCreated: false };
  }
  const identity = resolveMarketplaceSaveIdentity(input);
  if (!identity) {
    return { removed: true, parent: closed('identity_unresolved'), watchCreated: false };
  }
  return { removed: true, parent: queuePending(identity, 'unsave'), watchCreated: false };
}

/** Local rows for one profile slug. Parent identity is not this key. */
export function localSavedCountForSlug(lenderSlug: string): number {
  return loadState().savedLenders.filter((row) => row.lenderSlug === lenderSlug).length;
}
