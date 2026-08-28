# FL-LEND-001/002 — Florida OFR mortgage source audit

**Status:** audit complete. **No Production ingest.** `--execute` was not used.

PRR **#141420** · Ref **#1341691** · produced **2026-08-28** (Jason Booth: 7 files; 2 NMLS with emails; 5 OFR website downloads).

Originals copied immutably to `data/raw/florida/ofr-prr-141420/originals/` (gitignored). Do not edit them.

## Seven OFR records (verified from content, not filenames)

| File | Origin | Class | Raw rows | Date | Notes |
| --- | --- | --- | ---: | --- | --- |
| `LoanOriginators_AI_Monthly (4).zip` | OFR website monthly | LO A–I | 64,096 | zip 2026-08-28 06:03 | No email. PHONE sparse. |
| `LoanOriginators_JR_Monthly (3).zip` | OFR website monthly | LO J–R | 53,667 | zip 2026-08-28 06:03 | Inner CSV misspells Originators. |
| `LoanOriginators_SZ_Monthly (4).zip` | OFR website monthly | LO S–Z | 32,448 | zip 2026-08-28 06:03 | Same schema. |
| `MortgageFirms_MBR-MBRB_Monthly (8).zip` | OFR website monthly | MBR / MBRB | 10,618 | zip 2026-08-28 06:03 | No email. |
| `MortgageFirms_MLD-MLDB_Monthly (7).zip` | OFR website monthly | MLD / MLDB | 27,135 | zip 2026-08-28 06:05 | Extra `SERVICER` column. |
| **`Loan Originators.csv`** | **NMLS-derived PRR production** | Individual Roster (Regulator) | 61,634 | as-of 2026-08-27; generated 2026-08-28 7:52 | Emails + sponsor company NMLS. Active-only. |
| **`Mortgage Businesses.csv`** | **NMLS-derived PRR production** | Company/Branch Roster | 13,326 | as-of 2026-08-27; generated 2026-08-28 7:53 | Emails/phones + Company Id / Branch Id parent. Active-only. |

`florida FDIC insured Banks.xlsx` last-write **2026-06-26**. **Not PRR #141420.** 198 distinct CERT strings. Do not mix.

## Why the two CSVs are the special files

Headers: `Report Name:Individual Roster (Regulator)` and `Report Name:Company/Branch Roster by License Type (Regulator)`, `Regulator Code:Florida`, `Include Active License Only:True`. Monthly zips are OFR LICENSE NUMBER / LICENSE TYPE / NMLS ID extracts with **no email**.

## Schema vs graph

`public.lenders` is **listing/geo grain** (`slug` + county + one `nmls_id`). It is not canonical institution + namespaced credentials + branches + people.

Proposed additive families (not applied): `regulatory_credentials` (`fl_mld`, `fl_mbr`, `fl_mldb`, `fl_mbrb`, `fl_lo`, plus **source-present** `FL Mortgage Lender Servicer License` / branch), `mortgage_branches`, `mortgage_people`, `SPONSORED_BY` with dates, `public_eligible=false` on person contact.

NMLS roster license names include **Lender Servicer** (512) and **Lender Servicer Branch** (3,961). Preserve as official classes; do not invent, do not collapse into MLD.

## Clocks

Monthly OFR files include Expired/Terminated/etc. NMLS-derived files are **Approved/active-only**. Do not collapse.

## Execution

Dry-run matching only. No migrations. No `--execute`. Identity collisions in the legacy catalog are **geo clones** (same NMLS, many slugs), not extra institutions.
