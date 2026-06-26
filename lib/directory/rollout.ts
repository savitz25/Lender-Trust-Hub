/**
 * STEP-BY-STEP ROLLOUT GUIDE — LenderTrustHub Directory Platform
 * ==============================================================
 * This module documents the full integration path. Import ROLLOUT_GUIDE
 * in tooling or read inline comments when onboarding new verticals.
 */

export const ROLLOUT_GUIDE = `
PHASE 1 — FDIC (COMPLETE)
  ✓ 51 state JSON files in lib/fdic/data/
  ✓ SSG routes at /fdic-insured-banks/[state]
  ✓ National hub at /fdic-insured-banks
  ✓ Sitemap + caching headers
  ✓ JSON-LD: Organization, WebSite, BreadcrumbList, ItemList, FAQPage, HowTo

PHASE 2 — SEO & PERFORMANCE HARDENING
  □ Submit sitemap.xml to Google Search Console
  □ Monitor Core Web Vitals in Vercel Speed Insights
  □ Add GA4 gtag to app/layout.tsx and wire lib/directory/analytics.ts
  □ Internal link from every lender profile → state FDIC page
  □ Internal link from calculators → state FDIC + mortgage pages

PHASE 3 — MORTGAGE VERTICAL (clone template)
  1. Copy app/fdic-insured-banks/ → app/local-lenders/[state]/ (if not exists)
  2. Use MORTGAGE_CATEGORY from lib/directory/categories.ts
  3. Data shape: name, nmls, address, website, specialties
  4. Reuse: Breadcrumbs, LeadCaptureForm, StateInsightsSection, CategoryCTAs

PHASE 4 — AUTO, CREDIT REPAIR, MCA
  1. Add category config in lib/directory/categories.ts
  2. Create lib/{vertical}/data/{state}.json
  3. Duplicate [state]/page.tsx with new category + loader
  4. Set relatedVerticals cross-links for internal linking mesh

PHASE 5 — STATIC GENERATION AT SCALE
  python scripts/parse-fdic-csv-text.py  # ingest new FDIC data
  npm run build                          # regenerates all 51 SSG pages
  vercel --prod                          # deploy

SITEMAP: Auto-generated at /sitemap.xml (app/sitemap.ts)
CACHING: next.config.ts headers on /fdic-insured-banks/*
HREFLANG: US-only site — lang="en" on <html>; expand if adding locales

A/B TESTING: LeadCaptureForm and hero CTAs use data-variant attributes
for easy experimentation via your analytics platform.
` as const;