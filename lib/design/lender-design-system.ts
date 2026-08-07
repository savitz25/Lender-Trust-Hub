/**
 * Lender Trust Hub — Master Design System (Phase 1).
 * Wealth & Finance layer of the Ask Trust Hub network.
 *
 * CSS variables: app/globals.css (:root / [data-hub="lender"]).
 */

export const LENDER_BRAND = {
  /** Deep Emerald Teal — primary CTAs, active nav, focus */
  teal: '#0D9488',
  /** Forest Green — hover / growth */
  forest: '#059669',
  forestDeep: '#047857',
  /** Soft Gold — rate callouts, high-value accents (sparingly) */
  gold: '#F59E0B',
  /** Deep Navy — primary text, footer */
  navy: '#0A2540',
  /** High-contrast body */
  ink: '#1E293B',
  canvas: '#F8FAFC',
  white: '#FFFFFF',
  border: '#E2E8F0',
  onNavyMuted: '#94A3B8',
  onNavySoft: '#CBD5E1',
  /** Soft teal wash for tags/surfaces */
  tealSoft: '#CCFBF1',
} as const;

export const LENDER_RADIUS = {
  card: '0.75rem',
  cardLg: '1rem',
  pill: '9999px',
  control: '0.5rem',
} as const;

export const LENDER_SHADOW = {
  soft: '0 1px 2px rgb(10 37 64 / 0.04), 0 4px 16px rgb(10 37 64 / 0.05)',
  card: '0 1px 2px rgb(10 37 64 / 0.05), 0 8px 24px rgb(10 37 64 / 0.07)',
  teal: '0 6px 20px -6px rgb(13 148 136 / 0.35)',
} as const;

export const LENDER_SPACE = {
  unit: 8,
} as const;

export const LENDER_TAGLINE = 'WHAT ARE YOU TRYING TO ACCOMPLISH?';

export const LENDER_INDEPENDENCE_LINE =
  'Independent research — no paid placements, no lead fees.';

/**
 * Primary header nav (finance research IA).
 * Switch Hub is a separate control.
 */
export const LENDER_HEADER_NAV = [
  { href: '/local-lenders', label: 'Local Lenders' },
  { href: '/compare', label: 'Compare rates' },
  { href: '/calculators', label: 'Calculators' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'Trust' },
] as const;

export const LENDER_HEADER_CTA = {
  label: 'Calculators',
  href: '/calculators',
} as const;

/** Network switcher + footer network (sibling hubs + parent Ask) */
export const LENDER_NETWORK_LINKS = [
  {
    id: 'ask' as const,
    label: 'Ask Trust Hub',
    shortLabel: 'Ask',
    href: 'https://www.asktrusthub.com',
    blurb: 'Parent knowledge & concierge layer',
  },
  {
    id: 'move' as const,
    label: 'Move Trust Hub',
    shortLabel: 'Move',
    href: 'https://www.movetrusthub.com',
    blurb: 'FMCSA movers & local guides',
  },
  {
    id: 'insurance' as const,
    label: 'Insurance Trust Hub',
    shortLabel: 'Insurance',
    href: 'https://www.insurancetrusthub.com',
    blurb: 'Licensed agencies & plans',
  },
] as const;

export const LENDER_FOOTER_COLUMNS = [
  {
    title: 'Research',
    links: [
      { href: '/local-lenders', label: 'Local Lenders' },
      { href: '/fdic-insured-banks', label: 'FDIC Banks' },
      { href: '/auto-loan-companies', label: 'Auto Loan Companies' },
      { href: '/compare', label: 'Compare Lenders' },
      { href: '/calculators', label: 'Calculators' },
      { href: '/my-lending', label: 'My Lending' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { href: '/methodology', label: 'Methodology' },
      { href: '/about', label: 'About & Trust' },
      { href: 'https://www.asktrusthub.com/promise', label: 'Independence Policy', external: true },
      { href: 'https://www.asktrusthub.com/trust', label: 'Trust Center', external: true },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
    ],
  },
] as const;
