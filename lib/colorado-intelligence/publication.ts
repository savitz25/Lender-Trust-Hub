/**
 * CO-LEND-001A — Colorado state mortgage intelligence publication gate.
 * No Colorado county or Denver routes. No person-level MLO directory.
 * No fake live company denominator.
 */

export const COLORADO_INTELLIGENCE_GATE = {
  path: '/colorado',
  robotsIndex: true,
  sitemap: true,
  title: 'Colorado Mortgage & Lending Intelligence | LenderTrustHub',
  description:
    'Research Colorado mortgage activity using 2025 HMDA, DRE Mortgage Loan Originator licensing, NMLS company-registration verification, CFPB mortgage complaints, and CHFA homebuyer resources. Independent research. Not a ranking, recommendation, or score.',
} as const;
