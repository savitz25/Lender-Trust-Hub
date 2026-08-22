# ASK-SEARCH-LENDER-001 — LenderTrustHub Network Discovery Pilot

**Status:** PILOT / NOT YET CONSUMED BY ASK PRODUCTION  
**Export:** `data/network-discovery/lender-discovery-pilot.v1.json`  
**Schema:** `ask-network-discovery-v1`  
**Hub:** `lender`

## Source architecture

| Layer | Path | Role |
|-------|------|------|
| Public mortgage catalog | `lib/mockData.ts` → `finalizeLenderCatalog` | Authoritative offline UI catalog (~1049 branch listings) |
| Identity / sanitize | `lib/verification/*` | NMLS clean, conflict resolution, entity dedupe |
| HMDA evidence | `data/hmda/**` + `lib/hmda` | Activity states + loan-type mix (source-backed products) |
| Profiles | `/lenders/[slug]` | Canonical research destination |

**Not used as discovery authority:** live Supabase seed (FL subset), auto seed providers, FDIC state JSON (no per-bank profile route), editorial content registries.

## Identity

```text
lender:nmls-{digits}
source_entity_id: nmls-{digits}
```

- Requires `cleanNmlsId` + `nmlsVerified`
- One row per NMLS via `catalogDistinctEntities` / `pickCanonicalLender`
- Never company-name primary key
- Empty / placeholder NMLS → ineligible

## Entity types

| Lender.type | entity_type | Notes |
|-------------|-------------|-------|
| Lender | `mortgage_company` | |
| Broker | `mortgage_broker` | ≠ company |
| Bank | `bank` | Mortgage-catalog bank originators |
| Credit Union | `bank` | + category `credit_union` |
| — | `auto_loan_company` | **DEFERRED** (soft seed) |
| — | `loan_officer` | **UNSUPPORTED** |

## Geography

| Concept | Source | Discovery field |
|---------|--------|-----------------|
| Physical HQ | `city`, `stateSlug`, `county`, `zipCodes[0]` | entity `city`/`state`/`county`/`zip` |
| HMDA activity state | primary + `otherStates` | `service_areas` `{kind:'state', label:'hmda_activity'}` |
| HMDA county share | `countyShares` | `service_areas` `{kind:'county',...}` |

HQ ≠ licensed footprint. HMDA activity ≠ license list. No invented licensing states.

## Product categories (fail-closed)

Only when HMDA `loanTypeMix.*.Orig > 0`:

- `conventional`, `fha`, `va`, `usda`

**Omitted:** catalog `loanTypes` alone, jumbo/ARM without HMDA, **refinance** (no lender-level HMDA refinanceOrig).

## Eligibility

AND:

1. URL-safe slug  
2. display name  
3. clean NMLS  
4. `nmlsVerified`  
5. physical state **or** HMDA activity geography  

Not used: payment, premium, ratings, reviews, Trust Score, featured.

## Pilot selection

Distinct verified entities → map → stratified round-robin by `entity_type` to **200** (band 100–250). Sort final export by `network_entity_id`.

## Deferred verticals

| Vertical | Status | Why |
|----------|--------|-----|
| Loan officer | UNSUPPORTED | No entity model / profile |
| Auto loan companies | SOFT_SEED_DEFERRED | 14 curated seeds, placeholder contact data, no Trust Report route |
| FDIC banks | NO_PER_ENTITY_PROFILE_DEFERRED | State list pages only; cert identity exists but no `/banks/{cert}` research profile |

## Canonical URLs

`https://www.lendertrusthub.com/lenders/{slug}`  
Reject non-HTTPS, non-canonical hosts, query params.

## Regulatory summary

`NMLS registration verified` — only for verified numeric NMLS rows.

## Security

Thin FIND projection. No phones, emails, consumer data, payment/premium, Trust Score, ranking, raw regulator blobs.

## Ask compatibility

Envelope + entity fields align with Move pilot / Ask `ask-network-discovery-v1`. Hub=`lender`. Ready for future Ask import **after** Move pilot is proven — do not import in this task.

## Known limitations

1. Offline catalog, not live Supabase.  
2. Product categories only for HMDA-mapped entities.  
3. Refinance category unavailable at lender HMDA grain.  
4. Auto / FDIC / loan officers deferred.  
5. Physical ZIP is HQ zip list first entry — not service ZIP.
