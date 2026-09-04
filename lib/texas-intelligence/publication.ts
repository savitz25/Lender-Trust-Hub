/**
 * TX-LEND-001 — Texas state mortgage intelligence publication gate.
 * No Texas county routes. No person-level MLO directory.
 */

export const TEXAS_INTELLIGENCE_GATE = {
  path: '/texas',
  robotsIndex: true,
  sitemap: true,
  title: 'Texas Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research Texas mortgage activity using 2025 HMDA, Texas SML enforcement orders with exact NMLS identity, and current TDHCA/TSAHC homebuyer programs. Independent research. Not a ranking, recommendation, or score.',
} as const;
