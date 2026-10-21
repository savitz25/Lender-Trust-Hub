import { ISOLATED_ASK_ORIGIN, LENDER_PARENT_ORIGIN, handoffParentOrigin } from './handoff-form';
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
  /** Server-only. Never NEXT_PUBLIC. Sent only to the exact isolated Ask origin. */
  MY_TRUSTHUB_V23_PARENT_PROTECTION_BYPASS?: string;
};

const MOVE_PREVIEW = 'https://move-trust-hub-git-mth-v2-3-move-cur-0a05f1-savitz25-s-projects.vercel.app';
/** Retained parent-runtime Ask alias. It stays rejected as a Lender destination. */
const RETAINED_PARE_ASK_ORIGIN = 'https://conumers-trust-hub-git-mth-v2-3-pare-3127df-savitz25-s-projects.vercel.app';
/** Production hub registrable domains. Apex and every subdomain are rejected. */
const PRODUCTION_HUB_ROOTS = [
  'asktrusthub.com',
  'consumerstrusthub.com',
  'movetrusthub.com',
  'lendertrusthub.com',
  'insurancetrusthub.com',
  'contractortrusthub.com',
  'seniortrusthub.com',
  'investortrusthub.com',
] as const;

function productionHubHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return PRODUCTION_HUB_ROOTS.some(root => host === root || host.endsWith('.' + root));
}

/** One exact https origin for this Lender Preview. Production hub hosts, the
 * B4 Ask host, the retained pare Ask host, the Move preview host, wildcards,
 * credentials, queries, hashes and non-root paths are rejected. A missing
 * value stays closed.
 */
export function exactIsolatedLenderOrigin(value: string | undefined): string | null {
  if (!value || value !== value.trim() || value.includes('*')) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.protocol !== 'https:' || url.hostname.endsWith('.')) return null;
    if (productionHubHost(url.hostname)) return null;
    const pinnedPreview = new Set([
      new URL(PARENT_ORIGIN).hostname,
      new URL(LENDER_ORIGIN).hostname,
      new URL(ISOLATED_ASK_ORIGIN).hostname,
      new URL(RETAINED_PARE_ASK_ORIGIN).hostname,
      new URL(MOVE_PREVIEW).hostname,
      new URL(LENDER_PRODUCTION_PINS.lenderOrigin).hostname,
    ]);
    if (pinnedPreview.has(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** ProcessEnv has no PilotEnv fields in common with this type. Read the named
 * fields when a caller omits env. NEXT_PUBLIC_* stay direct property reads so
 * Next can substitute them at build, and the read stays at call time.
 */
export function pilotEnvFromProcess(): PilotEnv {
  return {
    NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: process.env.NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED,
    NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: process.env.NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS,
    MTH_LENDER_PARENT_SAVE_MODE: process.env.MTH_LENDER_PARENT_SAVE_MODE,
    VERCEL_ENV: process.env.VERCEL_ENV,
    MY_TRUSTHUB_V23_PARENT_ORIGIN: process.env.MY_TRUSTHUB_V23_PARENT_ORIGIN,
    MY_TRUSTHUB_V23_LENDER_ORIGIN: process.env.MY_TRUSTHUB_V23_LENDER_ORIGIN,
    MY_TRUSTHUB_V23_ISOLATED_PROJECT: process.env.MY_TRUSTHUB_V23_ISOLATED_PROJECT,
    NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN: process.env.NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN,
    MY_TRUSTHUB_V23_LENDER_KEY_ID: process.env.MY_TRUSTHUB_V23_LENDER_KEY_ID,
    MY_TRUSTHUB_V23_LENDER_SIGNING_PRIVATE_KEY_PEM: process.env.MY_TRUSTHUB_V23_LENDER_SIGNING_PRIVATE_KEY_PEM,
    MY_TRUSTHUB_V23_PARENT_PROTECTION_BYPASS: process.env.MY_TRUSTHUB_V23_PARENT_PROTECTION_BYPASS,
  };
}

function resolvePilotEnv(env?: PilotEnv): PilotEnv {
  return env ?? pilotEnvFromProcess();
}

/** Preview-only pins. Production mode and a missing lender origin stay closed. */
export function isolatedLenderPins(env?: PilotEnv): LenderPins | null {
  const source = resolvePilotEnv(env);
  if (source.VERCEL_ENV !== 'preview') return null;
  if (productionParentGate(source).enabled) return null;
  const lenderOrigin = exactIsolatedLenderOrigin(source.MY_TRUSTHUB_V23_LENDER_ORIGIN);
  if (!lenderOrigin || source.MY_TRUSTHUB_V23_PARENT_ORIGIN !== ISOLATED_ASK_ORIGIN) return null;
  if (source.MY_TRUSTHUB_V23_ISOLATED_PROJECT !== ISOLATED_PROJECT) return null;
  return {
    parentOrigin: ISOLATED_ASK_ORIGIN,
    lenderOrigin,
    project: ISOLATED_PROJECT,
    assertionEnvironment: 'isolated',
  };
}

export function isolatedPilotAdmits(slug: string, env?: PilotEnv): boolean {
  return slug === ISOLATED_PILOT_SLUG && isolatedLenderPins(env) !== null;
}

const ACCOUNT_SIGN_IN_PATH = '/my/sign-in';

/** Isolated-pilot deployment identity. The parent strings are not part of this check,
 * so a missing or unapproved parent cannot reclassify the pilot as production.
 */
export function isolatedPilotDeployment(env?: PilotEnv): boolean {
  const source = resolvePilotEnv(env);
  if (source.VERCEL_ENV !== 'preview') return false;
  if (productionParentGate(source).enabled) return false;
  if (!exactIsolatedLenderOrigin(source.MY_TRUSTHUB_V23_LENDER_ORIGIN)) return false;
  if (source.MY_TRUSTHUB_V23_ISOLATED_PROJECT !== ISOLATED_PROJECT) return false;
  return true;
}

/** Shared href for the profile sign-in anchor and the navbar account entry.
 * The isolated pilot returns the B4 Preview sign-in only when both parent values
 * are exactly that origin. Any other parent returns null: the account action is
 * unavailable and is not a production login. Every other deployment, including
 * actual production, keeps the production sign-in href.
 */
export function lenderAccountSignInDestination(env?: PilotEnv): string | null {
  const source = resolvePilotEnv(env);
  if (!isolatedPilotDeployment(source)) return LENDER_PARENT_ORIGIN + ACCOUNT_SIGN_IN_PATH;
  if (
    source.MY_TRUSTHUB_V23_PARENT_ORIGIN === ISOLATED_ASK_ORIGIN &&
    source.NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN === ISOLATED_ASK_ORIGIN
  ) {
    return ISOLATED_ASK_ORIGIN + ACCOUNT_SIGN_IN_PATH;
  }
  return null;
}


