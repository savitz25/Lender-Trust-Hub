# FRED / Freddie Mac rate context

**Added:** 2026-08  
**Purpose:** Give Loan Estimate and calculator users a national mortgage rate benchmark without rate-shopping lead gen.

## Data

| Series | Meaning |
|--------|---------|
| `MORTGAGE30US` | 30-Year Fixed Rate Mortgage Average (Freddie Mac PMMS via FRED) |
| `MORTGAGE15US` | 15-Year Fixed Rate Mortgage Average (optional second line) |

- Env: `FRED_API_KEY` (server-only; never `NEXT_PUBLIC_`)
- Fetch: `lib/fred/client.ts` via `getFredMortgageBenchmarks()` (`lib/fred/server.ts`)
- Cache: Next `unstable_cache` + `fetch` revalidate ≈ **6 hours**

## UI

| Surface | Component |
|---------|-----------|
| Loan Estimate Analyzer | `FredRateContextPanel` with user-rate comparison |
| Compare Loan Estimates | Same panel, compact, shared benchmark only |
| Calculators hub | `FredRateBenchmarkStrip` (benchmark only) |

Comparison copy is educational: above / near / below the national average, with as-of date and FRED source link. No “best rate” claims.

## Failure modes

| Condition | Behavior |
|-----------|----------|
| Missing `FRED_API_KEY` | `available: false`; panels render nothing |
| FRED HTTP / parse error | Same graceful empty |
| Empty observations | Same |

## Limitations

- National average ≠ offer for a specific borrower
- Weekly survey lag; not real-time lender pricing
- Does not adjust for credit, LTV, points, or property location
- Experimental only relative to Loan Estimate rates entered by the user

## Local setup

```bash
# .env.local
FRED_API_KEY=your_key_from_https://fred.stlouisfed.org/docs/api/api_key.html
```
