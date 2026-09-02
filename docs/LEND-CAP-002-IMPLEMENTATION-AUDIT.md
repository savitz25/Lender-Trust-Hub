# LEND-CAP-002 implementation audit

Audit date: 2026-09-01
Accepted starting main: `945be89535018b1f78db8d507d2b6942a7e6379a`
Database mode: read-only (`default_transaction_read_only=on`)
Planned writes: none

## Identity grains

The canonical Lender identity graph contains 14,623 institution entities. The
identifier inventory is:

| Identifier slot | Rows | Distinct values | Distinct entities | Latest source observation |
| --- | ---: | ---: | ---: | --- |
| `NMLS_INSTITUTION` | 6,641 | 6,641 | 6,641 | 2026-08-27 |
| `LEI` | 4,715 | 4,715 | 3,042 | 2026-08-26 (plus HMDA 2025 observations) |
| `NMLS_BRANCH` | 6,683 | 6,683 | 6,682 | 2026-08-27 |
| `NMLS_PERSON` | 136,763 | 136,763 | 136,763 | 2026-08-30 |

NMLS institution, branch, and person are separate identifier namespaces. LEI
is the HMDA reporting identity and is not an NMLS identifier. There are no
same-namespace identifier-to-multiple-entity duplicates. There are 14 numeric
values present in more than one NMLS namespace: five institution/person
collisions and nine institution/branch collisions. Those values require an
`IDENTITY_COLLISION` response; the executor must not select an arbitrary class.

The graph also contains recorded identity conflicts, including quarantined or
review-required NMLS institution and LEI cases. A conflict/hold must not acquire
a public destination through exact execution.

## Publication and destinations

All canonical graph entities use the internal graph projection state. Public
destinations are controlled by file-backed accepted publication manifests, not
by `lender_national_entities.public_projection_status`:

- 181 national renderable profiles;
- 180 national indexable profiles;
- one national render/noindex hold;
- 130 Florida public state-profile rows;
- 311 unique accepted public search destinations in the union.

An exact institution identifier may therefore resolve to a research identity
without a public route. That is not a no-match. Only an exact match to an
already accepted manifest row can return a LenderTrustHub profile destination.
Branch and MLO/person routes remain prohibited.

## Exact identifier execution contract

- Labeled NMLS values must be digits only and remain class-aware.
- Institution NMLS returns an exact institution identity and a public
  destination only when the accepted manifest has one.
- Branch NMLS returns `PUBLICATION_RESTRICTED` without branch/private data.
- Person NMLS returns `PUBLICATION_RESTRICTED` without a name or contact data.
- A value present in multiple NMLS namespaces returns `IDENTITY_COLLISION`.
- Valid no-match returns `NO_CONFIDENT_MATCH`; malformed input returns
  `INVALID_QUERY`; neither may fall back to name or HMDA cohort execution.
- LEI is a labeled, exact 20-character alphanumeric identifier. It resolves
  only through the accepted LEI identifier/identity bridge. A public route is
  optional.

Representative audited fixtures include public institution NMLS `3030` and
LEI `549300FGXN1K3HLB1R50`, unpublished institution NMLS `971307`, branch NMLS
`1001618`, and person NMLS `1005784`. `NMLS 170008` is person-grain in the
current graph and must not be substituted with an institution.

## CFPB bridge and evidence grain

The committed CFPB bridge contains 61 mappings:

- 49 `curated-exact`;
- 7 `curated-dba`;
- 4 `curated-multi`;
- 1 `curated-affiliate`.

LEND-CAP-002 accepts only the 56 exact/DBA mappings. Multi-label lineage and
affiliate mappings remain excluded from named-lender execution. The committed
CFPB Mortgage snapshot contains 64 company-label aggregates; all 56 accepted
exact/DBA labels are present and 10 snapshot labels are unattached to an
accepted exact/DBA identity bridge.

The available accepted artifact is aggregate company-label evidence, not a raw
consumer complaint-row export. V2 will return bounded source-label summary rows
(counts, issue buckets, response buckets, timeliness, and dates). It will not
invent complaint-level rows or expose narratives/private consumer information.

Rocket Mortgage resolves through the exact public institution identity, NMLS
`3030`, LEI `549300FGXN1K3HLB1R50`, and the `curated-exact` CFPB label
`Rocket Mortgage, LLC`. The snapshot was generated
`2026-08-10T00:08:37.996Z`; its recent window begins `2024-08-10`. The Rocket
label contains 7,302 all-time mortgage complaint observations and 3,083 in the
snapshot's recent window. These are consumer-submitted observations, not a
finding of wrongdoing or a size-adjusted quality measure.

An exact institution with no accepted exact/DBA CFPB mapping returns an exact
identity plus `ZERO_MATCHING_ROWS` for the evidence dimension. That does not
mean a clean record. Unknown, typo, affiliate-only, or ambiguous names receive
no complaint evidence.

## Execution architecture and safety gate

The existing `lender-ask-v1` HMDA cohort engine remains unchanged. The V2
adapter will add a read-only exact-identity executor over the canonical graph
and a static, curated CFPB summary executor over the committed snapshot. The
server will make bounded exact-key queries only; no fuzzy database scan and no
N+1 query path is allowed.

Required release deltas remain:

- DB writes: 0;
- identity rows: 0;
- institution profiles: 0;
- Florida state profiles: 0;
- branch routes: 0;
- person/MLO routes and public candidates: 0;
- sitemap URLs: 0;
- publication rules: 0.
