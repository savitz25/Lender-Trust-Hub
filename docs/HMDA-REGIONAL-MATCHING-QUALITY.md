# Regional lender matching quality pass

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** High-confidence residual LEI→slug matching across deepen priority states + other high-volume markets

## Goal

Close high-ROI mapping gaps where strong regional banks, credit unions, and multi-state originators still appeared as name-only / unmapped rows after the high-volume deepen phase — without lowering match quality.

## Method

1. Rank residual unmatched LEIs by originations in TX/NC/TN/WA/OR/NV/UT (+ CA/FL/GA/AZ/CO/IL/OH/PA/NY/MI/VA/SC/OK).
2. GLEIF-verify legal identities.
3. Attach public company NMLS where published; otherwise LEI-identity-only host (no invented NMLS).
4. Apply curated maps into product-state `lei_to_nmls_mapping.csv` only when the LEI has state activity.
5. Validate zero orphan slugs + nationwide QA PASS.

Rebuild helper: `python scripts/apply-regional-matching-quality.py`

## Mapping results (deepen priority states)

| State | Maps after | New maps | Top-20 | Top-50 |
|-------|------------|----------|--------|--------|
| TX | 232 | +23 | **20/20** | **47/50** |
| NC | 256 | +24 | **20/20** | **45/50** |
| TN | 250 | +20 | **20/20** | **48/50** |
| WA | 189 | +19 | **20/20** | **47/50** |
| OR | 196 | +16 | **20/20** | **47/50** |
| NV | 160 | +16 | **20/20** | **44/50** |
| UT | 169 | +13 | **20/20** | **47/50** |

Also applied residual maps where those LEIs appear in CA, FL, GA, AZ, CO, IL, OH, PA, NY, MI, VA, SC, OK (357 new LEI×state rows total).

## Newly matched high-value lenders (hosts)

| Lender | Slug | NMLS | Notes |
|--------|------|------|--------|
| Frost Bank | `frost-bank` | 431208 | Top TX residual (~6.1k) |
| Credit Union of Texas | `credit-union-of-texas` | 576560 | TX regional CU |
| First Financial Bank (TX) | `first-financial-bank-texas` | LEI-only | Distinct from OH First Financial |
| First United Bank and Trust | `first-united-bank-and-trust` | existing host | TX/OK regional |
| Velocio Mortgage | `velocio-mortgage` | LEI-only | TX/AZ volume |
| Highlands Residential Mortgage | `highlands-residential-mortgage` | LEI-only | TX multi-state |
| KBHS Home Loans | `kbhs-home-loans` | existing host | Propagated to more states |
| Taylor Morrison Home Funding | `taylor-morrison-home-funding` | LEI-only | Builder channel |
| Cornerstone Capital Bank | `cornerstone-capital-bank` | LEI-only | TX/WA multi-state |
| Triad Financial Services | `triad-financial-services` | LEI-only | Multi-state |
| M/I Financial | `mi-financial` | LEI-only | Builder channel |
| Village Capital | `village-capital` | LEI-only | Multi-state |
| Inspire Home Loans | `inspire-home-loans` | LEI-only | Multi-state builder channel |
| Equity Prime Mortgage | `equity-prime-mortgage` | LEI-only | Multi-state |
| Click N' Close | `click-n-close` | LEI-only | Multi-state |
| GoodLeap | `goodleap` | LEI-only | Multi-state |
| Alliant Credit Union | `alliant-credit-union` | 197185 | Multi-state digital CU |
| East West Bank | `east-west-bank` | LEI-only | Multi-state |
| Sierra Pacific Mortgage | `sierra-pacific-mortgage` | LEI-only | Multi-state |
| Summit Funding | `summit-funding` | LEI-only | OR residual |
| Canopy Mortgage | `canopy-mortgage` | LEI-only | UT/WA multi-state |
| Nations Direct Mortgage | `nations-direct-mortgage` | LEI-only | OR top residual |
| Sammamish Mortgage | `sammamish-mortgage` | LEI-only | WA regional |
| Allegacy FCU | `allegacy-federal-credit-union` | 411603 | NC residual |
| Y-12 FCU | `y-12-federal-credit-union` | 441816 | TN residual |
| Fortera CU | `fortera-federal-credit-union` | LEI-only | TN residual |
| Legacy Home Loans | `legacy-home-loans` | LEI-only | TN residual |
| Primis Mortgage | `primis-mortgage` | 1894879 | TN residual |
| Home Federal Bank of TN | `home-federal-bank-tennessee` | LEI-only | TN residual |

## Reviewed but left unmatched (and why)

| Lender / pattern | Why deferred |
|------------------|--------------|
| Figure Lending / Kiavi Funding | Specialty / non-traditional consumer lending; evidence usefulness lower than core residential originators |
| SFMC, LP (Service First) | Ambiguous branding / multi-DBA risk without confident public company NMLS |
| American Security Mortgage (NC) | Insufficient high-confidence NMLS/slug pairing in this pass |
| Coastal Community Bank | Name collisions across markets; deferred |
| Southern Bank and Trust / The Fidelity Bank | Name collisions with existing Fidelity/Southern hosts |
| United Federal Credit Union | Multi-state CU without clean distinct host priority |
| OCMBC / Panorama / Gold Star / Toll Brothers Mortgage | Lower ROI than residual closed this pass; can revisit |
| Farm Credit Mid-America | Specialty ag lender; product positioning edge case |
| OriginPoint / Synergy One / Peak CU | Deferred for NMLS verification / lower residual impact after this pass |

## Validation

- Orphan `our_lender_slug` values across all product maps: **0**
- Nationwide stabilize QA: **PASS** (435 OK / 0 FAIL)
- Multi-state footprint intact; no county expansion in this pass

## Success criteria

| Criterion | Status |
|-----------|--------|
| More high-value regionals resolve evidence | Yes — 357 new LEI×state maps |
| Top-lender lists more useful in deepen states | Yes — all 7 at Top-20 20/20; Top-50 up to 44–48/50 |
| Match quality high | Yes — GLEIF + public NMLS or LEI-identity only |
| No orphans / identity regressions | Yes |
| Nationwide stable | Yes |
