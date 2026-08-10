# Program / Assistance Finders V1

**Status:** Shipped (Phase 3)  
**Routes:**
- `/tools/program-finder` — guided educational shortlist
- `/programs` — hub
- `/programs/{fha,va,conventional,usda,down-payment-assistance}` — overviews

## Principles

- Educational only — no eligibility determination
- No lead forms or apply-now pressure
- Strong disclaimers + official sources on each guide
- “We show the public record. You decide.”

## Content

Maintainable guides in `lib/programs/programs.ts` (FHA, VA, conventional, USDA, DPA).  
Finder heuristics in `lib/programs/finder.ts` (pure functions).

## Entry points

- Calculators hub (+ registry featured card)
- Homepage tools strip (`LENDER_TOOLS`)
- Footer research column
- Mobile nav
- County pages + lender profiles (`ProgramsToolsCta`)
- My Lending empty shortlist links

## Out of scope (later)

- Live local DPA inventory / application APIs
- True underwriting simulation
- National every-jurisdiction database
