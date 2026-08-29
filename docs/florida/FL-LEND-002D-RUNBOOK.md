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

## Exact execution order

Do **not** run 09 before 02. Order:

1. `FL-LEND-002D-01-schema.sql`
2. CSV imports (header row on)
3. `FL-LEND-002D-08-dry-run.sql`
4. `FL-LEND-002D-02-classify.sql`
5. `FL-LEND-002D-09-apply.sql`
6. `FL-LEND-002D-03-company-credentials.sql`
7. `FL-LEND-002D-04-branches.sql`
8. `FL-LEND-002D-05-mlo.sql`
9. `FL-LEND-002D-06-sponsorship.sql`
10. `FL-LEND-002D-07-contacts.sql`
11. `FL-LEND-002D-10-verify-idempotency.sql`
12. `03` again
13. `04` again
14. `05` again
15. `06` again
16. `07` again
17. `10` again

## Steps (no architecture choices)

1. Open [Supabase](https://supabase.com/dashboard/project/hidcrbexurginnuqgipx) → SQL Editor. Project **Lender-Trust-Hub** only.
2. Run `01-schema.sql`. Production `lender_state_licenses_license_class_check` already allows MBR/MBRB/MLD/MLDB/LO/MLS/MLSB — do not DROP it.
3. Import CSVs into staging tables (header row on):
   - `public/fl_company_nmls.csv` → `staging_fl_ofr_companies` (**10,216**)
   - `public/fl_company_credentials.csv` → `staging_fl_ofr_company_credentials` (**17,925**)
   - `public/fl_branches.csv` → `staging_fl_ofr_branches` (**33,029**; **6,690** distinct PRR branch NMLS)
   - `public/fl_business_contacts.csv` → `staging_fl_ofr_business_contacts` (**25,732**, `review_before_public`)
   - `private/fl_mlo_private_*.csv` in order → `staging_fl_ofr_mlos` (**209,758**)
   - `private/fl_mlo_sponsorship_private_*.csv` in order → `staging_fl_ofr_sponsorships` (**53,421**)
   - `private/fl_person_contacts_private_*.csv` in order → `staging_fl_ofr_person_contacts` (**123,215**, `internal_only`)
4. Run `08-dry-run.sql`. It must reproduce:

   | Class | Count |
   | --- | ---: |
   | SOURCE_COMPANY_NMLS | **10,216** |
   | ATTACHED_EXISTING_EXACT_NMLS | **6,309** (61.75%) |
   | UNRESOLVED_SOURCE_COMPANY_NMLS | **3,907** (holds — do not mint) |
   | MULTI_ENTITY_CONFLICT | **0** |
   | MALFORMED | **0** |

   If it does not, **STOP** before 02.
5. Run **02** (writes the ledger; RAISE unless 10216/6309/3907/0/0).
6. Run **09** (guard), then **03 → 04 → 05 → 06 → 07**. Attach only the 6,309 exact matches.
7. Run **10**. Save the result row.
8. Run **03 → 04 → 05 → 06 → 07** again, then **10** again. Counts must not increase. `person_public_candidate` must stay **0**.
9. Check `/lender/rocket-mortgage`, `/lender/bank-of-america`, `/lender/navy-federal-credit-union`, `/lender/select-portfolio-servicing`, `/lender/phh-home-loans`.
10. Paste the 08 row and both 10 rows back to Builder. Do not merge to main until then.

## Rules already encoded

- Exact `NMLS_INSTITUTION` only. No name/LEI/FDIC attach.
- Unmatched companies remain `UNRESOLVED_SOURCE_COMPANY_NMLS`. No net-new lenders.
- Branch entity only if parent exact-attached.
- MLS credential ≠ national servicer role.
- Sponsorship uses existing `ASSOCIATED_WITH` (as-of 2026-08-27). No `SPONSORED_BY` constraint change.
- Person emails never `public_candidate`.

## Production constraint

`lender_state_licenses_license_class_check` already includes MLS/MLSB. Do not add another destructive constraint migration.

## After success (do not run until ingest + idempotency pass)

```
git checkout main
git pull origin main
git merge --no-ff fl-lend-002b-reconcile
git push origin main
```

This preserves CONTACT-001 and the national graph. Do not merge yet.

FL-LEND-003 must not start until that merge and QA pass. Homepage and `/florida` numbers must come from versioned database-backed snapshots, never hardcoded OFR/HMDA/branch/MLO/program/enforcement counts.
