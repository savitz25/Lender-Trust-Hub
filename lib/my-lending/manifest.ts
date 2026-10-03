import { createHash } from 'node:crypto';

/** Positional digest for v2-3/selected-profiles/3. Field order matches Ask. */
export const TRANSFER_VERSION_V3 = 'v2-3/selected-profiles/3' as const;
export const RUNTIME_VERSION = 'v2-3/parent-runtime/1' as const;
export const PARENT_ORIGIN = 'https://www.asktrusthub.com';
export const LENDER_ORIGIN = 'https://www.lendertrusthub.com';
export const PARENT_API_PATH = '/api/my-trusthub/profile-save';
export const PARENT_FORM_PATH = '/my/profile-save';
export const SOURCE_PATH = PARENT_API_PATH + '/source';

export type LenderManifest = {
  version: typeof TRANSFER_VERSION_V3;
  sourceHub: 'lender';
  audience: 'ask';
  selected: Array<{
    localItemId: string;
    revision: string;
    digest: string;
    profile: { hub: 'lender'; nativeId: string; profileClass: 'marketplace_company' };
  }>;
  returnTask: {
    kind: 'profile';
    hub: 'lender';
    canonicalSlug: string;
    profile: { hub: 'lender'; nativeId: string; profileClass: 'marketplace_company' };
    returnPath: string;
  };
};

export function lenderItemDigest(nativeId: string, returnPath: string): string {
  return createHash('sha256').update(JSON.stringify([nativeId, returnPath])).digest('hex');
}

export function lenderManifest(slug: string, nativeId: string): LenderManifest {
  const returnPath = `/lenders/${slug}`;
  const profile = { hub: 'lender' as const, nativeId, profileClass: 'marketplace_company' as const };
  return {
    version: TRANSFER_VERSION_V3,
    sourceHub: 'lender',
    audience: 'ask',
    selected: [{ localItemId: slug, revision: '1', digest: lenderItemDigest(nativeId, returnPath), profile }],
    returnTask: { kind: 'profile', hub: 'lender', canonicalSlug: slug, profile, returnPath },
  };
}

export function manifestDigest(v: LenderManifest): string {
  const profileKey = (p: { hub: string; nativeId: string; profileClass: string }) => JSON.stringify([p.hub, p.nativeId, p.profileClass]);
  const task = [v.returnTask.kind, v.returnTask.hub, v.returnTask.canonicalSlug, v.returnTask.returnPath, profileKey(v.returnTask.profile)];
  return createHash('sha256').update(JSON.stringify([
    v.version, v.sourceHub, v.audience,
    v.selected.map((i) => [i.localItemId, i.revision, i.digest, i.profile.hub, i.profile.nativeId, i.profile.profileClass]),
    task,
  ])).digest('hex');
}
