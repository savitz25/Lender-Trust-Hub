# Stage C.1 — County HMDA Snapshot Embed

## Purpose

Read-only research widget summarizing public HMDA county market activity for partners or other Trust Hub pages. **Not a lead form.** Click-through goes to full LenderTrustHub county research.

## URL

```text
https://www.lendertrusthub.com/embed/hmda-county?state=FL&county=miami-dade&src=partner
```

### Query parameters

| Param | Required | Description |
|-------|----------|-------------|
| `state` | yes | 2-letter code or slug (`FL`, `florida`) |
| `county` | yes | County slug (`miami-dade`, `harris`) |
| `src` | no | Partner / placement label for analytics (no PII) |

## iframe example

```html
<iframe
  title="Miami-Dade County HMDA mortgage snapshot — Lender Trust Hub"
  src="https://www.lendertrusthub.com/embed/hmda-county?state=FL&county=miami-dade&src=partner-site"
  loading="lazy"
  style="width:100%;max-width:32rem;height:520px;border:0;border-radius:16px;overflow:hidden;"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

Adjust `height` if the partner layout needs a tighter or taller card (~480–560px typical).

## What the widget shows

When data exists for a major HMDA county in product states:

1. County + state label  
2. HMDA year / as-of framing  
3. Applications, originations, denial rate, purchase vs refinance  
4. Short loan-mix highlights  
5. Public-record source note  
6. CTA: **Explore full {County} mortgage research** → county page on LenderTrustHub  

Philosophy line: *We show the public record. You decide.*

## Empty / soft-fail

| Case | Behavior |
|------|----------|
| Missing `state` or `county` | Helpful empty card + link to national hub |
| Unknown state | Soft empty + directory link |
| County not in cleaned major set / no panel | Soft empty + state directory link |

## What it does **not** include

- Lead forms / phone capture  
- “Top rated” lenders  
- Decorative trust-score scoreboards  
- Quote CTAs  

## Analytics (soft)

- `embed_impression` on load  
- `embed_click_through` when CTA is clicked  

Params: `embed_kind=hmda-county`, `state`, `county`, `embed_src`, `has_data` — no PII.

## Data source

Reuses `getHmdaCountyEvidence(stateSlug, countySlug)` — same cleaned HMDA extracts as full county pages. No parallel data pipeline.

## Intended use

- Partner research pages  
- Editorial embeds  
- Cross-hub references  

Not for pay-to-place rankings or lead generation.

## QA

1. **Miami-Dade, FL** —  
   `/embed/hmda-county?state=FL&county=miami-dade`  
   Expect metrics + CTA to `/local-lenders/florida/miami-dade`

2. **Harris, TX** —  
   `/embed/hmda-county?state=TX&county=harris`  
   Expect metrics when Harris is in TX major set

3. **Invalid county** —  
   `/embed/hmda-county?state=FL&county=not-a-real-county`  
   Expect soft empty state, no crash

4. **Missing params** —  
   `/embed/hmda-county`  
   Expect missing-params empty state  
