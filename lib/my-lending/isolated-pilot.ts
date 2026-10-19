import { ISOLATED_ASK_ORIGIN, handoffParentOrigin } from './handoff-form';
import { LENDER_PRODUCTION_PINS, type LenderPins } from './lender-assertion';
import { LENDER_ORIGIN, PARENT_ORIGIN } from './manifest';
import { productionParentGate, type ReleaseEnv } from './one-click';

export { ISOLATED_ASK_ORIGIN, handoffParentOrigin };
export const ISOLATED_PROJECT = 'xkkiicsassizmakcvxml';
/** Proposed journey profile. This does not add it to the production canary. */
export const ISOLATED_PILOT_SLUG = 'freedom-mortgage';

export type PilotEnv = ReleaseEnv & {
  VERCEL_ENV?: string;
  MY_TRUSTHUB_V23_PARENT_ORIGIN?: string;
  MY_TRUSTHUB_V23_LENDER_ORIGIN?: string;
  MY_TRUSTHUB_V23_ISOLATED_PROJECT?: string;
  NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN?: string;
  MY_TRUSTHUB_V23_LENDER_KEY_ID?: string;
  MY_TRUSTHUB_V23_LENDER_SIGNING_PRIVATE_KEY_PEM?: string;
};

/** One exact https origin. Production hosts, the Ask preview host, wildcards,
 * credentials, queries, hashes and non-root paths are rejected. */
export function exactIsolatedLenderOrigin(value: string | undefined): string | null {
  if (!value || value !== value.trim() || value.includes('*')) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.protocol !== 'https:' || url.hostname.endsWith('.')) return null;
    const forbidden = new Set([
      new URL(PARENT_ORIGIN).hostname,
      new URL(LENDER_ORIGIN).hostname,
      new URL(ISOLATED_ASK_ORIGIN).hostname,
      new URL(LENDER_PRODUCTION_PINS.lenderOrigin).hostname,
    ]);
    if (forbidden.has(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Preview-only pins. Production mode and a missing lender origin stay closed. */
export function isolatedLenderPins(env: PilotEnv = process.env): LenderPins | null {
  if (env.VERCEL_ENV !== 'preview') return null;
  if (productionParentGate(env).enabled) return null;
  const lenderOrigin = exactIsolatedLenderOrigin(env.MY_TRUSTHUB_V23_LENDER_ORIGIN);
  if (!lenderOrigin || env.MY_TRUSTHUB_V23_PARENT_ORIGIN !== ISOLATED_ASK_ORIGIN) return null;
  if (env.MY_TRUSTHUB_V23_ISOLATED_PROJECT !== ISOLATED_PROJECT) return null;
  return {
    parentOrigin: ISOLATED_ASK_ORIGIN,
    lenderOrigin,
    project: ISOLATED_PROJECT,
    assertionEnvironment: 'isolated',
  };
}

export function isolatedPilotAdmits(slug: string, env: PilotEnv = process.env): boolean {
  return slug === ISOLATED_PILOT_SLUG && isolatedLenderPins(env) !== null;
}


