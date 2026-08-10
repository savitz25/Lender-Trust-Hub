# Program / Assistance Finders V1

**Status:** Shipped (Phase 3)  
**Routes:**
- `/tools/program-finder` — guided educational shortlist
- `/programs` — hub + side-by-side comparison table
- `/programs/{fha,va,conventional,usda,down-payment-assistance}` — overviews

## Principles

- Educational only — no eligibility determination
- No lead forms or apply-now pressure
- Strong disclaimers + official sources on each guide
- “We show the public record. You decide.”

## Content modules

| Module | Role |
|--------|------|
| `lib/programs/programs.ts` | FHA, VA, conventional, USDA, DPA guides (advantages, trade-offs, comparison rows) |
| `lib/programs/finder.ts` | Pure fit heuristics (never claims qualification) |
| `lib/programs/location-notes.ts` | FL / TX framing for DPA & markets (not a national inventory) |

## UI

- `ProgramFinder` — optional quiz → ranked educational fits
- `ProgramComparisonTable` — plain-language matrix on `/programs`
- `ProgramLocationPanel` — explicit general vs location-specific notes
- `ProgramsToolsCta` — discovery on calculators hub, county pages, lender profiles

## Entry points

- Calculators hub (+ registry featured card)
- Homepage tools strip (`LENDER_TOOLS`)
- Footer research column
- Mobile nav
- County intelligence modules + `ProgramsToolsCta`
- Lender profiles
- My Lending empty / shortlist research links
- Sitemap static routes

## Location awareness (V1)

- Finder accepts optional state (FL, TX, GA, NC, other)
- DPA page includes FL + TX notes with official HFA links
- Explicit: not a complete nationwide DPA database

## Out of scope (later)

- Live local DPA inventory / application APIs
- True underwriting simulation
- National every-jurisdiction database
- Eligibility determination or lead routing
