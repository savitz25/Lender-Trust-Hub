/**
 * Lender one-click Save prep.
 * Release exposure comes from the production environment, not a compiled flag.
 * NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED and
 * NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS are read as process.env
 * NEXT_PUBLIC values, so Next bundles them at build. Lender must redeploy
 * when the master switch or the canary list changes.
 * MTH_LENDER_PARENT_SAVE_MODE is read on the server at request time.
 * The profile control asks that same server decision and does not decide
 * admission itself.
 */

import { cleanNmlsId } from '../verification/nmls';
import { isCanonicalLenderProfile } from '../verification/entity-identity';
import type { Lender } from '../mockData';
import {
  deviceFirstProfileSave,
  deviceFirstProfileUnsave,
  listPendingParentOps,
  type DeviceProfileSaveResult,
} from './parent-adapter';

export const NMLS_NAMESPACE = 'nmls';
export const LENDER_PROFILE_CLASS = 'marketplace_company';

export const LENDER_CANARIES = [
  { slug: 'freedom-mortgage', nmls: '2767', name: 'Freedom Mortgage' },
  { slug: 'loandepot', nmls: '174457', name: 'loanDepot' },
  { slug: 'guaranteed-rate', nmls: '2611', name: 'Guaranteed Rate' },
] as const;

export type CanaryProfile = (typeof LENDER_CANARIES)[number];

const RELEASE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ParentRelease = {
  enabled: boolean;
  parentSync: 'off' | 'production';
  canary: boolean;
  broad: boolean;
  slugs: readonly string[];
};

export type OneClickGate = {
  broad: boolean;
  canary: boolean;
  slugs?: readonly string[];
};

function canarySlugList(raw: string | undefined): readonly string[] | null {
  if (raw === undefined || raw.trim() === '') return [];
  const slugs: string[] = [];
  for (const part of raw.split(',')) {
    const slug = part.trim();
    if (!slug) continue;
    if (!RELEASE_SLUG.test(slug) || slugs.includes(slug)) return null;
    slugs.push(slug);
  }
  return slugs;
}

const RELEASE_OFF: ParentRelease = {
  enabled: false,
  parentSync: 'off',
  canary: false,
  broad: false,
  slugs: [],
};

export type ReleaseEnv = {
  NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED?: string;
  NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS?: string;
  MTH_LENDER_PARENT_SAVE_MODE?: string;
};

/** Master off, or any malformed mode or slug list, stays off. */
export function productionParentGate(env?: ReleaseEnv): ParentRelease {
  const source: ReleaseEnv = env ?? {
    NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: process.env.NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED,
    NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: process.env.NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS,
    MTH_LENDER_PARENT_SAVE_MODE: process.env.MTH_LENDER_PARENT_SAVE_MODE,
  };
  const slugs = canarySlugList(source.NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS);
  const enabled = source.NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED === '1';
  const mode = (source.MTH_LENDER_PARENT_SAVE_MODE ?? '').trim();
  if (slugs === null || !enabled || mode !== 'production') return { ...RELEASE_OFF, slugs: [] };
  if (slugs.length === 0) return { enabled: true, parentSync: 'production', canary: false, broad: true, slugs };
  return { enabled: true, parentSync: 'production', canary: true, broad: false, slugs };
}

export function canaryAllows(slug: string, gate: OneClickGate): boolean {
  if (gate.broad && gate.canary) return false;
  if (gate.broad) return true;
  if (!gate.canary) return false;
  const list = gate.slugs ?? LENDER_CANARIES.map((item) => item.slug);
  return list.includes(slug);
}

/** Release exposure for one profile. Publication and NMLS checks stay separate. */
export function releaseAdmits(slug: string, gate: ParentRelease): boolean {
  return gate.parentSync === 'production' && RELEASE_SLUG.test(slug) && canaryAllows(slug, gate);
}

export function lenderNativeId(nmls: string): string | null {
  const clean = cleanNmlsId(nmls);
  if (!clean || !/^[1-9][0-9]{2,11}$/.test(clean)) return null;
  return `nmls:${clean}`;
}

export type MarketplacePublication =
  | { ok: true; slug: string; nmls: string; nativeId: string; returnPath: string; profileClass: 'marketplace_company' }
  | { ok: false; reason: 'unpublished' | 'missing_nmls' | 'wrong_class' | 'noncanonical' };

export function assessMarketplaceProfile(
  slug: string,
  profileClass: string,
  catalog: readonly Lender[],
): MarketplacePublication {
  if (profileClass !== LENDER_PROFILE_CLASS) return { ok: false, reason: 'wrong_class' };
  const row = catalog.find((item) => item.slug === slug);
  if (!row) return { ok: false, reason: 'unpublished' };
  const nmls = cleanNmlsId(row.nmlsId);
  if (!nmls) return { ok: false, reason: 'missing_nmls' };
  if (!isCanonicalLenderProfile(row, [...catalog])) return { ok: false, reason: 'noncanonical' };
  const nativeId = lenderNativeId(nmls);
  if (!nativeId) return { ok: false, reason: 'missing_nmls' };
  return {
    ok: true,
    slug,
    nmls,
    nativeId,
    returnPath: `/lenders/${slug}`,
    profileClass: 'marketplace_company',
  };
}

export type BindingRow = {
  id: string;
  networkEntityId: string;
  status: 'accepted' | 'review_required' | string;
  profileClass: string;
  nativeId: string;
  namespace: string;
  sourceIdentifier: string;
  jurisdiction: string;
  entityStatus: string;
};

export type BindingDecision =
  | { eligible: true; id: string; networkEntityId: string }
  | { eligible: false; reason: 'missing' | 'ambiguous' | 'review_required' | 'identity_disagreement' | 'wrong_class' | 'inactive' };

export function classifyAskBinding(nativeId: string, rows: readonly BindingRow[]): BindingDecision {
  const nmls = nativeId.startsWith('nmls:') ? nativeId.slice(5) : '';
  if (!lenderNativeId(nmls)) return { eligible: false, reason: 'identity_disagreement' };
  if (rows.length === 0) return { eligible: false, reason: 'missing' };
  if (rows.length > 1) return { eligible: false, reason: 'ambiguous' };
  const row = rows[0]!;
  if (row.profileClass !== LENDER_PROFILE_CLASS) return { eligible: false, reason: 'wrong_class' };
  if (row.status === 'review_required') return { eligible: false, reason: 'review_required' };
  if (row.entityStatus !== 'active') return { eligible: false, reason: 'inactive' };
  if (
    row.status !== 'accepted' ||
    row.namespace !== NMLS_NAMESPACE ||
    row.sourceIdentifier !== nmls ||
    row.jurisdiction !== 'US' ||
    row.nativeId !== nativeId
  ) {
    return { eligible: false, reason: 'identity_disagreement' };
  }
  return { eligible: true, id: row.id, networkEntityId: row.networkEntityId };
}

export type ParentResearchRow = {
  nativeId: string;
  savedRef: string;
  returnPath: string;
  projectRef: string | null;
  projectConflict: boolean;
  watchCreated: false;
};



type PublicationDenyReason = Extract<MarketplacePublication, { ok: false }>['reason'];
type BindingDenyReason = Extract<BindingDecision, { eligible: false }>['reason'];

export type ClickSaveResult = {
  device: DeviceProfileSaveResult['device'];
  parent: 'off' | 'saved' | 'already_saved' | 'denied';
  denyReason?: PublicationDenyReason | BindingDenyReason | 'sync_off' | 'signed_out' | 'page_closed';
  watchCreated: false;
  message: string;
  pending: true;
};

const parents = new Map<string, ParentResearchRow>();

export function listParentRows(): ParentResearchRow[] {
  return [...parents.values()];
}

export function resetParentRows(): void {
  parents.clear();
}

function message(parent: ClickSaveResult['parent'], signedIn: boolean): string {
  if (parent === 'saved' || parent === 'already_saved') return 'Saved';
  if (!signedIn) return 'Saved on this device. Sign in to My TrustHub to sync this lender.';
  return 'Saved on this device. My TrustHub sync is not on for this lender yet.';
}

export function clickProfileSave(input: {
  lenderSlug: string;
  lenderName: string;
  nmlsId?: string | null;
  profileClass?: string;
  catalog: readonly Lender[];
  bindings: readonly BindingRow[];
  signedIn: boolean;
  pageOpen: boolean;
  projectConflict?: boolean;
  gate?: OneClickGate;
}): ClickSaveResult {
  const gate = input.gate ?? productionParentGate();
  const device = deviceFirstProfileSave({
    lenderSlug: input.lenderSlug,
    lenderName: input.lenderName,
    nmlsId: input.nmlsId ?? undefined,
    profilePath: `/lenders/${input.lenderSlug}`,
  }).device;
  const base = {
    device,
    watchCreated: false as const,
    pending: true as const,
  };
  if (!device.ok) {
    return { ...base, parent: 'denied', denyReason: 'sync_off', message: 'Saved on this device' };
  }
  if (!input.signedIn) {
    return { ...base, parent: 'off', denyReason: 'signed_out', message: message('off', false) };
  }
  if (!input.pageOpen) {
    return { ...base, parent: 'denied', denyReason: 'page_closed', message: message('denied', true) };
  }
  if (!canaryAllows(input.lenderSlug, gate)) {
    return { ...base, parent: 'off', denyReason: 'sync_off', message: message('off', true) };
  }
  const published = assessMarketplaceProfile(input.lenderSlug, input.profileClass ?? LENDER_PROFILE_CLASS, input.catalog);
  if (!published.ok) {
    return { ...base, parent: 'denied', denyReason: published.reason, message: message('denied', true) };
  }
  const binding = classifyAskBinding(published.nativeId, input.bindings);
  if (!binding.eligible) {
    return { ...base, parent: 'denied', denyReason: binding.reason, message: message('denied', true) };
  }
  const existing = parents.get(published.nativeId);
  if (existing) {
    return { ...base, parent: 'already_saved', message: message('already_saved', true) };
  }
  parents.set(published.nativeId, {
    nativeId: published.nativeId,
    savedRef: `saved:${published.nativeId}`,
    returnPath: published.returnPath,
    projectRef: input.projectConflict ? null : null,
    projectConflict: Boolean(input.projectConflict),
    watchCreated: false,
  });
  return { ...base, parent: 'saved', message: message('saved', true) };
}

export function clickProfileUnsave(input: {
  lenderSlug: string;
  nmlsId?: string | null;
  gate?: OneClickGate;
  signedIn: boolean;
}): { removed: boolean; parentRemoved: boolean; watchCreated: false } {
  const gate = input.gate ?? productionParentGate();
  const removed = deviceFirstProfileUnsave({ lenderSlug: input.lenderSlug, nmlsId: input.nmlsId }).removed;
  const nativeId = lenderNativeId(input.nmlsId ?? '');
  const allowed = input.signedIn && nativeId && canaryAllows(input.lenderSlug, gate);
  const parentRemoved = Boolean(allowed && nativeId && parents.delete(nativeId));
  return { removed, parentRemoved, watchCreated: false };
}

/** After My TrustHub sign-in, one pending device Save is enough. No second click. */
export function completePendingAfterSignIn(input: {
  lenderSlug: string;
  lenderName: string;
  nmlsId?: string | null;
  catalog: readonly Lender[];
  bindings: readonly BindingRow[];
  pageOpen: boolean;
  gate?: OneClickGate;
}): ClickSaveResult {
  const pending = listPendingParentOps().some((row) => row.returnPath === `/lenders/${input.lenderSlug}` && row.action === 'save');
  if (!pending) {
    return clickProfileSave({ ...input, signedIn: true, profileClass: LENDER_PROFILE_CLASS });
  }
  return clickProfileSave({ ...input, signedIn: true, profileClass: LENDER_PROFILE_CLASS });
}
