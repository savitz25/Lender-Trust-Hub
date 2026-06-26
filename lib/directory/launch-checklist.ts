/**
 * LAUNCH & GROWTH CHECKLIST — prioritized for organic dominance.
 * Import LAUNCH_CHECKLIST in admin tooling or track manually.
 * Full 30-day plan: lib/directory/growth-plan.ts → GROWTH_PLAN_30_DAY
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
  {
    priority: 'P0',
    category: 'Indexing',
    task: 'Request indexing for all 3 national hubs',
    action: 'GSC URL Inspection → /fdic-insured-banks, /local-lenders, /auto-loan-companies',
    done: false,
  },

  // P1 — Week 1 growth
  {
    priority: 'P1',
    category: 'Indexing',
    task: 'Request indexing for top 10 state pages (all verticals)',
    action: 'GSC URL Inspection → FL, TX, CA, NY, IL across FDIC + mortgage + auto',
    done: false,
  },
  {
    priority: 'P1',
    category: 'Internal Links',
    task: 'Link every lender profile → FDIC + mortgage + auto state pages',
    action: 'RelatedDirectoryLinks in app/lenders/[slug]/page.tsx',
    done: true,
  },
  {
    priority: 'P1',
    category: 'Content',
    task: 'Seed monitoring queries in GSC',
    action: 'Track: "FDIC insured banks [state]", "mortgage lenders [state] 2026", "auto loan companies [state]"',
    done: false,
  },
  {
    priority: 'P1',
    category: 'Conversion',
    task: 'A/B test LeadCaptureForm variants',
    action: 'Compare data-variant="state-page-v2" vs "hero-compact" vs "sidebar-minimal" in GA4',
    done: false,
  },
  {
    priority: 'P1',
    category: 'Vertical',
    task: 'Auto loan vertical live at /auto-loan-companies',
    action: 'Verify hub + state pages build; submit auto URLs to GSC',
    done: true,
  },

  // P2 — Month 1 authority
  {
    priority: 'P2',
    category: 'Content Clusters',
    task: 'Hub keyword sections + ContentClusterHub live',
    action: 'HUB_KEYWORD_SECTIONS on FDIC, mortgage, auto hubs',
    done: true,
  },
  {
    priority: 'P2',
    category: 'Vertical Expansion',
    task: 'Stage credit repair vertical',
    action: 'Follow VERTICAL_CLONE_GUIDE.creditRepair in growth-plan.ts',
    done: false,
  },
  {
    priority: 'P2',
    category: 'Vertical Expansion',
    task: 'Stage MCA vertical',
    action: 'Follow VERTICAL_CLONE_GUIDE.mca in growth-plan.ts',
    done: false,
  },
  {
    priority: 'P2',
    category: 'E-E-A-T',
    task: 'Editorial bylines on insights sections',
    action: 'EditorialByline component on state insights + auto listings',
    done: true,
  },
  {
    priority: 'P2',
    category: 'Performance',
    task: 'Target 98+ Lighthouse on directory pages',
    action: 'Preconnect GA4; ISR + CDN headers; lean client bundles',
    done: false,
  },
  {
    priority: 'P2',
    category: 'Growth',
    task: 'Execute 30-day growth plan',
    action: 'Import GROWTH_PLAN_30_DAY from lib/directory/growth-plan.ts',
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
  'auto loan companies in {state}',
  'best auto loan rates {state} 2026',
  'car loan lenders near me {state}',
  'how to verify FDIC insurance',
  'FDIC insurance limit 2026',
  'credit repair companies {state}',
  'merchant cash advance companies {state}',
] as const;

/** GA4 custom events to verify in Realtime */
export const GA4_EVENTS_TO_MONITOR = [
  'directory_lead_submit',
  'directory_cta_click',
  'directory_search',
  'directory_state_switch',
] as const;