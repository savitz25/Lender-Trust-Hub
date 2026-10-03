import type { Lender } from '../mockData';
import { assessMarketplaceProfile } from './one-click';
import { cleanNmlsId } from '../verification/nmls';
import { isCanonicalLenderProfile } from '../verification/entity-identity';
import {
  ASSERTION_HEADER,
  verifyLenderAssertion,
  type AssertionKey,
  type NonceStore,
} from './lender-assertion';
import { LENDER_ORIGIN, SOURCE_PATH, lenderManifest, manifestDigest, type LenderManifest } from './manifest';

const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};
const reply = (body: unknown, status: number) => Response.json(body, { status, headers });
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exact = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
const opaque = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{43}$/.test(v);

export type LenderPublication = {
  identity: { hub: 'lender'; nativeId: string; profileClass: 'marketplace_company' };
  canonicalSlug: string;
  publicationState: 'PUBLISHABLE';
  reviewedClass: 'marketplace_company';
  checkedAt: number;
};

/** Catalog identity only. A posted slug, name, or network id is not consulted. */
export function lenderPublication(nativeId: string, catalog: readonly Lender[], now = Date.now()): LenderPublication | null {
  const nmls = /^nmls:([1-9][0-9]{2,11})$/.exec(nativeId)?.[1];
  if (!nmls) return null;
  const canonical = catalog.filter((row) => cleanNmlsId(row.nmlsId) === nmls && isCanonicalLenderProfile(row, [...catalog]));
  if (canonical.length !== 1) return null;
  const assessed = assessMarketplaceProfile(canonical[0]!.slug, 'marketplace_company', catalog);
  if (!assessed.ok || assessed.nativeId !== nativeId || assessed.slug !== canonical[0]!.slug) return null;
  return {
    identity: { hub: 'lender', nativeId, profileClass: 'marketplace_company' },
    canonicalSlug: assessed.slug,
    publicationState: 'PUBLISHABLE',
    reviewedClass: 'marketplace_company',
    checkedAt: now,
  };
}

function sameManifest(posted: unknown, rebuilt: LenderManifest): boolean {
  if (!object(posted)) return false;
  try { return manifestDigest(posted as LenderManifest) === manifestDigest(rebuilt); } catch { return false; }
}

export async function handleLenderSource(
  request: Request,
  options: { catalog: readonly Lender[]; key: AssertionKey | null; nonces: NonceStore; now?: () => number },
): Promise<Response> {
  if (!options.key) return reply({ ok: false, error: 'unavailable' }, 503);
  const url = new URL(request.url);
  if (request.method !== 'POST') return reply({ ok: false, error: 'invalid' }, 405);
  if (url.origin !== LENDER_ORIGIN || url.pathname !== SOURCE_PATH || url.search) return reply({ ok: false, error: 'invalid' }, 400);
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') return reply({ ok: false, error: 'invalid' }, 400);
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > 131072) return reply({ ok: false, error: 'invalid' }, 413);
  let body: unknown;
  try { body = JSON.parse(bytes.toString('utf8')); } catch { return reply({ ok: false, error: 'invalid' }, 400); }
  if (!object(body) || typeof body.action !== 'string') return reply({ ok: false, error: 'invalid' }, 400);
  const now = options.now?.() ?? Date.now();
  const proof = new Request(request.url, { method: 'POST', headers: request.headers, body: bytes });
  try {
    if (body.action === 'resolve' && exact(body, ['action', 'profile']) && object(body.profile) && exact(body.profile, ['hub', 'nativeId', 'profileClass'])) {
      await verifyLenderAssertion(proof, bytes, options.key, 'ask', 'source:read', options.nonces, now);
      if (body.profile.hub !== 'lender' || body.profile.profileClass !== 'marketplace_company' || typeof body.profile.nativeId !== 'string') {
        return reply({ ok: false, error: 'unavailable' }, 503);
      }
      const result = lenderPublication(body.profile.nativeId, options.catalog, now);
      return result ? reply({ ok: true, result }, 200) : reply({ ok: false, error: 'unavailable' }, 503);
    }
    if (body.action === 'source' && exact(body, ['action', 'continuationRef', 'transferRef', 'manifest', 'manifestDigest', 'expiresAt'])) {
      const claims = await verifyLenderAssertion(proof, bytes, options.key, 'ask', 'source:read', options.nonces, now);
      if (!opaque(body.continuationRef) || !opaque(body.transferRef) || typeof body.manifestDigest !== 'string') return reply({ ok: false, error: 'unauthorized' }, 403);
      if (typeof body.expiresAt !== 'number' || body.expiresAt <= now || body.expiresAt > now + 600_000) return reply({ ok: false, error: 'unauthorized' }, 403);
      const posted = body.manifest;
      if (!object(posted) || !object(posted.returnTask) || typeof posted.returnTask.canonicalSlug !== 'string') return reply({ ok: false, error: 'unauthorized' }, 403);
      const assessed = assessMarketplaceProfile(posted.returnTask.canonicalSlug, 'marketplace_company', options.catalog);
      if (!assessed.ok) return reply({ ok: false, error: 'unauthorized' }, 403);
      const rebuilt = lenderManifest(assessed.slug, assessed.nativeId);
      if (!sameManifest(posted, rebuilt) || manifestDigest(rebuilt) !== body.manifestDigest) return reply({ ok: false, error: 'unauthorized' }, 403);
      return reply({
        ok: true,
        result: {
          continuationRef: body.continuationRef,
          transferRef: body.transferRef,
          manifest: rebuilt,
          manifestDigest: body.manifestDigest,
          browserProof: claims.browser,
          expiresAt: body.expiresAt,
          requestPrefix: claims.browser,
        },
      }, 200);
    }
    if (body.action === 'acknowledge' && exact(body, ['action', 'continuationRef', 'receipts']) && Array.isArray(body.receipts)) {
      const claims = await verifyLenderAssertion(proof, bytes, options.key, 'ask', 'source:ack', options.nonces, now);
      if (!opaque(body.continuationRef) || body.receipts.length !== 1) return reply({ ok: false, error: 'unauthorized' }, 403);
      const receipt = body.receipts[0];
      if (!object(receipt) || receipt.localCopy !== 'keep' || !object(receipt.parent) || !object(receipt.item)) return reply({ ok: false, error: 'unauthorized' }, 403);
      if (!['saved', 'already_saved', 'local_only'].includes(String(receipt.parent.outcome))) return reply({ ok: false, error: 'unauthorized' }, 403);
      if (typeof receipt.requestKey !== 'string' || !receipt.requestKey.startsWith(claims.browser + ':')) return reply({ ok: false, error: 'unauthorized' }, 403);
      const item = receipt.item;
      if (!object(item) || !object(item.profile) || typeof item.profile.nativeId !== 'string' || !lenderPublication(item.profile.nativeId, options.catalog, now)) {
        return reply({ ok: false, error: 'unauthorized' }, 403);
      }
      if ('watch' in receipt || 'watchCreated' in receipt) return reply({ ok: false, error: 'unauthorized' }, 403);
      return reply({ ok: true, result: { watchCreated: false } }, 200);
    }
    return reply({ ok: false, error: 'invalid' }, 400);
  } catch {
    return reply({ ok: false, error: 'unauthorized' }, 403);
  }
}

export { ASSERTION_HEADER };
