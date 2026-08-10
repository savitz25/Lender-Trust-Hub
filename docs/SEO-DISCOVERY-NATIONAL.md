# SEO / Discovery Polish — National Footprint

Focused template-level improvements so the existing research system is easier to discover and navigate. **No thin content farm.**

## What changed

### 1. Internal linking (highest ROI)
- New `ResearchPathNav` module: state hub → county market → lender profile → Analyzer / Compare / Program Finder
- Wired on: state hubs, county pages, lender profiles, flagship tool footers
- County pages surface HMDA-matched lenders when available
- `RelatedDirectoryLinks` reordered toward mortgage research path + state-aware Program Finder
- County intelligence DPA anchors use expanded guidance states (not only FL/TX)

### 2. Title / meta / H1 consistency
Centralized in `lib/mortgage/seo.ts`:

| Page type | Pattern |
|-----------|---------|
| State hub | Mortgage Lenders in {State} — HMDA Evidence & Local Directory |
| County | {County} County Mortgage Market — Lenders, Volume & Research Tools |
| Lender | {Lender} — NMLS, HMDA Activity & Loan Estimate Research |
| Tools | Research-oriented intent titles (Understand / Compare / Program Finder) |

- County metadata **removed** “Best mortgage lenders…” listicle titles in favor of the research template for **all** counties
- State H1 / hub copy no longer implies partial pilot-only coverage

### 3. Flagship tool discovery
- State hubs: LE tools banner + research path + HMDA state summary when data exists
- County: tools CTAs after HMDA + Program Finder language
- Lender profiles: LE tools + programs + research path
- Homepage / hub strips already featured tools; county CTA labels aligned (“Understand your Loan Estimate”)

### 4. Sitemap & indexation hygiene
- **Removed** `/my-lending` from sitemap
- **robots.txt** disallows `/my-lending`, `/my-lending/`, `/auth/`
- My Lending pages: `robots: { index: false, follow: false }`
- Higher priority for high-volume/deepened states and their Tier 1 counties
- Flagship tools / programs elevated in static priorities

### 5. Structured data
- State JSON-LD: removed misleading `AggregateOffer`; added tools FAQ; `FinancialService` list items
- County: BreadcrumbList + WebPage
- Lender profile: BreadcrumbList + FinancialService + NMLS identifier when present

### 6. State hub authority blocks
- `getHmdaStateMarketSummary` + `HmdaStateSummaryPanel` on state hubs when major-county HMDA extracts exist
- Uses existing data only — no fake freshness stamps

## Intentionally deferred
- Manual rewrite of every county body paragraph
- New blog / listicle content
- Marketplace rate tables
- Full visual redesign
- Submitting to external PR directories
- Live Open Graph images per county

## Success checks
- [ ] Sample state hub shows HMDA summary (when data) + tools + counties
- [ ] Sample county title is research template (not “Best lenders…”)
- [ ] Lender profile breadcrumbs: Home → Local Lenders → State → County → Name
- [ ] `/sitemap.xml` excludes my-lending; includes state/county/tools
- [ ] `/robots.txt` disallows my-lending
