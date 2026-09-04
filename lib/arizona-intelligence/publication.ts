/**
 * AZ-LEND-001 — Arizona state mortgage intelligence publication gate.
 * No Arizona county or city routes. No person-level MLO directory.
 * No fake live company denominator.
 */

export const ARIZONA_INTELLIGENCE_GATE = {
  path: '/arizona',
  robotsIndex: true,
  sitemap: true,
  title: 'Arizona Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research Arizona mortgage activity using 2025 HMDA, DIFI regulatory limits, NMLS verification, CFPB mortgage complaints, and statewide HOME Plus / Arizona Is Home programs. Independent research. Not a ranking, recommendation, or score.',
} as const;
