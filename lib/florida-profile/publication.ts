/**
 * FL-LEND-006 — Florida company profile publication gate.
 * All projections remain internal. QA renderer fails closed in production.
 */

export const FLORIDA_PROFILE_CONTRACT = 'fl-lend-provider-v1' as const;

export const FLORIDA_PROFILE_GATE = {
  contractVersion: FLORIDA_PROFILE_CONTRACT,
  robotsIndex: false,
  sitemap: false,
  publicRoutes: false,
  profilesPublished: 0,
} as const;

export const FLORIDA_PROFILE_QA_GATE = {
  /** Keep false. Preview/internal renderer 404s unless explicitly enabled AND not production. */
  enabled: false as boolean,
  pathPrefix: '/internal/florida-profile',
};

export function floridaProfileQaAllowed(env: {
  nodeEnv?: string;
  vercelEnv?: string;
} = {}): boolean {
  const vercel = env.vercelEnv ?? process.env.VERCEL_ENV ?? '';
  const node = env.nodeEnv ?? process.env.NODE_ENV ?? '';
  if (vercel === 'production' || node === 'production') return false;
  return FLORIDA_PROFILE_QA_GATE.enabled === true;
}
