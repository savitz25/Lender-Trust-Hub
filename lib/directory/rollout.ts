/**
 * MASTER ROLLOUT GUIDE — LenderTrustHub Directory Platform (Definitive)
 * ====================================================================
 */

export const ROLLOUT_GUIDE = `
IMPLEMENTATION ORDER (execute sequentially):
  See lib/directory/implementation-order.ts → IMPLEMENTATION_ORDER array

PHASE 1 — FDIC (✓ COMPLETE)
  • 51 state SSG pages at /fdic-insured-banks/[state]
  • National hub with map + region grid + content clusters + HubCTAStrip
  • Full JSON-LD graph per page

PHASE 2 — MORTGAGE (✓ LIVE)
  • State pages at /local-lenders/[state]
  • Hub at /local-lenders with NationalHubShell + keyword sections
  • Clone pattern: lib/mortgage/ → lib/{vertical}/

PHASE 3 — AUTO LOANS (✓ LIVE)
  • Hub: /auto-loan-companies
  • State pages: /auto-loan-companies/[state] (12 states seeded)
  • lib/auto/providers.ts → replace with lib/auto/data/*.json at scale

PHASE 4 — CLONE NEW VERTICAL IN <5 MINUTES
  1. Add CATEGORY in lib/directory/categories.ts (set live: true)
  2. Copy lib/auto/* → lib/{vertical}/
  3. Copy app/auto-loan-companies/* → app/{hub}/
  4. Find-replace imports (AUTO_CATEGORY → YOUR_CATEGORY)
  5. Add URLs to app/sitemap.ts + next.config.ts Cache-Control
  6. Update CrossVerticalNav + Navbar + RelatedDirectoryLinks
  7. npm run build

  Credit Repair: see VERTICAL_CLONE_GUIDE.creditRepair in growth-plan.ts
  MCA:           see VERTICAL_CLONE_GUIDE.mca in growth-plan.ts

PHASE 5 — LAUNCH (see LAUNCH_CHECKLIST + GROWTH_PLAN_30_DAY)
  P0: GSC sitemap, robots.txt, GA4, Speed Insights, hub indexing
  P1: Index top states, internal link mesh, A/B lead forms
  P2: Credit repair + MCA launch, 98+ Lighthouse, authority backlinks

CONVERSION SYSTEM:
  • LeadCaptureForm variants: default | hero-compact | sidebar-minimal | state-page-v2
  • PersonalizedBanner per vertical: fdic | mortgage | auto
  • HubCTAStrip on all national hubs
  • GA4 events: directory_lead_submit, directory_cta_click (via data-variant)

PERFORMANCE TARGETS:
  • Single-state data passed from server (no 51-state client bundle)
  • ISR revalidate=86400 on all directory pages
  • CDN Cache-Control on /fdic-insured-banks/*, /local-lenders/*, /auto-loan-companies/*
  • GA4 preconnect in app/layout.tsx
  • Dynamic import: USMap, FDICBanksExplorer

SEO AUTHORITY:
  • CrossVerticalNav on every state page (FDIC ↔ Mortgage ↔ Auto)
  • ContentClusterHub + HUB_KEYWORD_SECTIONS on national hubs
  • EditorialByline on insights sections (E-E-A-T)
  • RelatedDirectoryLinks on lender profiles
  • JSON-LD ItemList + FAQPage per state page

ANALYTICS:
  • Set NEXT_PUBLIC_GA4_ID in Vercel
  • trackDirectoryEvent() fires to gtag automatically
  • A/B variants via data-variant on LeadCaptureForm + PersonalizedBanner
  • Monitor: MONITORING_QUERIES + GA4_EVENTS_TO_MONITOR in launch-checklist.ts
` as const;