# Implementation Notes — South Florida Hub

## File locations (created)

```
data/content/south-florida/
├── hub-overview.md          # State/regional hub page
├── lender-registry.md       # 10 unique agencies + dedup log
├── implementation-notes.md    # This file
└── counties/
    ├── broward.md           # Full production county page
    └── _county-templates.md # Miami-Dade, Palm Beach, Orange, Hillsborough, Duval
```

## Routing options

### Option A — Regional hub (recommended)
- **URL:** `/local-lenders/florida/south-florida`
- Add `app/local-lenders/[state]/south-florida/page.tsx` OR treat as content-driven sub-hub linked from Florida state page
- Florida state page hero: add prominent CTA → "Explore South Florida Hub"

### Option B — Enhanced Florida state page
- Merge `hub-overview.md` sections into existing `/local-lenders/florida` template
- Inject `CountyGrid` with 6 counties above current lender list

## Navigation

1. **Navbar → Directories dropdown:** Add "South Florida Lenders" linking to hub
2. **Florida state page:** Featured counties grid (6 cards) below hero stats
3. **Footer:** Regional hubs column when ≥3 hubs exist
4. **Homepage corridor module:** Pull "Popular South Florida Corridors" dynamic list

## Sitemap priority

| URL | Priority | Changefreq |
|-----|----------|------------|
| `/local-lenders/florida/south-florida` | 0.9 | weekly |
| `/local-lenders/florida/broward` | 0.85 | weekly |
| `/local-lenders/florida/miami-dade` | 0.85 | weekly |
| `/local-lenders/florida/palm-beach` | 0.85 | weekly |
| `/local-lenders/florida/orange` | 0.75 | monthly |
| `/local-lenders/florida/hillsborough` | 0.75 | monthly |
| `/local-lenders/florida/duval` | 0.75 | monthly |

Add to `public/sitemaps/mortgage-lenders.xml` via `generate-sitemap-index.py` extension.

## Data layer (`lib/mockData.ts` or `lib/mortgage/floridaLenders.ts`)

Replace placeholder lenders (Summit Home Lending, etc.) with 10 registry agencies:

```ts
// Example slug mapping
{ slug: 'doce-mortgage-group', nmlsId: '2638131', countySlug: 'broward', ... }
{ slug: 'truth-about-lending', nmlsId: '1054357', countySlug: 'broward', ... }
// etc.
```

Extend `ZIP_TO_COUNTY` with: `33331` (Weston), `33330` (Davie), `33431` (Boca), `32801` (Orlando), `33602` (Tampa), `32202` (Jacksonville).

## Component mapping

| Markdown marker | Existing component |
|-----------------|-------------------|
| `ZipSearchBar` | `SearchBar` |
| `LenderCardGrid` | `LenderCard` |
| `CalculatorEmbed` | Link to `/calculators/*` |
| `LeadCaptureForm` | `LeadCaptureForm` |
| `TrustBox` | New `VerificationTrustBox` or section in `EditorialByline` |
| `ComparisonTable` | New `LenderComparisonTable` |
| `TestimonialsCarousel` | New or static block |

## Schema markup

### Hub page
- `WebPage` + `ItemList` (featured lenders)
- `FAQPage` (FAQ section)
- `BreadcrumbList`

### County pages
- `WebPage` + `AdministrativeArea`
- Per-lender `FinancialService` or `LocalBusiness` with `hasCredential` → NMLS ID
- `AggregateRating` only when citing specific third-party source + date

### Lender profile anchors
Use `@id` fragments matching slug anchors (`#doce-mortgage-group`) for deep linking.

## E-E-A-T checklist

- [x] NMLS IDs with verification links on every profile
- [x] CFPB disclaimer on every page
- [x] "No paid placement" trust bar
- [x] Source date (June 2026) on all pages
- [x] Testimonials labeled sourced vs. composite
- [ ] Author byline via `EditorialByline` component (add South Florida editor persona)

## Next implementation PRs

1. **PR-1:** Add Florida lender data + ZIP mappings from registry
2. **PR-2:** South Florida hub route + county content loader (MD → React)
3. **PR-3:** Sitemap + nav links + schema JSON-LD
4. **PR-4:** Expand Miami-Dade + Palm Beach full pages from templates
5. **PR-5:** Orange/Hillsborough/Duval pages with PRMG deep profile