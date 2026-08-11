# Stage C.3 — Lender Evidence Card Embed

## Purpose

Compact, read-only **public-record evidence card** for a single lender. Distribution widget for Mortgage Market Intelligence — not a lead tile.

## URL

```text
https://www.lendertrusthub.com/embed/lender-evidence
?lender=rocket-mortgage
&state=FL
&county=miami-dade
&src=partner
```

### Parameters

| Param | Required | Description |
|-------|----------|-------------|
| `lender` | **yes** | Directory slug |
| `state` | no | 2-letter or slug — enables county market context |
| `county` | no | County slug for market + optional lender county HMDA share |
| `src` | no | Partner label for analytics (no PII) |

## iframe example

```html
<iframe
  title="Lender evidence — Rocket Mortgage — Lender Trust Hub"
  src="https://www.lendertrusthub.com/embed/lender-evidence?lender=rocket-mortgage&state=FL&county=miami-dade&src=partner-site"
  loading="lazy"
  style="width:100%;max-width:32rem;height:560px;border:0;border-radius:16px;overflow:hidden;"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

Typical height: **520–600px**.

## What the card shows

### Identity
- Lender name, type, locality
- NMLS ID when present

### Evidence badges (present / not present)
- NMLS verified / on file / incomplete  
- Local HQ evidence  
- Third-party rating attributed (when catalog has volume-backed snapshot)  
- CFPB complaint record available  
- HMDA activity available  

### Metrics (when available)
- HMDA state originations (volume, not a rating)  
- CFPB mortgage complaint count (not a finding of fault)  
- Optional county market originations  
- Optional lender originations in that county when mapped  
- Attributed rating snapshot only if already honest on profiles  

### CTA
- **View full lender research** → `/lenders/{slug}`  
- Secondary: Analyze a Loan Estimate with this lender  

### Framing
- “We show the public record. You decide.”  
- No Research Score, rank, “top rated,” or lead forms  

## Empty / soft-fail

| Case | Behavior |
|------|----------|
| Missing `lender` | Helpful empty card |
| Unknown slug | Soft empty + directory link |
| No HMDA/CFPB | Card still shows badges + limited note |

## Analytics

- `embed_impression` (`embed_kind=lender-evidence`)  
- `embed_click_through` on CTAs  

## Data sources

Reuses profile loaders only:

- `getLenderBySlug`  
- `getHmdaLenderEvidenceBySlug`  
- `getCfpbComplaintEvidenceBySlug`  
- `getHmdaCountyEvidence` (optional geo)  
- `getLenderEvidenceBadges`  

No new vendors or score algorithms.

## QA

1. **National lender with HMDA + CFPB** — e.g. `lender=rocket-mortgage`  
2. **HMDA only** — listing with HMDA match, no CFPB panel  
3. **Invalid slug** — `lender=not-a-real-slug` → soft empty  
4. **Geo context** — `state=FL&county=miami-dade` → county metrics when available  

## Related embeds

- C.1 County HMDA: `/embed/hmda-county`  
- C.2 LE Analyzer: `/embed/loan-estimate-analyzer`  
