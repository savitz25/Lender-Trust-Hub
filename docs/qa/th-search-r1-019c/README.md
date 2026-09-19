# TH-SEARCH-R1-019C — Lender name candidates and native-search parity

Status: **READY_FOR_ASTRA_REVIEW**. Draft PR. Not merged, not deployed. Ask is unmodified and does not
call the new operation. No database, schema, data, publication or environment change.

Baseline `origin/main` `f69194245199ac8013dbbebc63f5820eb769e043` (unchanged at the final build, so
no reconciliation commit). Branch `th-search-r1-019c-lender-name-candidates`.

## 0. Review 1 corrections (reviewed head `fec563b`, outcome CHANGES_REQUESTED)

The one-engine design, in-memory approved catalog, candidate/evidence separation, unchanged v2 contract,
source-backed methods and real profile/official actions are preserved. The frozen samples were not changed.

| # | Finding | Correction | Tests / mutation |
|---|---|---|---|
| 1 | Keyword gates (`charter`, `branch`, 20-char shape…) rejected organization names before the catalog | `request-shape.ts`: only validated **label + value** syntax (existing `parseIdentityRequest`) is an identifier request; a malformed labeled number stays an identifier attempt and never touches the catalog. People/branches are excluded by the institution-only catalog, not by vocabulary. Native decision rewritten to be structural and engine-backed: no `SENTENCE_START` / `NOT_A_NAME` word lists. A text is a name when the engine says its distinctive words name an institution, when the whole text equals a source name, or when no other reading understood it. Partial names do not need exact equality. | R1, R1b · mutation D |
| 2 | Parser-entity shortcut dropped conditions; `fullName()` swallowed catalog errors | Conditions are computed from the ORIGINAL text and the validated URL overrides on every route (parser-entity, candidate-only, URL-filtered) and listed as **NOT APPLIED**; no HMDA geography is converted into an institution location. A catalog failure returns `unavailable` to the decision, which selects the name operation → `UNAVAILABLE` with the name kept, and no cohort is run. | R2, R2b · mutations E, G |
| 3 | `hasMore` could advertise page 41 that was invalid | ONE policy: `CANDIDATE_WINDOW = 200` best-ranked candidates are reachable for any page size; `hasMore`, `pageCount` and request validation are all computed against that window; `truncated` + a "not exhaustive, refine the name" limitation beyond it; a beyond-end page is empty with `outOfRange: true`, never a repeat. Native and service share it. | R3 · mutation F |
| 4 | Scope language / Altura | A miss says "WITHIN THE SEARCHED SCOPE … not a finding that no such institution exists". The response for an excluded real institution is byte-identical to a nonexistent name: nothing about restricted rows is revealed. L1-P decision block below. Nothing was enumerated or authorized. | R4 |
| 5 | Disputed LEIs | Policy documented + negative tests: the HMDA reporter stays findable under its own key and LEI; no profile, NMLS or bridge is attached through the disputed relationship; no profile card repeats the disputed LEI. Raw data untouched. | R5 |
| 6 | CI / browser / handoff | `check:th-search-r1-019c` added to the PR workflow; headless Playwright with real Enter and clicks; canonical link checked separately. | see §7 |

Found by the protected regressions during this pass (and fixed before return): moving the name hook ahead
of identifier lookup let `NMLS -3251` reach the name catalog — R1-002 test 07 failed. `isIdentifierAttempt()`
now keeps malformed labeled numbers on the existing identifier path (R1b asserts the catalog is not touched).

### L1-P — owner decision block (NOT authorized; nothing was built or enumerated)

**Question.** May LenderTrustHub expose a name-searchable, institution-only projection of records that today
are reachable only by exact NMLS/LEI (`lender_national_entities` via `lender_identifiers`)?

**How `internal_only` is enforced today.** RLS is enabled on every identity-graph table with a single
policy per table, "Service role manage …" (`supabase/migrations/20260826120000_national_institution_identity_spine.sql`).
There is no anon/authenticated policy, so the browser can never read them. The only reader is the server-side
`canonicalExactIdentityStore` (`lib/specialist-execution/identity-store.ts`), which issues an **equality** lookup
on `identifier_value` (limit 10). `public_projection_status` defaults to `internal_only` (allowed values
`internal_only | bridged | projected`) and is a label, not the enforcement. `docs/LEND-CAP-002-IMPLEMENTATION-AUDIT.md`
is the accepted policy: public destinations come from file-backed manifests; exact identifier execution may
return a research identity without a route. **That policy is what would need an explicit amendment** — it
authorizes exact-key resolution and says nothing that permits name enumeration.

**Smallest eligible projection proposed for review** (a committed, file-backed manifest like the existing
ones — no RLS/grant change, no client access, no per-request table scan):
- include: `entity_kind = 'institution'`; at least one `NMLS_INSTITUTION` or `LEI` identifier;
  `source_dataset` in an independently public family already served by exact research (`public_catalog`, HMDA/GLEIF);
  no open row in `lender_identity_conflicts`; no review hold;
- fields: stable entity key, source legal/display name with provenance, NMLS/LEI, `observed_at` where present,
  recorded business location only where the source family already permits it, research-by-identifier and
  official-registry actions;
- exclude: `NMLS_PERSON`, `NMLS_BRANCH`, unresolved or mixed classes, claim/account/contact/private fields,
  disputed relationships;
- semantics: discoverability ≠ profile, endorsement, current-license statement or complaint bridge.
The engine already accepts such rows as `unpublished_research_identity` with no code change to matching.

**Unresolved acceptance cases kept on the backlog:** Altura Credit Union (NMLS 401403) and AnnieMac Home
Mortgage (NMLS 338923), verified only through the public exact-identifier operation. No row was copied, no
brand→legal-name bridge invented. Whether any other specific name exists in the internal graph was not
checked, because a name lookup there is the unapproved enumeration.

### Disputed profile/LEI relationships — current policy

An `identity_hold` means: a published profile carries an LEI whose HMDA/GLEIF legal name is a different
institution. It is a hold on the RELATIONSHIP, not on either record. So (a) the HMDA reporter is an
independently public record and stays discoverable under `hmda-lei:<LEI>` with its own name and LEI;
(b) it gets no profile link, no NMLS and no bridge from the disputed profile; (c) the published profile
stays discoverable by its own names but its card omits the disputed LEI; (d) a hold is never treated as
permission to publish a held profile. No merge by name or address similarity. Data repair is separately scoped.

## 1. What was wrong (reproduced on the unchanged base — `baseline-f691942.json`)

- **Native `/ask` refused ordinary names.** Only five hardcoded famous names were treated as
  institutions. `BMO Bank`, `Alliant Credit Union`, `Frost Bank`, `"BMO Bank"`, `Find BMO Bank` →
  `fail_closed / unsupported`. `Guild Mortgage Company LLC` became an UNFILTERED list of the national
  top lenders (Rocket, UWM, Freedom) — a directory presented for a name.
- **The network identity-name call was exact-only over 311 published profiles.**
  `Randolph-Brooks FCU`, `rocket mortgage llc`, and every HMDA-only institution → `NO_CONFIDENT_MATCH`.
  That is the R1-019A result: 5/20 displayed, 5/20 lowercase, 0/12 suffix-removed.
- The same `exactNameMatches` helper also gates complaint evidence, so it could not simply be loosened.

## 2. Source / projection-permission matrix

| Source (version) | Institution key | Names available | Name discovery | Public fields | Profile |
|---|---|---|---|---|---|
| National published profiles — `docs/lend-nat-016-search-index.json` (`lend-nat-014-v1`, 181 rows) | `stable_key` | canonical, presentation, historical (6 rows have one), slug | **Approved** — existing render gate (`lenderIdentitySource`) | name, type, NMLS, LEI | yes |
| Florida OFR companies — `docs/fl-lend-011-florida-search-index.json` (`fl-lend-search-fl-v1`, 130 rows) | `stable_key` | canonical, presentation, slug | **Approved** — same gate | name, type, NMLS | yes |
| HMDA reporting institutions — `lib/ask-lender/generated/gleif.json` (745) + `mappings.csv.json` (76) | LEI | HMDA/GLEIF legal name | **Approved** — Lender already publishes these by name in native HMDA tables and the v2 cohort operation | name, LEI, NMLS only from a curated mapping | **no** → inline research row, no profile link |
| `identity_hold` (12 LEIs) | LEI | HMDA/GLEIF legal name | Approved as a research row only | name, LEI | none attached (existing rule) |
| Canonical exact-identity store — Supabase `lender_identifiers` / `lender_national_entities` (service role) | entity id | legal/display name | **NOT approved — exact-ID only.** `LEND-CAP-002`: graph entities are `internal_only`; only an accepted manifest row gets a destination | — | — |
| NMLS person/MLO, NMLS branch | — | — | **Prohibited** | — | — |

Catalog = 311 profiles + 663 HMDA-only + 12 identity-hold = **986 institutions**, in memory, from
committed files. No DB or network call. Catalog fingerprint `6a92189a9aa0…` (run-time value in every response).

### Altura and the unresolved policy decision (dependency **L1-P**)

Verified read-only through the live exact-identifier operation (2026-09-19T00:10Z):
Altura Credit Union NMLS 401403 and AnnieMac Home Mortgage NMLS 338923 both resolve as
`unpublished_research_identity`, `sourceDataset: public_catalog`. They exist ONLY in the internal
identity graph. Name search returns `NO_MATCH` for them — that is a **policy-blocked scope, not a
genuine miss and not completed functionality**.

Decision needed from the coordinator: may `lender_national_entities` rows with
`entity_kind = institution`, an `NMLS_INSTITUTION` identifier and no review hold be enumerated by
`legal_name` / `display_name` for name candidates (as inline research rows, no profile)? If yes, the
follow-up is a bounded, name-filtered, server-side projection feeding this same engine. It was not
built or silently authorized here.

Acrisure Mortgage and Martini Mortgage Group: absent from every approved name source. Whether they
exist in the internal graph was NOT checked, because checking by name is the unapproved enumeration.
AnnieMac: its HMDA/GLEIF legal name `AMERICAN NEIGHBORHOOD MORTGAGE ACCEPTANCE COMPANY LLC` IS
discoverable; "AnnieMac" is a brand with no source alias, so no bridge was created.

### Pre-existing data finding (not changed here)

12 published national profiles carry an LEI whose HMDA/GLEIF name belongs to a different institution
(e.g. the PennyMac profile carries Fairway's LEI; Freedom Mortgage carries Guild's). The existing
identity code already holds these (`identity_hold`). The candidate catalog therefore does not repeat a
held LEI on the profile card, and lists the HMDA institution as its own research row. The index data
itself needs an owner's correction — out of scope (no data writes).

## 3. Design: one engine, separate from identity and evidence

```
lib/name-candidates/normalize.ts   pure: case/punct, terminal legal suffix, FCU + initialism search forms, generic words
lib/name-candidates/engine.ts      pure: searchNameCandidates(catalog, name, {page, limit})   <-- THE matcher
lib/name-candidates/catalog.ts     approved sources -> CatalogInstitution[]
lib/name-candidates/native.ts      native /ask + /api/ask adapter  -> same engine
lib/name-candidates/operation.ts   network operation               -> same engine
app/api/specialist-execution/name-candidates/v1/route.ts
```

- The predicate runs over the WHOLE catalog, then sorts, then pages. A miss returns nothing.
- Methods, strongest first: `EXACT_NORMALIZED_NAME`, `DOCUMENTED_HISTORICAL_NAME`,
  `LEGAL_SUFFIX_NORMALIZED` / `ABBREVIATION_NORMALIZED`, `DERIVED_SLUG_FORM`, `WORD_PREFIX`,
  `DISTINCTIVE_TOKENS`. Word boundaries only — never mid-word. Generic words (Bank, Mortgage, Credit,
  LLC…) cannot drive partial candidates, but a generic-looking FULL name still matches its exact record.
  Places, numbers, hyphens and apostrophes stay in names.
- FCU = Federal Credit Union and `V.I.P.` = `VIP` are labeled search-form rules, never aliases. A
  slug-derived form is labeled `isDocumentedSourceName: false`. The real matched source text is returned.
- Dedup only on the verified institution key. The only merge is the existing, already-verified LEI
  bridge to a published profile. Same-name institutions stay separate and set `AMBIGUOUS_EXACT_NAME`.
- **Evidence is untouched.** `exactNameMatches`, `executeComplaintEvidence`, the curated exact/DBA CFPB
  bridge and `trusthub-specialist-execution-v2` are byte-identical. `identity-execution.ts` does not
  import the candidate engine (asserted). A candidate result never carries complaint data.
- The parser (`parse.ts`) is untouched, including its five legacy hardcoded names; those inputs now flow
  through the same engine (`PARSER_ENTITY_NAME`), so there is one native name path, not two.
- Native decision (`decideNativeNameSearch`): identifiers keep precedence; counts, property geography,
  definitions, licensing/evidence questions and advice refusals are not reinterpreted. A name is
  searched when nothing else understood the text, when it is quoted / `Find …`, or when the WHOLE text
  is an institution's source name. `BMO Bank in Texas` searches the name and shows `in Texas` as
  **Not applied**. Source failure → `UNAVAILABLE` (503 on the API), never `NO_MATCH`.

## 4. Known cases

| Name | Expected | Result |
|---|---|---|
| Randolph-Brooks FCU / …Federal Credit Union | NMLS 583215 | found (`ABBREVIATION_NORMALIZED` / exact). A second published record `RANDOLPH-BROOKS` (no NMLS) has the same name → both shown, `AMBIGUOUS_EXACT_NAME`; not merged |
| BMO Bank, `bmo` | NMLS 401052 | found (exact; word prefix) |
| Alliant Credit Union | NMLS 197185 | found |
| Rocket Mortgage, `rocket mortgage llc`, `Rocket Mortg` | NMLS 3030 | found (protected positive kept) |
| Altura Credit Union | NMLS 401403 | **policy-blocked (L1-P)** — `NO_MATCH`, reported as a dependency |
| AnnieMac Home Mortgage | NMLS 338923 | **policy-blocked (L1-P)**; legal-name HMDA row is discoverable; no brand bridge |
| Acrisure Mortgage, Martini Mortgage Group | — | absent from approved sources; not fabricated |

## 5. Frozen holdout (single bounded runs, committed catalog, no live hub)

Run 3 (review 1, corrected engine, single run) is identical to run 2 in every cell; runs 1–3 are all preserved.

`holdout-frozen.json`: the R1-019A Lender sample copied UNCHANGED (sha256 of the Ask file recorded) plus
39 records drawn by fixed positions from the sources before any evaluation. Expected identity = the
record's own key. Both runs preserved: run 1 found one defect; run 2 follows the general fix.

R1-019A sample (n = 20; every original key kept in the denominator):

| Variant | R1-019A (Ask run 7) | R1-019C run 1 | run 2 | first page | native = service |
|---|---|---|---|---|---|
| displayed | 5/20 | 20/20 | 20/20 | 20 | 20/20 |
| lowercase | 5/20 | 20/20 | 20/20 | 20 | 20/20 |
| suffix-removed | 0/12 | 12/12 | 12/12 | 12 | 12/12 |
| punctuation | — | 8/8 | 8/8 | 8 | 8/8 |

Additional sample (n = 39): displayed 39/39, lowercase 39/39, suffix-removed 16/16, FCU 2/2,
punctuation **16/17 in run 1** (`VIP MORTGAGE INC` vs `V.I.P. MORTGAGE, INC.`) → 17/17 in run 2 after the
initialism rule (red-first test 01b). Irrelevant first-page candidates 0/… in every variant; native
treated every input as a name search (0 redundant clarifications); 0 source failures; nothing needed
paging to be reached. Small diagnostic samples; no statistical claim.

## 6. Tests, mutations, regressions

- `npm run check:th-search-r1-019c` → 30 candidate tests + 8 existing identity-execution tests = **38/38**. The gate
  now runs in the PR workflow (`.github/workflows/lender-network-metrics.yml`).
- Mutations (`mutation-report.json`), **7/7 DETECTED**, each restored byte-identical (sha1), gate clean after:
  A exact-only candidates, B name filter dropped, C candidates attaching complaints, D keyword gate restored,
  E parser-entity route dropping conditions, F unreachable next page, G source failure treated as "not a name".
- Existing gates on this branch: R1-002 24, R1-003 26, R1-004 26, R1-015 106, TH-SEARCH-001C 4,
  customer-integration 6, `assert:ask-lender`, `lend-cap-002`, `th-p0-lender-01`, `ask-handoff`,
  lend-nat 002/002b/012/014/016, phase0, journey-v21, metrics-r2-03, network-metrics, intel-004,
  lend-home-003, florida-intel, fl-lend-002e, state asserts (OH, NJ, PA) and the full `npm test` → pass.
- **Inherited failures, identical on the unchanged base `f691942`:** `check:lend-cap-001` (check
  `43-identifier-truth`, a v2 limitation string) and `assert:lend-nat-003` (requires `DATABASE_URL`).
- `tsc --noEmit` clean · ESLint 0 errors (1 inherited warning) · optimized `next build` OK.

## 7. Browser and HTTP evidence (optimized local build of this branch, 2026-09-19 ~00:28–00:45Z)

Production was NOT changed; these are local results against committed read-only sources.

- **Consumer harness** (`consumer-harness.json`, real HTTP, re-run on the corrected build): 63/63, now including
  following `hasMore` with limit 1 to the exact end, a flagged empty beyond-end page, a rejected page past the
  window, malformed identifier attempts refused and a person request returning `NO_MATCH`. Contract/version/fingerprint pinned,
  name-filter echo proven, all six states, GET = POST, paging without overlap, `no-store`, unknown fields
  rejected, identifiers/people refused, v2 identity-name still exact and its fingerprint unchanged.
  19–110 ms per call. It imports Ask's CURRENT relevance guard read-only: one candidate form would be
  rejected by Ask today (`VIP Mortgage Inc` → `V.I.P. MORTGAGE, INC.`) — see §8.
- **Headless browser, review 1** (`browser-playwright.json`; Playwright 1.62 Chromium, fresh context per viewport,
  deviceScaleFactor 1, 1280 and 390; `scripts/r19c-browser.mjs`). Text was TYPED and submitted with a REAL Enter
  (`keydown.isTrusted === true` recorded); links and Next were REAL mouse clicks. BMO Bank → NMLS 401052;
  result action click → `/lender/bmo-bank`; Back and refresh keep the search. Keyword-shaped organizations
  (nonproduction fixture `keyword-shapes`): `Branch River Bank`, `Charter Bank` found; partial `Branch River` → both
  Branch River records. `Rocket Mortgage company in Texas` → "Not applied: in Texas". Miss keeps the name.
  Controlled outage (fixture `source-unavailable`): "We could not search for “BMO Bank” right now", `/api/ask` 503.
  Capped window (fixture `large-window`, 230 matches): 8 pages walked by clicking Next, 200 distinct records,
  last pager "Page 8 of 8", no Next offered, "not exhaustive" disclosed. `NMLS 3030`, a Texas cohort and a
  definition stay on their existing paths. 320 px: page does not overflow in 5 states. No console errors.
  Fixtures are refused when `VERCEL_ENV=production` (test R6).
- **Canonical link, checked separately (not the local build):** `https://www.lendertrusthub.com/lender/bmo-bank`
  and `/lender/rocket-mortgage` → HTTP 200 at 2026-09-19T12:58Z. The local build has no database credentials, so
  every profile page 404s there; that local 404 is not evidence about the destination either way.
- **Earlier native browser pass (first submission, superseded for interaction claims):** `BMO Bank` submitted from the real form → 1 candidate, NMLS 401052, no identifier
  prompt. Result action clicked → `/lender/bmo-bank`. `First` → 74 records; pager Next (clicked) →
  page 2, rank 26, "name candidate records"; refresh keeps page 2; History Back restores the prior
  query; editing the box starts clean. 25 rows on page 2: 6 profile links, 19 official GLEIF links ending
  in the record's LEI, 0 invented profile URLs. `BMO Bank in Texas` → name searched, `in Texas` "Not
  applied". Miss keeps the name. `NMLS 3030` / `NMLS 99999999`, counts, cohort, definition, complaint and
  advice inputs stay on their existing paths. 1280 / 390 / 320 px: no page overflow (the table keeps its
  existing focusable horizontal scroller). No console errors.
- **Interaction honesty:** the automation window was in the background, so trusted key events were not
  delivered. Form submits used `form.requestSubmit()` on the real plain-HTML GET form (no JS submit
  handler) and link clicks were dispatched in-page; several variants were read by same-origin page
  fetch + parse. A real Enter keypress was NOT demonstrated in this pass.
- **Local limit:** this worktree has no database credentials, so EVERY profile page (including the
  protected Rocket Mortgage one) 404s locally. The same paths return 200 in production. The candidate
  action reuses the existing `nationalProfilePath`.
- **Delayed-response race:** not applicable to native — results are full server renders keyed by URL with
  no client-side result state. Observed: content always equals the URL's query. My scripted
  double-navigation probe did not fire its second step and proves nothing more. Source-failure rendering
  is covered by unit test 12 (injected loader), not by a live fault.

## 8. Handoff to the Ask owner (NOT done here)

`POST|GET https://www.lendertrusthub.com/api/specialist-execution/name-candidates/v1`
contract `lender-name-candidates-v1`, version `1.0.0`, schemaFingerprint
`09e9764c94ec410bfb6426c890ab85c527004af61bbd958d27767842f3489a4b` (changed in review 1: pagination keys joined the
schema; no consumer pins it yet). Request:
`{ "operation": "name_candidates", "name": "<2-120 chars>", "page": 1..ceil(200/limit), "limit": 1-25 }` (nothing else).
Exact fixtures (request + status + body): `fixture-response-{ambiguous,research-row,no-match,restricted,last-page}.json`.

1. New adapter call; keep v2 for identifier/evidence. Pin contract + version + this fingerprint.
2. `nameFilterApplied = name.predicateApplied === true && name.supplied === <sent>`.
3. States: `CANDIDATES` / `AMBIGUOUS_EXACT_NAME` → candidates (keep them separate; show the ambiguity);
   `NO_MATCH` → completed miss; `RESTRICTED_SCOPE` → policy restricted; `SOURCE_UNAVAILABLE` (503) →
   technical failure; `INVALID_REQUEST` (400) → adapter bug, not a miss.
4. Map: `stableKey`; `matchedName = match.value`; `matchedField = match.sourceLabel`;
   method `EXACT_NORMALIZED_NAME|LEGAL_SUFFIX_NORMALIZED|ABBREVIATION_NORMALIZED → NORMALIZED_NAME`,
   `DOCUMENTED_HISTORICAL_NAME → DOCUMENTED_ALIAS` (WITH the returned value), `WORD_PREFIX|DISTINCTIVE_TOKENS
   → PREFIX_OR_TOKEN`, `DERIVED_SLUG_FORM → HUB_NAME_MATCH`. Never relabel to pass a guard.
5. Paging: follow `pagination.hasMore` only. `total` is the exact match count; `reachable = min(total, 200)`;
   `truncated: true` means the list is NOT exhaustive (show the refine message, use `continuation.url`);
   `outOfRange: true` is an empty page past the end. Never compute a next page from `total`.
   `NO_MATCH` is a miss within `scope.searched` only — present it as such, not as "no such lender".
6. Actions: `PROFILE` (lendertrusthub.com) or `OFFICIAL_IDENTIFIER_VERIFICATION` (`search.gleif.org`, LEI in
   the URL hash) — Ask's `OFFICIAL_ORIGINS.lender` needs that origin, and its URL sanitizer must keep the hash.
7. Ask's `rowRelatesToName` rejects hub full-name methods whose tokens differ only by initialism
   (`VIP` vs `V.I.P.`). Trust `match.method` rank ≤ 3 from a proven-filter response, or fold initialisms.
8. `source.clock.value` is `null` (the files carry no as-of date) — label accordingly, do not invent one.
9. Then Ask fixtures/tests and a separately reviewed Ask release. Until then Ask still reports Lender
   through the exact v2 call.

## 9. Boundaries, rollback, remaining scope

No anonymous grants, RLS, auth or handoff change; PR #47 (TRUST-SEC-001) untouched. No service-role
credential reaches the client; the catalog never touches the store. No people, branches, held or
claim/account data. Rollback: revert this branch's commits — the endpoint and native name path
disappear, v2 and evidence were never changed.

Open after this PR: **L1-P** policy decision (internal-graph institutions such as Altura/AnnieMac);
Ask adapter activation; the 12 mismatched LEIs in the national index; native complaint-by-name for
institutions other than the existing hardcoded case (candidates never attach evidence, so this was left
alone); `check:lend-cap-001` #43 and `assert:lend-nat-003` inherited failures. Contractor (R1-019B) is
Builder 2's; other hubs, network certification and Move's docket correction are separately controlled.
