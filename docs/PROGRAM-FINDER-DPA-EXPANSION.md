# Program Finder — DPA expansion beyond FL / TX

## Goal
Make program and down-payment assistance guidance more useful across high-value states while remaining educational and non-lead-gen.

## What was added

### Content module (`lib/programs/location-notes.ts`)
Maintainable state modules (not one-off hardcoding) for:

| Tier | States |
|------|--------|
| Deep | Florida, Texas (full research steps, layering, dual TX portals) |
| Tier 1 | California, North Carolina, Georgia, Arizona, Washington, Colorado |
| Tier 2 | Tennessee, Virginia, Maryland, New York, Pennsylvania, Illinois, Ohio, Nevada, Utah, Oregon |

Each module includes:
- Primary state HFA / official starting points
- Common DPA themes in plain language
- How DPA often layers with FHA / conventional
- Caveats on local variation and changing program status
- Official source links only (plus HUD counselor + CFPB DPA education)
- In-site next research links (finder, DPA anchor, lenders, calculators)

Helpers:
- `isDpaGuidanceState` / `isDpaPriorityState`
- `getProgramFinderStateOptions`
- `getDpaStateDisplayName`
- `dpaStateCtaCopy`

### Program Finder (`/tools/program-finder`)
- Dropdown lists all expanded states (A–Z) with depth labels
- Selecting a guidance state surfaces `ProgramLocationPanel` + DPA deep-link
- Fit heuristics boost DPA research framing for any guidance state (not only FL/TX)

### DPA program page
- Heading reframed as multi-state “where to research officially”
- Jump chips + full panels for every module in `PROGRAM_LOCATION_NOTES`
- Deferred-scope note updated for nationwide inventory / live funding

### Contextual entry points
- `ProgramsToolsCta` resolves any guidance state name generically
- County pages already pass `stateSlug` — expanded states now get DPA pathways
- State research sections: Program Finder + DPA links; full CTA banner on guidance states
- `state-housing-resources.ts`: added VA, MD, OH, NV, UT, OR official portals

## Intentionally deferred
- Complete city/county DPA database for any state
- Live open/closed funding status feeds
- Income limits, dollar amounts, or “you qualify” language
- Application forms, eligibility determination, lender lead routing
- Remaining U.S. states without a dedicated module (still point to HFA + HUD counselor)

## Content quality rules (enforced in copy)
- Official public sources only
- Explicit general vs state-specific framing
- No “you qualify” language
- No application forms
- No lead capture from this pathway

## Maintainability
When an official portal moves, update `lib/programs/location-notes.ts` (and optionally `lib/mortgage/state-housing-resources.ts`) only—UI reads from the module.
