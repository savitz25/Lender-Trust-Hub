/**
 * WA-LEND-001 — Washington state mortgage intelligence publication gate.
 * No Washington county or city routes. No person-level MLO directory.
 * No fake live company denominator.
 */

export const WASHINGTON_INTELLIGENCE_GATE = {
  path: '/washington',
  robotsIndex: true,
  sitemap: true,
  title: 'Washington Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research Washington mortgage activity using 2025 HMDA, DFI Consumer Services enforcement with exact NMLS identity, and current WSHFC homebuyer programs. Independent research. Not a ranking, recommendation, or score.',
} as const;
