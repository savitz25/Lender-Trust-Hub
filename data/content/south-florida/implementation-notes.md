# Implementation Notes — South Florida Hub (Complete Package)

**Source:** `agent.agencies USA/agents in south florida.docx`  
**Generated:** June 2026  
**GitHub:** `savitz25/Lender-Trust-Hub`

---

## Content File Map

```
data/content/south-florida/
├── lender-registry.md          # 18 deduplicated agencies + merge log
├── hub-overview.md             # South Florida / Florida regional hub
├── implementation-notes.md     # This file
└── counties/
    ├── broward.md              # FULL — 5 profiles (rich example)
    ├── miami-dade.md           # FULL — 5 profiles
    ├── palm-beach.md           # FULL — 5 profiles
    ├── orange.md               # Starter outline + PRMG
    ├── hillsborough.md         # Starter outline + Mortgage Advantage
    └── duval.md                # Starter outline + PRMG
```

---

## Next.js Integration

### Option A — Content loader (recommended)

```ts
// lib/content/south-florida.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function loadCountyMarkdown(slug: string) {
  const file = path.join(process.cwd(), `data/content/south-florida/counties/${slug}.md`);
  return matter(fs.readFileSync(file, 'utf8'));
}
```

### Option B — Route per county

| Route | File | Status |
|-------|------|--------|
| `/local-lenders/florida/south-florida` | `hub-overview.md` | Build `app/.../south-florida/page.tsx` |
| `/local-lenders/florida/broward` | `counties/broward.md` | Enhance existing `[county]/page.tsx` |
| `/local-lenders/florida/miami-dade` | `counties/miami-dade.md` | Same |
| `/local-lenders/florida/palm-beach` | `counties/palm-beach.md` | Same |
| `/local-lenders/florida/orange` | `counties/orange.md` | New static param |
| `/local-lenders/florida/hillsborough` | `counties/hillsborough.md` | New |
| `/local-lenders/florida/duval` | `counties/duval.md` | New |

### Component markers → React

| Marker | Component |
|--------|-----------|
| `ZipSearchBar` | `SearchBar` |
| `TrustBar` | Pill banner (existing state page pattern) |
| `LenderCardGrid` | `LenderCard` |
| `CalculatorEmbed` | Calculator links + `LeadCaptureForm` |
| `TrustBox` | New `VerificationTrustBox` |
| `TestimonialsCarousel` | Static block or carousel |
| `lead-capture` | `LeadCaptureForm variant="county-page-v1"` |

---

## Data layer (`lib/mockData.ts`)

Replace placeholder FL lenders with 18 registry entries. Example slugs:

```
doce-mortgage-group, truth-about-lending, florida-state-mortgage-group,
prime-time-mortgage, floridas-va-mortgage-center, cmg-dennis-vo,
bennett-capital-partners, premier-lending-corp, rate-leaf, onmortgage,
choice-mortgage-group, prmi-swenson, palm-beach-mortgage-group,
america-home-loans, supreme-lending, prmg, mortgage-advantage-lending,
home-financial-group
```

Extend `ZIP_TO_COUNTY` for all hero ZIP examples.

---

## Navigation

1. **Directories dropdown** → "South Florida Lenders" → `/local-lenders/florida/south-florida`
2. **Florida state page** → 6-county grid above lender list
3. **Homepage** → "Popular Corridors" module from hub-overview

---

## Sitemap (`public/sitemaps/mortgage-lenders.xml`)

| URL | priority | changefreq |
|-----|----------|------------|
| `/local-lenders/florida/south-florida` | 0.9 | weekly |
| `/local-lenders/florida/broward` | 0.88 | weekly |
| `/local-lenders/florida/miami-dade` | 0.88 | weekly |
| `/local-lenders/florida/palm-beach` | 0.88 | weekly |
| `/local-lenders/florida/orange` | 0.75 | monthly |
| `/local-lenders/florida/hillsborough` | 0.75 | monthly |
| `/local-lenders/florida/duval` | 0.75 | monthly |

---

## Schema (JSON-LD)

**Hub:** `WebPage` + `ItemList` + `FAQPage` + `BreadcrumbList`

**County:** `WebPage` + `about: AdministrativeArea` + `ItemList` of `FinancialService`:

```json
{
  "@type": "FinancialService",
  "name": "The Doce Mortgage Group",
  "hasCredential": { "@type": "EducationalOccupationalCredential", "credentialID": "2638131" },
  "areaServed": "Broward County, Florida"
}
```

**Anchor IDs** match markdown `{#slug}` for deep links and `@id` fragments.

---

## E-E-A-T Checklist

- [x] Single authoritative source (docx) with dedup log
- [x] NMLS links on every profile
- [x] CFPB + "verify yourself" disclaimers
- [x] No paid placement language
- [x] June 2026 date stamps
- [ ] Wire `EditorialByline` with South Florida editor persona
- [ ] Live routes + mockData sync (implementation PR)

---

## Deploy

```bash
git add data/content/south-florida/
git commit -m "feat: complete South Florida hub content from authoritative docx source"
git push origin main
```

Vercel auto-deploys from `savitz25/Lender-Trust-Hub` main branch.