/**
 * IMPLEMENTATION ORDER — execute top-to-bottom for fastest impact.
 * Each step is independent unless noted as (depends on #N).
 */

export const IMPLEMENTATION_ORDER = [
  {
    step: 1,
    task: 'Deploy current main branch to Vercel production',
    files: [],
    verify: 'https://www.lendertrusthub.com/fdic-insured-banks loads with map + state grid',
  },
  {
    step: 2,
    task: 'Submit sitemap to Google Search Console',
    files: ['app/sitemap.ts'],
    verify: 'GSC shows 55+ URLs indexed (hub + 51 FDIC states + core pages)',
  },
  {
    step: 3,
    task: 'Set NEXT_PUBLIC_GA4_ID in Vercel env and redeploy',
    files: ['components/directory/GtagProvider.tsx', 'app/layout.tsx'],
    verify: 'GA4 Realtime shows page_view events',
  },
  {
    step: 4,
    task: 'Mortgage state pages go live at /local-lenders/[state]',
    files: ['app/local-lenders/[state]/page.tsx', 'lib/mortgage/'],
    verify: '/local-lenders/florida returns 200 with lenders + cross-links to FDIC',
  },
  {
    step: 5,
    task: 'Internal link mesh — hub CrossVerticalNav on all directory pages',
    files: ['components/directory/CrossVerticalNav.tsx'],
    verify: 'Every state page links to sibling vertical in same state',
  },
  {
    step: 6,
    task: 'Content clusters published on national hubs',
    files: ['lib/directory/content-clusters.ts', 'components/directory/ContentClusterHub.tsx'],
    verify: 'Hub pages show topical cluster links for featured snippets',
  },
  {
    step: 7,
    task: 'Clone next vertical (auto/credit/MCA) — copy mortgage pattern',
    files: ['lib/directory/categories.ts', 'lib/directory/rollout.ts'],
    verify: 'New hub + [state] routes build successfully',
  },
] as const;