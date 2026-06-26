/**
 * MASTER ROLLOUT GUIDE — LenderTrustHub Directory Platform (Definitive)
 * ====================================================================
 */

export const ROLLOUT_GUIDE = `
IMPLEMENTATION ORDER (execute sequentially):
  See lib/directory/implementation-order.ts → IMPLEMENTATION_ORDER array

PHASE 1 — FDIC (✓ COMPLETE)
  • 51 state SSG pages at /fdic-insured-banks/[state]
  • National hub with map + region grid + content clusters
  • Full JSON-LD graph per page

PHASE 2 — MORTGAGE (✓ TEMPLATE LIVE)
  • State pages at /local-lenders/[state]
  • Hub at /local-lenders with NationalHubShell
  • Clone pattern: lib/mortgage/ → lib/{vertical}/

PHASE 3 — CLONE NEW VERTICAL IN <5 MINUTES
  1. Add CATEGORY in lib/directory/categories.ts
  2. Copy lib/mortgage/stateLenders.ts → lib/{vertical}/stateLenders.ts
  3. Copy lib/mortgage/seo.ts → lib/{vertical}/seo.ts
  4. Copy app/local-lenders/[state]/page.tsx → app/{hub}/[state]/page.tsx
  5. Swap imports (MORTGAGE_CATEGORY → YOUR_CATEGORY)
  6. Add URLs to app/sitemap.ts
  7. npm run build

PHASE 4 — LAUNCH (see LAUNCH_CHECKLIST)
  P0: GSC sitemap, robots.txt, GA4, Speed Insights
  P1: Index top states, internal link mesh, monitoring queries
  P2: Content clusters, vertical expansion, 98+ Lighthouse

PERFORMANCE TARGETS:
  • Single-state data passed from server (no 51-state client bundle)
  • ISR revalidate=86400 on all directory pages
  • CDN Cache-Control on /fdic-insured-banks/* and /local-lenders/*
  • Dynamic import: USMap, FDICBanksExplorer

SEO AUTHORITY:
  • CrossVerticalNav on every state page
  • ContentClusterHub on national hubs
  • sr-only crawler indexes + JSON-LD ItemList (100 items)
  • Internal mesh: FDIC ↔ Mortgage ↔ Calculators per state

ANALYTICS:
  • Set NEXT_PUBLIC_GA4_ID in Vercel
  • trackDirectoryEvent() fires to gtag automatically
  • A/B variants via data-variant on LeadCaptureForm + PersonalizedBanner
` as const;