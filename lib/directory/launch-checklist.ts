/**
 * LAUNCH & GROWTH CHECKLIST — prioritized for organic dominance.
 * Import LAUNCH_CHECKLIST in admin tooling or track manually.
 */

export type ChecklistPriority = 'P0' | 'P1' | 'P2';

export interface LaunchChecklistItem {
  priority: ChecklistPriority;
  category: string;
  task: string;
  action: string;
  done: boolean;
}

export const LAUNCH_CHECKLIST: LaunchChecklistItem[] = [
  // P0 — Launch blockers
  {
    priority: 'P0',
    category: 'SEO',
    task: 'Submit sitemap.xml to Google Search Console',
    action: 'https://www.lendertrusthub.com/sitemap.xml → GSC → Sitemaps → Submit',
    done: false,
  },
  {
    priority: 'P0',
    category: 'SEO',
    task: 'Verify robots.txt allows crawling',
    action: 'Visit /robots.txt — confirm Allow: / and sitemap URL',
    done: false,
  },
  {
    priority: 'P0',
    category: 'Performance',
    task: 'Enable Vercel Speed Insights + Web Analytics',
    action: 'Vercel dashboard → Project → Speed Insights → Enable',
    done: false,
  },
  {
    priority: 'P0',
    category: 'Analytics',
    task: 'Configure GA4 property + NEXT_PUBLIC_GA4_ID',
    action: 'Create GA4 stream → add env var in Vercel → redeploy',
    done: false,
  },
  // P1 — Week 1 growth
  {
    priority: 'P1',
    category: 'SEO',
    task: 'Request indexing for top 10 state pages',
    action: 'GSC URL Inspection → fdic-insured-banks/florida, texas, california, etc.',
    done: false,
  },
  {
    priority: 'P1',
    category: 'Internal Links',
    task: 'Link every lender profile → state FDIC + mortgage pages',
    action: 'Add Related Resources block in app/lenders/[slug]/page.tsx',
    done: false,
  },
  {
    priority: 'P1',
    category: 'Content',
    task: 'Seed monitoring queries in GSC',
    action: 'Track: "FDIC insured banks [state]", "mortgage lenders [state] 2026"',
    done: false,
  },
  {
    priority: 'P1',
    category: 'Conversion',
    task: 'A/B test LeadCaptureForm variants',
    action: 'Compare data-variant="state-page-v2" vs "hero-compact" in GA4',
    done: false,
  },
  // P2 — Month 1 authority
  {
    priority: 'P2',
    category: 'Content Clusters',
    task: 'Publish calculator → directory cross-links',
    action: 'Each calculator page links to relevant state FDIC + mortgage hubs',
    done: false,
  },
  {
    priority: 'P2',
    category: 'Vertical Expansion',
    task: 'Launch auto loan state pages',
    action: 'Clone lib/mortgage/ → lib/auto/ using AUTO_CATEGORY config',
    done: false,
  },
  {
    priority: 'P2',
    category: 'E-E-A-T',
    task: 'Add author/byline to educational sections',
    action: 'LenderTrustHub Editorial Team + last-reviewed date on insights',
    done: false,
  },
  {
    priority: 'P2',
    category: 'Performance',
    task: 'Target 98+ Lighthouse on FDIC state pages',
    action: 'Vercel Speed Insights → fix LCP/CLS regressions; keep client bundle lean',
    done: false,
  },
];

/** Featured snippet target queries — optimize H2/FAQ for these */
export const MONITORING_QUERIES = [
  'FDIC insured banks in {state}',
  'list of FDIC banks in {state} 2026',
  'best FDIC banks in {state}',
  'mortgage lenders in {state}',
  'NMLS verified mortgage brokers {state}',
  'how to verify FDIC insurance',
  'FDIC insurance limit 2026',
] as const;