# Lender Trust Hub — Phase 1: Geographic Assignment Honesty

**Hard rule:** A lender is not “local” to a county merely because it can lend in the state.

## Classification

| Class | Rule |
|-------|------|
| **In-county** | Derived HQ from licensed **city** (preferred) or **ZIP** maps to the page county |
| **Nearby** | Same state, HQ outside page county, and either **adjacent** or **explicit supplement** (serve-from-elsewhere) |
| **Unknown** | No city/ZIP/county locality on file |

City/ZIP beats a conflicting market `countySlug` (e.g. Jacksonville city cannot stay Miami-Dade local).

## County pages

1. **In-county HQ** first (primary ranking only)
2. **Nearby / serving from elsewhere** secondary, clearly labeled
3. Honest empty / scarcity copy — no padding distant offices as local

## Key modules

- `lib/geo/locality-rules.ts`
- `lib/geo/city-county-lookup.ts`
- `lib/lenders.ts` → `getCountyLenderSegments`
- `app/local-lenders/[state]/[county]/page.tsx`

## Regression check

```bash
node scripts/check-lender-phase1-locality.mjs
```

Examples guarded: Jacksonville ≠ Miami-Dade local; Pensacola / Fort Walton not Bay primary; Cooper City = Broward.

## Deploy

Production = this repo (`Lender-Trust-Hub`) → `www.lendertrusthub.com` only.
