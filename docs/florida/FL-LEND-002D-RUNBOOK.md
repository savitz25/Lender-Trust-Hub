# FL-LEND-002D runbook — LenderTrustHub Production

Project: **Lender-Trust-Hub** · ref **hidcrbexurginnuqgipx**  
Do not use Move / Investor / Contractor projects.

This pack does the remaining work in the SQL Editor. Do not invent institutions. Do not start FL-LEND-003 until results are returned.

## Expected staging totals (already generated)

| Artifact | Rows |
| --- | ---: |
| `fl_company_nmls.csv` | **10,216** |
| `fl_company_credentials.csv` | MLD monthly 2,805; MBR monthly 8,672; plus NMLS MLD/MBR/MLS |
| `fl_branches.csv` | PRR distinct branch NMLS **6,690**; plus monthly MLDB/MBRB history |
| `fl_business_contacts.csv` | business only, `review_before_public` |
| `fl_mlo_private_*.csv` | monthly LO + NMLS LO (chunked, **gitignored**) |
| `fl_mlo_sponsorship_private_*.csv` | **53,421** (chunked, gitignored) |
| `fl_person_contacts_private_*.csv` | `internal_only` (chunked, gitignored) |

Dual MLD+MBR source NMLS: **637** → one institution + two credentials after exact attach.

## Steps (no architecture choices)

1. Open [Supabase](https://supabase.com/dashboard/project/hidcrbexurginnuqgipx) → SQL Editor.
2. Paste and run `docs/florida/fl-lend-002d/FL-LEND-002D-01-schema.sql`.
3. Table Editor → import CSVs into the matching staging tables (header row on):
   - `data/generated/fl-lend-002d/public/fl_company_nmls.csv` → `staging_fl_ofr_companies`
   - `fl_company_credentials.csv` → `staging_fl_ofr_company_credentials`
   - `fl_branches.csv` → `staging_fl_ofr_branches`
   - `fl_business_contacts.csv` → `staging_fl_ofr_business_contacts`
   - private chunks in order into `staging_fl_ofr_mlos`, `staging_fl_ofr_sponsorships`, `staging_fl_ofr_person_contacts`
4. Run `FL-LEND-002D-08-dry-run.sql`. Confirm:
   - source companies = 10,216
   - PRR branch NMLS = 6,690
   - sponsorships = 53,421
   - multi-parent = 0
   - exact attached / unresolved / conflict / malformed **sum to 10,216**
5. If any `MULTI_ENTITY_CONFLICT` > 0: those NMLS stay out of attach. Do not pick an entity by hand.
6. Run `FL-LEND-002D-09-apply.sql` (guard), then **02, 03, 04, 05, 06, 07** in that order.
7. Run `FL-LEND-002D-10-verify-idempotency.sql`. Save the result row.
8. Run **03–07 again**. Run **10** again. Institution/branch/person/identifier/relationship/contact counts must not increase. `person_public_candidate` must stay **0**.
9. Check `/lender/rocket-mortgage`, `/lender/bank-of-america`, `/lender/navy-federal-credit-union`, `/lender/select-portfolio-servicing`, `/lender/phh-home-loans`. No new public Florida fields required.
10. Paste the dry-run 10,216 split and both verify result rows back to Builder.

## Rules already encoded

- Exact `NMLS_INSTITUTION` only. No name/LEI/FDIC attach.
- Unmatched companies remain `UNRESOLVED_SOURCE_COMPANY_NMLS`. No net-new lenders.
- Branch entity only if parent exact-attached.
- MLS credential ≠ national servicer role.
- Sponsorship uses existing `ASSOCIATED_WITH` (as-of 2026-08-27). No `SPONSORED_BY` constraint change.
- Person emails never `public_candidate`.

## After success

Builder merges `fl-lend-002b-reconcile` to `main` and marks **FL-LEND-003 READY**. Do not merge before step 8.
