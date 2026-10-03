import { randomBytes } from 'node:crypto';
import type { Lender } from '../mockData';
import { assessMarketplaceProfile, canaryAllows, type OneClickGate } from './one-click';
import { ASSERTION_HEADER, signLenderAssertion, type AssertionKey } from './lender-assertion';
import {
  PARENT_API_PATH,
  PARENT_FORM_PATH,
  PARENT_ORIGIN,
  RUNTIME_VERSION,
  lenderManifest,
  manifestDigest,
  type LenderManifest,
} from './manifest';
import type { HandoffIntent } from './handoff-form';

export type StageRequest = {
  slug: string;
  intent: HandoffIntent;
  pageOpen: boolean;
  signedIn: boolean;
  gate: OneClickGate;
  profileClass?: string;
  claimedNmls?: string | null;
  claimedReturnPath?: string | null;
  claimedEntityId?: string | null;
  claimedName?: string | null;
};

export type ParentResult = {
  transferRef?: string;
  manifestDigest?: string;
  continuationRef?: string;
  expiresAt?: number;
};

export type ParentResponse = { ok: true; operation: string; result: ParentResult } | { ok: false };

export type StageDeps = {
  catalog: readonly Lender[];
  now?: () => number;
  key?: AssertionKey | null;
  parent?: (call: { operation: string; body: string; assertion: string }) => Promise<ParentResponse>;
  browserBinding?: string;
};

export type StageResult =
  | { state: 'local_only'; reason: string; watchCreated: false; parentSync: 'off' }
  | {
      state: 'continue';
      target: string;
      continuationRef: string;
      intent: HandoffIntent;
      watchCreated: false;
      parentSync: 'staged';
    };

const local = (reason: string): StageResult => ({ state: 'local_only', reason, watchCreated: false, parentSync: 'off' });
const opaque = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);

function digits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** Production signer. A parent origin other than the pin returns no client. */
export function productionHandoffDeps(env: NodeJS.ProcessEnv = process.env): Pick<StageDeps, 'key' | 'parent'> {
  const kid = env.MY_TRUSTHUB_V23_LENDER_KEY_ID?.trim() ?? '';
  const pem = env.MY_TRUSTHUB_V23_LENDER_SIGNING_PRIVATE_KEY_PEM ?? '';
  const configured = env.MY_TRUSTHUB_V23_PARENT_ORIGIN?.trim();
  if (configured && configured !== PARENT_ORIGIN) return {};
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(kid) || !pem.includes('PRIVATE KEY')) return {};
  const key = { kid, pem };
  return {
    key,
    parent: async (call) => {
      const response = await fetch(PARENT_ORIGIN + PARENT_API_PATH, {
        method: 'POST',
        body: call.body,
        headers: { 'content-type': 'application/json', [ASSERTION_HEADER]: call.assertion },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return { ok: false };
      const body = await response.json() as { ok?: boolean; operation?: string; result?: ParentResult };
      if (!body || body.ok !== true || typeof body.operation !== 'string' || !body.result) return { ok: false };
      return { ok: true, operation: body.operation, result: body.result };
    },
  };
}

export async function stageParentHandoff(input: StageRequest, deps: StageDeps): Promise<StageResult> {
  if (!input.pageOpen) return local('page_closed');
  if (!canaryAllows(input.slug, input.gate)) return local('sync_off');
  const published = assessMarketplaceProfile(input.slug, input.profileClass ?? 'marketplace_company', deps.catalog);
  if (!published.ok) return local(published.reason);
  if (input.claimedNmls && digits(input.claimedNmls) !== published.nmls) return local('tampered_nmls');
  if (input.claimedReturnPath && input.claimedReturnPath !== published.returnPath) return local('tampered_return');
  if (input.claimedEntityId) return local('tampered_identity');
  if (input.claimedName) return local('tampered_name');
  if (!deps.key || !deps.parent) return local('unsigned');
  const now = deps.now?.() ?? Date.now();
  const browser = deps.browserBinding ?? randomBytes(32).toString('base64url');
  if (!opaque(browser)) return local('unsigned');
  const manifest = lenderManifest(published.slug, published.nativeId);
  const intent: HandoffIntent = !input.signedIn && input.intent === 'save' ? 'save_signin' : input.intent;
  try {
    const staged = await postParent(deps, 'prepareGuestProfileTransfer', manifest, browser, now);
    if (!staged || staged.manifestDigest !== manifestDigest(manifest) || !opaque(staged.transferRef)) return local('unavailable');
    if (!Number.isFinite(staged.expiresAt) || (staged.expiresAt ?? 0) <= now) return local('unavailable');
    const continuation = await postParent(deps, 'prepareProfileSaveContinuation', {
      sourceHub: 'lender',
      audience: 'ask',
      transferRef: staged.transferRef,
      manifestDigest: staged.manifestDigest,
    }, browser, now);
    if (!continuation || !opaque(continuation.continuationRef)) return local('unavailable');
    if (!Number.isFinite(continuation.expiresAt) || (continuation.expiresAt ?? 0) <= now || (continuation.expiresAt ?? 0) > (staged.expiresAt ?? 0)) {
      return local('unavailable');
    }
    return {
      state: 'continue',
      target: PARENT_ORIGIN + PARENT_FORM_PATH,
      continuationRef: continuation.continuationRef,
      intent,
      watchCreated: false,
      parentSync: 'staged',
    };
  } catch {
    return local('unavailable');
  }
}

async function postParent(
  deps: StageDeps,
  operation: 'prepareGuestProfileTransfer' | 'prepareProfileSaveContinuation',
  input: LenderManifest | { sourceHub: 'lender'; audience: 'ask'; transferRef: string; manifestDigest: string },
  browser: string,
  now: number,
): Promise<ParentResult | null> {
  if (!deps.key || !deps.parent) return null;
  const body = JSON.stringify({ version: RUNTIME_VERSION, operation, input });
  const assertion = signLenderAssertion(deps.key, 'lender', PARENT_ORIGIN + PARENT_API_PATH, 'transfer:stage', Buffer.from(body), browser, null, null, now);
  if (!assertion) return null;
  const response = await deps.parent({ operation, body, assertion });
  if (!response.ok || response.operation !== operation) return null;
  return response.result;
}
