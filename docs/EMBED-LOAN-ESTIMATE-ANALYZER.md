# Stage C.2 — Loan Estimate Analyzer Embed

## Purpose

Research-only embed of the flagship Loan Estimate Analyzer: enter LE figures, see educational fee bands, optional HMDA lender/county context, and click through to the full tool. **No lead form. No account.**

## URL

```text
https://www.lendertrusthub.com/embed/loan-estimate-analyzer
?lender=rocket-mortgage
&county=miami-dade
&state=FL
&src=partner
```

### Query parameters

| Param | Required | Description |
|-------|----------|-------------|
| `lender` | no | Directory / HMDA-matched lender slug |
| `state` | no | 2-letter or slug; helps resolve non-FL counties |
| `county` | no | County slug (`miami-dade`, `harris`) |
| `src` | no | Partner label for analytics (no PII) |

Invalid lender/county values **fail soft**: the tool still runs with educational bands; a short note explains missing context.

## iframe example

```html
<iframe
  title="Loan Estimate Analyzer — Lender Trust Hub"
  src="https://www.lendertrusthub.com/embed/loan-estimate-analyzer?state=FL&county=miami-dade&src=partner-site"
  loading="lazy"
  style="width:100%;max-width:32rem;height:720px;border:0;border-radius:16px;overflow:hidden;"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
```

Typical height: **680–780px** depending on whether results are expanded.

## What it includes

1. Manual LE inputs (loan amount, rate, APR, origination, points, credits, optional total closing, loan type)  
2. **Analyze fees** → educational bands (lower / typical / higher), net lender cost, APR−rate note  
3. Optional light HMDA context when lender/county resolve  
4. FRED national rate context when available  
5. CTA: **Open full Loan Estimate Analyzer** (preserves context params)  
6. Secondary: Compare estimates  

## What it excludes

- Site nav/footer  
- Lead forms / phone capture  
- My Lending save  
- PDF/OCR upload  
- Fake HMDA fee percentiles  

## Analytics

| Event | When |
|-------|------|
| `embed_impression` | Embed loads |
| `embed_analyze` | User clicks Analyze fees |
| `embed_click_through` | Full tool / compare CTA |

## Data / logic

- Fee math: `analyzeLoanEstimateClient` / educational bands (same as full tool)  
- Bootstrap: `buildAnalyzerBootstrap()` (HMDA + FRED, server-serialized)  
- No forked underwriting engine  

## QA

1. **No params** — `/embed/loan-estimate-analyzer` → defaults work; analyze shows bands  
2. **Lender only** — `?lender=<valid-slug>` → lender HMDA line when matched  
3. **Lender + county** — `?lender=…&state=FL&county=miami-dade` → both contexts  
4. **Invalid** — `?lender=not-real&county=xyz` → soft note; bands still work  
5. Full CTA opens `/tools/loan-estimate-analyzer` with useful query params  

## Related

- Full tool: `/tools/loan-estimate-analyzer`  
- County snapshot embed: `/embed/hmda-county` (Stage C.1)  
