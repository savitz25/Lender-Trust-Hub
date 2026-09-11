# TH-SEARCH-R1-002 - NMLS integrity

Builder: GPT-6 Astra / High, USER-CONFIRMED. Independent session metadata is unavailable.

Starting main and verified canonical production: `8ea55825d3a4cc5ef4d8aabd80f7c2e8348ee1ed`, deployment `dpl_EQdTctvnUGZ9ExiqLu78qCJRpx9o`. Work isolated from the existing dirty Lender checkout; no other builder files altered. Move and the parent Lender adapter were inspected read-only.

## Confirmed baseline

Persistent Chrome and API both parsed `nmls 32 51` as 32 and `NMLS 30 30` as 30. Clean 3251 was absent from the published corpus. Clean 3030 resolved to Rocket Mortgage, institution `1e2fa9a5-7067-52e9-8b44-4da4e71c9d47`, LEI `549300FGXN1K3HLB1R50`. These are observed test leads, never hardcoded runtime success branches.

Four executable tests failed before implementation: full-span parsing, spaced known positive, identity plus California licensing, and API truncation of an oversized conflicting suffix. See `red-before.txt` and `baseline-browser.json`.

## Root causes

The Ask parser captured the first contiguous NMLS digit group. The page and API sliced input to 180 characters before deeper validation. Early state-roster guards erased explicit identities. Discovery already used field equality for labeled identifiers; it was not Move's substring fallback. Its legacy digit-stripping helper was only safe when supplied a complete canonical identifier. The existing result path lacked source-field/value evidence and useful official lookup actions. Advanced-filter selections were not populated from URL state during query edits.

## Repair and rules

The existing `executeAskQuery` remains the single boundary. `request.ts` validates full text, array/duplicate parameters, bounded integer pagination and allowlisted typed overrides. `parse.ts` calls the typed identifier parser before licensing guards, with no new network runtime or HTTP self-call. Non-identity HMDA/CFPB executors retain their existing behavior.

The existing product format bounds are NMLS 2-12 digits and LEI 20 alphanumerics. These are supported corpus input bounds, not a regulator-wide assignment rule. NMLS values stay strings. Unambiguous whitespace grouping supports a 1-4 digit initial group and 2-3 digit subsequent groups. Independent comma/slash/and/or/hyphen-separated numbers and year-like four-digit suffix groups require clarification. Signs, decimals, scientific notation, malformed or overlong requests never become partial lookups. Leading zeros remain in the raw span and require clarification; no unsupported canonical zero stripping occurs. LEI case normalizes to uppercase without numeric conversion.

Exact lookup supplies canonical labeled values to the existing discovery equality resolver. It applies existing publication manifests, verifies returned field equality, and deduplicates established institution IDs. Distinct unresolved keys require clarification. A labeled NMLS/LEI pair requires both fields on the same published institution. Explicit person/MLO or branch intent cannot query institution fixtures. Existing render-approved identity-only/noindex exceptions are preserved; new held identities are not published.

Identity and requested evidence have separate outcomes. Additional names, licensing, geography, pricing and HMDA overrides remain visible as unestablished conditions; identity equality does not claim those conditions were executed. Source effective/retrieval timing is explicitly unavailable for these committed identity indexes; HMDA vintage is not assigned to identity facts. Missing/corrupt expected indexes and contradictory evidence produce UNAVAILABLE, with no zero-result count or raw exception disclosure. Missing static imports also fail the build instead of providing an empty fallback.

## Official actions

[Official NMLS documentation](https://mortgage.nationwidelicensingsystem.org/knowledge/Products/consumeraccess/SitePages/Home.aspx) identifies `www.nmlsconsumeraccess.org` as Consumer Access. The official browser returned HTTP 403/security blocking during verification; no challenge bypass or deep-link validation is claimed. The UI uses the documented generic search with a copyable full identifier, never a fabricated COMPANY/person/branch deep link. GLEIF's generic LEI search returned HTTP 200. See `official-links.json`.

## Verification and review

The focused command executes 20 behavior groups plus four original regressions through the real parser, resolver, boundary, page and API. Fixtures contain both 3251/32 and 3030/30, independent keys, pairs, held records, class traps and malformed sources. Synthetic rows never enter production. Three temporary mutations: first-group truncation, false explanation and class bypass: are detected; original bytes are restored.

Baseline TypeScript: PASS. Baseline lint: zero errors, one existing `pngSize` unused-variable warning. Candidate TypeScript, full `npm test` and lint pass; the same lint warning remains. The production build passes locally. Existing repository tests cover HMDA volume, Broward/Palm Beach comparison, publication, CFPB, state coverage, customer handoffs and metrics. Dependency installation reported existing audit findings; no dependency upgrade or security gate relaxation was made.

Review method: separate builder diff review of parser boundaries, equality, publication, class restrictions, additional-condition preservation, rendering and the actual read-only Ask adapter. This is not an independent human review. Preview/CI review and final release evidence are recorded only after execution.

## Scope and rollback

This ticket does not fix the separately reported NJ national-count fallback, broad geography/count correctness, the full name-plus-California-license workflow, complaint research, or name/DBA matching. Those remain explicitly open. No migrations, data writes, credentials, production configuration or other hub edits are required. Rollback is a normal reviewed revert/deployment of this ticket's implementation only.

Local settled-browser certification passed 14 checks at 1280/390/320, including first interaction, Trace keyboard operation, query correction, typed HMDA override persistence, reload and back/forward. The first harness attempt waited for network-idle while unrelated calculator/directory prefetches continued; direct observation confirmed the lookup itself rendered in 359 ms. The corrected bounded gate waits for the hydrated visible result, not unrelated prefetch completion.
