# Lender Trust Hub — Phase 0: Data Integrity in Verification Fields

**Program open:** Remove invented, placeholder, and non-defensible lender signals before SEO expansion.  
**Hard rule:** If a field cannot be sourced, do not display it.

---

## 1. NMLS placeholder cleanup

| Mechanism | Location |
|-----------|----------|
| `cleanNmlsId` / `resolveNmlsVerification` | `lib/verification/nmls.ts` |
| Catalog sanitize | `finalizeLenderCatalog` in `lib/verification/sanitize-lender.ts` |
| Hard badge UI | `components/nmls-verification-badge.tsx` |

- Tokens such as `SEE-NMLS`, `TBD`, `N/A`, empty, and non-digit strings never unlock **NMLS ID verified**.
- Hard badge requires **numeric NMLS ID + verification flag**.
- Soft state: **NMLS ID on file** (numeric only, not hard-verified).
- Incomplete: no badge; summary “recheck required”.
- Source fix: Palm Beach Mortgage Group no longer ships `SEE-NMLS` / fake verified flag.

## 2. Phone placeholder cleanup

| Mechanism | Location |
|-----------|----------|
| `isLenderPlaceholderPhone` / `cleanDisplayPhone` | `lib/verification/phone.ts` |

- Any **555** exchange is non-displayable.
- Sanitize strips placeholder phones from the public catalog.
- Auto provider cards also gate on `cleanDisplayPhone`.

## 3. Seed performance metric removal

| Mechanism | Location |
|-----------|----------|
| `resolveClosingPerformance` | `lib/verification/performance-metrics.ts` |

- Avg close days / on-time close % **suppressed** without documented provenance (source, sample size, window, methodology).
- UI empty state: *“No independently verified closing-performance data available”*.
- Removed from LenderCard, compare table, and trust-profile extensions.
- Directory sort option **Fastest Avg Close** removed.

## 4. Entity dedupe + count corrections

| Mechanism | Location |
|-----------|----------|
| Entity key = NMLS | `lib/verification/entity-identity.ts` |
| Entity-level trust score | `applyEntityTrustScores` |
| Distinct counts | `lib/verification/counts.ts` |
| State / county APIs | `lib/mortgage/stateLenders.ts`, `lib/lenders.ts` |

- Trust score is max-aligned **per NMLS entity**, not per geo row.
- County lists and national directory **dedupe by entity**.
- Headlines: distinct entities vs branch listings (e.g. “40 lenders across 55 branch locations”).
- `TRUST_STATS` no longer invents 12,450 lenders or 2.8M reviews.

## 5. Verification badge rules

| Level | Badge |
|-------|--------|
| Incomplete | None |
| Numeric ID on file | Soft: “NMLS ID on file” |
| Numeric ID + verified flag | Hard: “NMLS ID verified” |

Indexability: incomplete / unverified NMLS → **noindex**; non-canonical geo variants of the same NMLS → **noindex**.

## 6. Metric provenance kickoff

`lib/verification/metric-provenance.ts` defines source / retrieved date / confidence / displayability for Google, BBB, CFPB, volume rank. Volume rank is suppressed until a real source exists. Enrichment-only paths preferred for “observed” confidence.

**Deploy note:** Production `www.lendertrusthub.com` ships from this **Lender-Trust-Hub** repo (not Move monorepo `app/lender` parity).

## 7. Guardrails

```bash
node scripts/check-lender-phase0-integrity.mjs
```

---

## Remaining data limitations / manual follow-ups

1. **Real NMLS backfill** for listings that lost placeholder IDs (confirm on NMLS Consumer Access).
2. **Real phone numbers** — do not reintroduce 555 patterns; prefer blank until confirmed.
3. **Geo-variant URL consolidation** — non-canonical profiles are noindex; add 301s to canonical NMLS entity when consolidating public URLs.
4. **Closing-performance dataset** — only re-enable with full provenance.
5. **Seed ratings / review counts** — still present as soft directory signals; continue enrichment for observed provenance; do not merge third-party reviews into first-party review schema.
6. **Do not expand counties / Credit Repair / MCA** in this phase.

## Research-only positioning

Public CTAs remain research / directory oriented. No lead-fee ranking claims. Confirm licensing on NMLS Consumer Access before applying.
