# Stage A′ — Contextual Journey Handoffs

## Goal
Situation-aware, crawlable handoffs across Move · Lender · Insurance with non-PII context. No homepage dumps when geography is known. No lead forms.

## Param contract

| Param | Values | Notes |
|-------|--------|--------|
| `src` | `move` \| `lender` \| `insurance` \| `ask` | Origin hub |
| `journey` | `relocate` \| `purchase` \| `refi` \| `coverage` \| `unknown` | Situation |
| `state` | `FL` or `florida` | Normalized on receive |
| `county` | `miami-dade` | Canonical slug |
| `intent` | `buy` \| `rent` \| `refi` \| `unknown` | Housing intent |
| `housing` | `owner` \| `renter` | Optional |

No PII. Not for campaign UTMs.

### Example
```
https://www.lendertrusthub.com/local-lenders/florida/miami-dade?src=move&journey=relocate&state=FL&county=miami-dade&intent=buy
```

## Situation routing

| Situation | Primary | Secondary |
|-----------|---------|-----------|
| Moving + buying | Lender county/state | Insurance destination |
| Moving + renting | Insurance destination | — |
| Moving + unknown intent | Insurance | Lender secondary |
| Local purchase | Lender | Insurance |
| Refinance | Lender | — |

## Code map (Lender)

| Piece | Path |
|-------|------|
| Contract | `lib/network/journey-context.ts` |
| Continue component | `components/network/continue-trust-journey.tsx` |
| Orientation banner | `components/network/journey-orientation-banner.tsx` |
| Landing tracker | `components/network/journey-landing-tracker.tsx` |
| Analytics | `trackJourneyHandoff` / `trackJourneyLanding` in `lib/analytics/ga-events.ts` |
| Public cross-hub links | `CrossHubLink` default `mode="public"` (crawlable) |

### Landings
- `/local-lenders` with `state` → redirect to state or county path
- State / county pages: orientation banner + tools + continue journey
- LE Analyzer / Compare / Calculators: Lender → Insurance handoff

## Insurance twin
Same contract under `insurance-trust-hub/lib/network/journey-context.ts`.
Destination guides show orientation + continue journey to Lender when buying.

## Move
Static sample cards on `move-trust-hub/index.html` (`#trust-journey`).
See `move-trust-hub/docs/STAGE-A-JOURNEY-HANDOFFS.md`.

## Auth handoff
`/api/auth/network-handoff/*` reserved for signed-in passport sync only.
Public research uses plain absolute URLs with journey params.

## Limitations
- Move production destination CMS not fully in this workspace — pattern documented + sample HTML
- County validity soft-fails (empty county page still useful)
- Analytics requires existing gtag/consent setup
