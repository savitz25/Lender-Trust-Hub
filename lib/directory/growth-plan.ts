/**
 * 30-DAY GROWTH EXECUTION PLAN — LenderTrustHub Activation Package
 * =================================================================
 * Import: import { GROWTH_PLAN_30_DAY, VERTICAL_CLONE_GUIDE } from '@/lib/directory/growth-plan'
 */

export interface GrowthDayAction {
  day: number;
  week: 1 | 2 | 3 | 4;
  priority: 'P0' | 'P1' | 'P2';
  category: string;
  action: string;
  metric: string;
}

/** Day-by-day execution plan — run top-to-bottom */
export const GROWTH_PLAN_30_DAY: GrowthDayAction[] = [
  // Week 1 — Launch & Index
  { day: 1, week: 1, priority: 'P0', category: 'SEO', action: 'Submit sitemap.xml to GSC; verify robots.txt', metric: 'GSC: sitemap processed, 0 errors' },
  { day: 1, week: 1, priority: 'P0', category: 'Analytics', action: 'Set NEXT_PUBLIC_GA4_ID in Vercel; redeploy', metric: 'GA4 Realtime: page_view events' },
  { day: 2, week: 1, priority: 'P0', category: 'Indexing', action: 'URL Inspection → Request indexing: /fdic-insured-banks, /local-lenders, /auto-loan-companies', metric: '3 hub pages indexed within 48h' },
  { day: 3, week: 1, priority: 'P1', category: 'Indexing', action: 'Request indexing: FL, TX, CA, NY, IL state pages (all 3 verticals)', metric: '15 priority URLs indexed' },
  { day: 4, week: 1, priority: 'P1', category: 'Monitoring', action: 'Add GSC performance filters for MONITORING_QUERIES templates', metric: 'Baseline impressions captured' },
  { day: 5, week: 1, priority: 'P1', category: 'Conversion', action: 'Review GA4 events: directory_lead_submit, directory_cta_click by variant', metric: 'Lead form CTR > 2%' },
  { day: 6, week: 1, priority: 'P2', category: 'Content', action: 'Share top 5 state pages on social / communities (no spam)', metric: '5 referral sessions in GA4' },
  { day: 7, week: 1, priority: 'P1', category: 'Performance', action: 'Run Lighthouse on 3 state pages; fix any LCP > 2.5s', metric: 'Performance score 95+' },

  // Week 2 — Authority mesh
  { day: 8, week: 2, priority: 'P1', category: 'Internal Links', action: 'Verify RelatedDirectoryLinks on all lender profiles', metric: '100% profiles link to 3 verticals' },
  { day: 9, week: 2, priority: 'P1', category: 'Indexing', action: 'Request indexing: remaining FDIC state pages (batch 10/day)', metric: '51 FDIC states indexed' },
  { day: 10, week: 2, priority: 'P1', category: 'Content Clusters', action: 'Audit hub ContentClusterHub links; add state-specific anchors where missing', metric: 'All clusters clickable from hubs' },
  { day: 11, week: 2, priority: 'P2', category: 'E-E-A-T', action: 'Confirm EditorialByline on insights sections; update reviewed date', metric: 'Bylines visible on state pages' },
  { day: 12, week: 2, priority: 'P1', category: 'Conversion', action: 'A/B: hero-compact vs default LeadCaptureForm — pick winner after 500 impressions', metric: 'Winner variant +20% submits' },
  { day: 13, week: 2, priority: 'P2', category: 'Auto Vertical', action: 'Add 5 more states to lib/auto/providers.ts; rebuild & deploy', metric: 'Auto hub: 15+ state pages' },
  { day: 14, week: 2, priority: 'P1', category: 'Monitoring', action: 'Week 2 GSC report: impressions, CTR, avg position for top 10 queries', metric: 'Document baseline in spreadsheet' },

  // Week 3 — Expand & optimize
  { day: 15, week: 3, priority: 'P1', category: 'Content', action: 'Add county cross-links from mortgage state pages with highest traffic', metric: 'Top 5 states: county grid live' },
  { day: 16, week: 3, priority: 'P2', category: 'Vertical Prep', action: 'Stage credit repair: copy auto pattern → lib/credit-repair/', metric: 'Build passes with live: false' },
  { day: 17, week: 3, priority: 'P2', category: 'Vertical Prep', action: 'Stage MCA: copy auto pattern → lib/mca/', metric: 'Build passes with live: false' },
  { day: 18, week: 3, priority: 'P1', category: 'SEO', action: 'Request indexing: auto state pages for all live states', metric: 'Auto vertical fully indexed' },
  { day: 19, week: 3, priority: 'P2', category: 'Backlinks', action: 'Outreach: 3 local finance blogs — offer data citation from state insights', metric: '1+ referring domain' },
  { day: 20, week: 3, priority: 'P1', category: 'Conversion', action: 'Deploy winning lead form variant site-wide', metric: 'Lead submits +30% vs week 1' },
  { day: 21, week: 3, priority: 'P1', category: 'Performance', action: 'Vercel Speed Insights review; optimize any CLS regressions', metric: 'CLS < 0.1 on directory pages' },

  // Week 4 — Compound growth
  { day: 22, week: 4, priority: 'P1', category: 'Launch', action: 'Flip CREDIT_REPAIR_CATEGORY live: true; deploy /credit-repair/[state]', metric: 'Credit repair hub live' },
  { day: 23, week: 4, priority: 'P2', category: 'Launch', action: 'Flip MCA_CATEGORY live: true when data ready', metric: 'MCA hub live' },
  { day: 24, week: 4, priority: 'P1', category: 'Content', action: 'Publish calculator → directory cross-links on all calc pages', metric: 'Calc pages link to 2+ hubs' },
  { day: 25, week: 4, priority: 'P1', category: 'Monitoring', action: 'GSC: compare week 4 vs week 1 impressions by vertical', metric: 'Impressions +50% vs baseline' },
  { day: 26, week: 4, priority: 'P2', category: 'Auto Data', action: 'Import real auto lender CSV → lib/auto/data/{state}.json', metric: '20+ states with real data' },
  { day: 27, week: 4, priority: 'P1', category: 'Conversion', action: 'PersonalizedBanner A/B: mortgage-state-v1 vs fdic-state-v1 winners', metric: 'CTA click rate documented' },
  { day: 28, week: 4, priority: 'P2', category: 'Authority', action: 'Update about page with methodology + data sources', metric: 'E-E-A-T audit pass' },
  { day: 29, week: 4, priority: 'P1', category: 'SEO', action: 'Resubmit sitemap after new verticals; confirm URL count in GSC', metric: 'Sitemap URL count matches build' },
  { day: 30, week: 4, priority: 'P0', category: 'Review', action: '30-day retrospective: traffic, leads, index coverage, Lighthouse scores', metric: 'Written report + next-month plan' },
];

/** Step-by-step clone guide for credit repair and MCA */
export const VERTICAL_CLONE_GUIDE = {
  creditRepair: {
    categoryId: 'credit-repair',
    hubPath: '/credit-repair',
    statePath: '/credit-repair/[state]',
    libFolder: 'lib/credit-repair',
    cloneFrom: 'lib/auto',
    appFolder: 'app/credit-repair',
    steps: [
      '1. Uncomment CREDIT_REPAIR_CATEGORY in lib/directory/categories.ts; set live: true when ready',
      '2. cp -r lib/auto/* lib/credit-repair/ — rename types (CreditRepairProvider)',
      '3. cp app/auto-loan-companies/page.tsx → app/credit-repair/page.tsx',
      '4. cp app/auto-loan-companies/[state]/page.tsx → app/credit-repair/[state]/page.tsx',
      '5. Find-replace: AUTO_CATEGORY → CREDIT_REPAIR_CATEGORY, auto → credit-repair',
      '6. Update LeadCaptureForm copy keys for categoryId="credit-repair"',
      '7. Add hub + state URLs to app/sitemap.ts',
      '8. Add /credit-repair/* Cache-Control in next.config.ts',
      '9. Add to CrossVerticalNav + Navbar dropdown',
      '10. npm run build && git push',
    ],
    seoKeywords: [
      'credit repair companies {state}',
      'best credit repair {state} 2026',
      'legitimate credit repair services',
    ],
    estimatedMinutes: 5,
  },
  mca: {
    categoryId: 'mca',
    hubPath: '/mca-companies',
    statePath: '/mca-companies/[state]',
    libFolder: 'lib/mca',
    cloneFrom: 'lib/auto',
    appFolder: 'app/mca-companies',
    steps: [
      '1. Uncomment MCA_CATEGORY in lib/directory/categories.ts; set live: true when ready',
      '2. cp -r lib/auto/* lib/mca/ — rename types (MCAProvider)',
      '3. cp app/auto-loan-companies/* app/mca-companies/',
      '4. Find-replace: AUTO_CATEGORY → MCA_CATEGORY, auto → mca',
      '5. Customize schema: FinancialService + areaServed per state',
      '6. Add MCA-specific FAQ schema (factor rates, holdback, UCC filings)',
      '7. sitemap + next.config + Navbar + CrossVerticalNav',
      '8. npm run build && deploy',
    ],
    seoKeywords: [
      'merchant cash advance companies {state}',
      'MCA lenders {state}',
      'business cash advance directory',
    ],
    estimatedMinutes: 5,
  },
} as const;