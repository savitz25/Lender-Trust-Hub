# Florida LEI → NMLS matching summary

**Candidates:** `data/hmda/florida/lei_mapping_candidates_fl.csv`
**Mapping:** `lei_to_nmls_mapping.csv`
**Unmatched high-priority:** `lei_unmatched_high_priority.csv`

## Counts

| Metric | Count |
|--------|------:|
| FL LEI candidates | 1794 |
| High-priority LEIs | 851 |
| **High-confidence matches** | **46** |
| Medium-confidence matches | 3 |
| **Total mapping rows** | **49** |
| Linked to directory slug | 16 |
| High-priority unmatched | 802 |
| Directory NMLS records parsed | 217 |
| FL originations covered by matches | 270,340 (~55.9% of high-priority FL volume) |

## Method mix

- `curated_lei_public_nmls`: 33
- `curated_lei+directory_name`: 10
- `gleif_name_to_directory`: 6

## Top 20 matched by Florida originations

| # | Name | NMLS | Slug | FL orig. | Conf. | Method |
|--:|------|------|------|--------:|-------|--------|
| 1 | United Wholesale Mortgage, LLC | 3038 | — | 49,897 | high | curated_lei_public_nmls |
| 2 | Rocket Mortgage, LLC | 3030 | — | 31,530 | high | curated_lei_public_nmls |
| 3 | Freedom Mortgage Corporation | 2767 | — | 11,987 | high | curated_lei_public_nmls |
| 4 | CrossCountry Mortgage (West Valley) | 3029 | crosscountry-mortgage-west-valley | 11,582 | high | curated_lei+directory_name |
| 5 | loanDepot.com, LLC | 174457 | — | 10,692 | high | curated_lei_public_nmls |
| 6 | Fairway Independent Mortgage — Augusta (Sheppard Team) | 2909 | fairway-mortgage-augusta-sheppard | 9,704 | high | curated_lei+directory_name |
| 7 | Navy Federal Credit Union (Jacksonville Area) | 399807 | navy-federal-jacksonville | 8,416 | high | curated_lei+directory_name |
| 8 | Guaranteed Rate, Inc. | 2611 | — | 7,938 | high | curated_lei_public_nmls |
| 9 | PennyMac Loan Services, LLC | 35953 | — | 7,460 | high | curated_lei_public_nmls |
| 10 | JPMorgan Chase Bank, National Association | 399798 | — | 6,131 | high | curated_lei_public_nmls |
| 11 | Truist Bank | 405457 | — | 6,117 | high | curated_lei_public_nmls |
| 12 | Regions Bank | 467341 | — | 5,826 | high | curated_lei_public_nmls |
| 13 | Newrez LLC | 2289 | — | 5,643 | high | curated_lei_public_nmls |
| 14 | Movement Mortgage — Myrtle Beach | 39179 | movement-mortgage-myrtle-beach | 5,506 | high | curated_lei+directory_name |
| 15 | Guild Mortgage (West Valley Branches) | 3274 | guild-mortgage-west-valley | 5,374 | high | curated_lei+directory_name |
| 16 | CMG Home Loans (Dennis Vo Team) | 2458338 | cmg-home-loans-dennis-vo | 4,627 | high | curated_lei+directory_name |
| 17 | AmeriHome Mortgage Company, LLC | 1120271 | — | 4,388 | high | curated_lei_public_nmls |
| 18 | Paramount Residential Mortgage Group (PRMG) | 75243 | prmg | 4,200 | high | curated_lei+directory_name |
| 19 | Cardinal Financial Company, Limited Partnership | 66247 | — | 4,122 | high | curated_lei_public_nmls |
| 20 | Broker Solutions, Inc. | 6606 | — | 3,881 | high | curated_lei_public_nmls |

## Top unmatched high-priority (manual review)

| # | GLEIF / blank | LEI | FL orig. |
|--:|---------------|-----|--------:|
| 1 | SUNCOAST CREDIT UNION | `549300TOOOOW36EX…` | 8364 |
| 2 | SPACE COAST CREDIT UNION | `549300VN9E1DEKF2…` | 5900 |
| 3 | A&D Mortgage LLC | `2549005SIVTHG14U…` | 5245 |
| 4 | VYSTAR CREDIT UNION | `54930036K3ZFJ4FO…` | 3214 |
| 5 | FIGURE LENDING LLC | `254900UL88QFG0E4…` | 2872 |
| 6 | THE MORTGAGE FIRM, INC. | `5493007CXTOHZ2JB…` | 2851 |
| 7 | KIND LENDING, LLC | `549300MZ8VZJOVC6…` | 2662 |
| 8 | UNION HOME MORTGAGE CORP. | `549300RPOGWJRH63…` | 2495 |
| 9 | HOMEBRIDGE FINANCIAL SERVICES, INC. | `5493001WHVQBGRSW…` | 2433 |
| 10 | Kiavi Funding, Inc. | `5493006VAGP3GQ8F…` | 2385 |
| 11 | Coastal Community Bank | `5493001GCBD5XGNI…` | 2383 |
| 12 | Citizens First Bank | `549300IQVXIW1VTW…` | 2267 |
| 13 | CHAMPIONS FUNDING, LLC | `984500U2F9A83N39…` | 2262 |
| 14 | 21ST MORTGAGE CORPORATION | `549300XQVJ1XBNFA…` | 2098 |
| 15 | CLICK N' CLOSE, INC. | `54930049L5WINET0…` | 2049 |

## Notes

- Conservative: no forced fuzzy matches under score thresholds.
- `our_lender_slug` empty = company NMLS known but no site profile yet (or multi-branch).
- Candidate files were not modified.
- Re-run: `python scripts/match_lei_to_nmls.py`
