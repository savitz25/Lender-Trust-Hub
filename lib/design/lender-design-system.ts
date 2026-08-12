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

/** Phase 2 — homepage hero (Wealth & Finance research layer) */
export const LENDER_HERO = {
  eyebrow: 'Lender Trust Hub  ·  Wealth & Finance',
  headline: 'Verify. Compare. Finance wisely.',
  support:
    'Independent research for lenders and financing options. We surface verified public data — including NMLS records — with no paid placements and no lead fees. You decide.',
  primaryCta: { label: 'Start your comparison', href: '/compare' },
  secondaryCta: { label: 'Explore calculators', href: '/calculators' },
  philosophy: 'We cite. You decide.',
  networkLine: 'The Wealth & Finance layer of the Ask Trust Hub network.',
  chips: [
    { id: 'nmls', label: 'NMLS verified data' },
    { id: 'independent', label: 'Independent research' },
    { id: 'no-paid', label: 'No paid placements' },
    { id: 'compare', label: 'Side-by-side comparisons' },
  ],
  searchTitle: 'Find local lenders',
  searchHint: 'Enter a ZIP to browse licensed lenders in your area.',
} as const;

/** Phase 3 — homepage sections below the hero */
export const LENDER_TOOLS = {
  eyebrow: 'Key tools',
  title: 'What you can do here',
  support:
    'Practical research tools for financing decisions — not a lead marketplace. Start where you need clarity.',
  items: [
    {
      id: 'compare',
      title: 'Compare lenders',
      description:
        'Review options side-by-side using public signals and research aids — not paid rankings or sponsored slots.',
      href: '/compare',
      cta: 'Start comparing',
    },
    {
      id: 'le-analyzer',
      title: 'Understand your Loan Estimate',
      description:
        'Enter key LE figures for educational fee context, points vs rate notes, and optional 2025 HMDA market data. No phone number required.',
      href: '/tools/loan-estimate-analyzer',
      cta: 'Analyze a Loan Estimate',
    },
    {
      id: 'le-compare',
      title: 'Compare Loan Estimates',
      description:
        'See how fees and terms differ across two or three offers — rate, origination, points, credits, and monthly P&I.',
      href: '/tools/compare-loan-estimates',
      cta: 'Compare offers side by side',
    },
    {
      id: 'local',
      title: 'Browse local lenders',
      description:
        'Explore licensed lenders by state and market coverage. Coverage is expanding — not every county is listed yet.',
      href: '/local-lenders',
      cta: 'Browse markets',
    },
    {
      id: 'programs',
      title: 'Program & assistance finder',
      description:
        'Educational FHA, VA, conventional, USDA, and down-payment assistance themes—no application form or eligibility decision.',
      href: '/tools/program-finder',
      cta: 'Explore programs',
    },
  ],
} as const;

export const LENDER_HOW_IT_WORKS = {
  eyebrow: 'How it works',
  title: 'Independent research, step by step',
  support:
    'A calm path from public data to your decision — with no pressure and no paid placements.',
  steps: [
    {
      step: '01',
      title: 'Start with verified public data',
      description:
        'Begin with directory listings and NMLS-related identifiers drawn from public sources we surface for research.',
    },
    {
      step: '02',
      title: 'Compare options side-by-side',
      description:
        'Use comparison tools and market pages to weigh public signals — never sponsored order or lead-fee ranking.',
    },
    {
      step: '03',
      title: 'Understand the numbers',
      description:
        'Run educational calculators for payments, affordability, and refinance scenarios before you commit.',
    },
    {
      step: '04',
      title: 'You decide',
      description:
        'Re-check licenses on NMLS Consumer Access, compare written offers yourself, and finance wisely. We cite. You decide.',
    },
  ],
} as const;

export const LENDER_TRUST = {
  eyebrow: 'Trust & methodology',
  title: 'Built for confidence — not conversion',
  support:
    'Lender Trust Hub is independent research only. We surface verified public sources so you can decide with clearer context.',
  pillars: [
    {
      title: 'Independent research only',
      body: 'We do not originate loans, sell ranking position, or operate as a lead marketplace.',
    },
    {
      title: 'Verified public sources',
      body: 'NMLS-related identifiers and other public signals are cited so you can re-check primary records yourself.',
    },
    {
      title: 'No paid placements or lead fees',
      body: 'Directory order and research aids are not sold. We do not collect lead fees for introductions.',
    },
    {
      title: 'Clear separation of roles',
      body: 'Research tools stay on this hub. Any external provider relationship is yours to evaluate — not ours to sell.',
    },
  ],
  primaryCta: { label: 'Read our methodology', href: '/methodology' },
  secondaryCta: {
    label: 'Independence Policy',
    href: 'https://www.asktrusthub.com/promise',
    external: true,
  },
  tertiaryCta: { label: 'About & Trust', href: '/about' },
  philosophy: 'We cite. You decide.',
  tagline: 'Finance wisely. Grow well.',
} as const;

export const LENDER_PATHWAYS = {
  eyebrow: 'Popular pathways',
  title: 'Where people start',
  support:
    'Jump into common markets, financing goals, or the tools you are most likely to need next.',
  markets: [
    { label: 'Florida', href: '/local-lenders/florida' },
    { label: 'California', href: '/local-lenders/california' },
    { label: 'Texas', href: '/local-lenders/texas' },
    { label: 'New York', href: '/local-lenders/new-york' },
    { label: 'Arizona', href: '/local-lenders/arizona' },
    { label: 'Illinois', href: '/local-lenders/illinois' },
  ],
  goals: [
    {
      label: 'Buy a home',
      href: '/local-lenders',
      detail: 'Browse local lenders for purchase research',
    },
    {
      label: 'Refinance',
      href: '/calculators',
      detail: 'Educational refinance and payment tools',
    },
    {
      label: 'See what I can afford',
      href: '/calculators',
      detail: 'Affordability and payment calculators',
    },
    {
      label: 'Compare options',
      href: '/compare',
      detail: 'Side-by-side lender research',
    },
  ],
  tools: [
    { label: 'Understand your Loan Estimate', href: '/tools/loan-estimate-analyzer' },
    { label: 'Compare offers side by side', href: '/tools/compare-loan-estimates' },
    { label: 'Explore programs', href: '/tools/program-finder' },
    { label: 'My Lending workspace', href: '/my-lending' },
    { label: 'Local lenders directory', href: '/local-lenders' },
    { label: 'Calculators', href: '/calculators' },
  ],
} as const;

export const LENDER_NETWORK_SECTION = {
  eyebrow: 'Ask Trust Hub network',
  title: 'Wealth & Finance within a wider research network',
  support:
    'Lender Trust Hub is the specialist finance layer. Ask is the parent knowledge layer; Move and Insurance cover their own verified domains under the same independence standard.',
  philosophy: 'We cite. You decide.',
} as const;

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
  {
    id: 'contractor' as const,
    label: 'Contractor Trust Hub',
    shortLabel: 'Contractor',
    href: 'https://www.contractortrusthub.com',
    blurb: 'Florida contractor license verification & project planning',
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
      { href: '/tools/loan-estimate-analyzer', label: 'Loan Estimate Analyzer' },
      { href: '/tools/compare-loan-estimates', label: 'Compare Loan Estimates' },
      { href: '/tools/program-finder', label: 'Program Finder' },
      { href: '/programs', label: 'FHA · VA · DPA Guides' },
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
