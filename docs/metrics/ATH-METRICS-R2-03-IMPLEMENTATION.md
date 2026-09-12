# ATH-METRICS-R2-03 — Lender contract

The homepage and `/api/network-metrics` consume `data/home/lender-network-metrics-v1.json`, schema `lender-network-metrics-v1`, additive `contractRevision: ATH-METRICS-R2-03`. Ask is intentionally unchanged.

## Reproduce and validate

```sh
npm ci
npm run build:network-metrics
npm run check:metrics-r2-03
npm run assert:network-metrics
npm test
npm run typecheck
npm run lint
npm run build
```

Generation is offline. It reads the reviewed `data/home/lender-metric-census-r2-03.json`, accepted state snapshots and publication catalogs. `--check` retains the artifact's generated timestamp and compares regenerated output; missing counts, changed inputs or unexplained Florida transitions fail non-zero. Source hashes use UTF-8 with LF line endings for Windows/Linux reproducibility. Source retrieval, observation, source vintage, snapshot and generation clocks remain separately available. A new source grain requires an explicit adapter in `scripts/reconcile_network_metrics.mjs`; no homepage number needs manual editing. CI runs this check. Acquisition schedules and maximum-age policies remain Prompt 6 work.

To acquire a replacement census, run `python -X utf8 scripts/export_lender_metric_inputs.py` with the established database environment. Its stdout is JSON; save it as UTF-8 to a review candidate, inspect the change, and accept it as the census before regeneration. The exporter uses a read-only repeatable-read transaction and rolls it back. It never runs the imported snapshot generator's writing main function. A missing optional servicer table produces null; failed queries fail rather than emit zero.

## Florida reconciliation

Both 6,394 and 6,392 intended the same credential-row predicate:

`jurisdiction='FL' AND license_class IN ('MBR','MLD') AND ofr_status='Approved'`.

The immutable Florida snapshot generated 2026-08-30T16:22:07.696760+00:00 retained the earlier PRR141420 state: 5,013 MBR + 1,381 MLD = 6,394. Subsequent accepted PRR141437 ingestion (`scripts/fl-lend-002f.py`) updated the exact-license ledger. MBR6248 / NMLS 2269467 and MBR7249 / NMLS 2597154 changed from `Approved` to `Approved - Surrender/Cancellation Requested`, observed 2026-08-30 and ledger-updated 2026-08-31T23:31:49.142314+00:00. They remain in the ledger and its explicit other-status partition. They are not exact-Approved credentials.

Current: 5,011 MBR + 1,381 MLD = **6,392 credential rows**. Confirmed exact-Approved NMLS identities = **6,265**; held identities = **22**. These are distinct grains. Historical 6,394 - 2 removed + 0 added = 6,392; unexplained remainder **0**. `reconciliation.florida` exports every status bucket, both transitions with exact source record IDs, all contributing source clocks, and the invariant. The historical source snapshot is preserved and is no longer the homepage's credential-count source.

## Grain and coverage contract

National identities (14,623 institutions; 6,641 NMLS institution IDs), HMDA county-by-LEI activity (11,529,787 applications; 6,793,253 originations; 2,008,514 denials), CFPB observations (458,146) and federal enforcement events (17,655) stay separate.

`reconciliation.stateMetrics` exports CO/VA/NY/IL accepted activity, MLO people, dated SCC rows, dated NYDFS classes, bulletin/activity/enforcement observations, FDIC overlays and unknown current rosters. Every entry includes its source artifact/field, grain, capability status and distinct clocks. State HMDA county market summaries are a different accepted input from national county-by-LEI observations: CO 260,212 state-summary applications versus 257,140 national-geography applications. Neither is added to or silently substituted for the other.

`reconciliation.stateCapabilities` distinguishes routes from acquired licensing/regulatory source evidence and current company rosters. `stateSourceAcquired` specifically means acquired state licensing/regulatory evidence, not HMDA/FDIC federal geography or housing-program context. Specialist completion is not inferred. NY/IL current rosters remain SEARCH_ONLY/count null; NJ remains REQUEST_ONLY. Existing v1 NOT_ACQUIRED fields remain coarse legacy fields; the revision supplies precise capability status.

## Ask handoff

- Public URL: `https://www.lendertrusthub.com/api/network-metrics`.
- Source artifact and schema retain v1; revision adds `homepage`, `reconciliation`, `contractRevision`.
- `homepage.evidenceInventory` and `homepage.stateCards` are generated, with Florida reconciled to the census.
- `reconciliation.acceptedSources`, `stateMetrics`, `stateCapabilities`, `florida`, `nationalCensus`, `hmdaPopulationRule` carry the authoritative detail.
- `generatedAt` is the contract-generation UTC clock. Source vintage/observation dates are not deployment freshness. Florida's legacy `ofrSourceAsOf` denotes the newest contributing ledger source-observed date; the full source-clock distribution is exported, not collapsed or claimed as one uniform roster date.
- Ask's pinned fingerprints/old schema verifier and stale fallbacks must be updated in Prompt 5. It must preserve null and publication flags and must not recompute state/company totals from MLOs or activity.

No canonical source snapshots, identity joins, production database rows, or other hub applications were modified.
