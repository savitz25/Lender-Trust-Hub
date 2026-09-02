# NJ-LEND-001 production runbook

Internal-only DOBI OCF and depository enforcement ingest for LenderTrustHub.

## Safety

- Repository: `savitz25/Lender-Trust-Hub`
- Branch: `nj-lend-001-dobi-enforcement`
- Do not run Vercel commands.
- Do not create `/new-jersey`.
- Do not modify `.vercel/project.json`.
- Do not touch ContractorTrustHub or InsuranceTrustHub.
- Do not copy database credentials from another repository.
- First corpus is `baseline_only`. Do not emit historical customer alerts.

## Canonical project

Production execute is allowed only against the LenderTrustHub database
(`hidcrbexurginnuqgipx`). If that session is not present in this worktree,
merge dormant code and leave execute pending.

## Commands

From the repository root:

```bash
python scripts/nj-lend-001.py discover
python scripts/nj-lend-001.py download
python scripts/nj-lend-001.py local-input
python scripts/nj-lend-001.py inspect
python scripts/nj-lend-001.py dry-run
python scripts/nj-lend-001.py execute
python scripts/nj-lend-001.py verify
```

Incremental year:

```bash
python scripts/nj-lend-001.py download --year 2022
```

Skip PDF bodies (index-only inspect):

```bash
python scripts/nj-lend-001.py inspect --skip-pdfs
```

Tests:

```bash
python scripts/nj-lend-001-tests.py
npx tsx scripts/assert-nj-lend-001.mts
```

## Migration

Additive file:

`supabase/migrations/20260902120000_nj_lend_001_regulatory_event_ledger.sql`

Apply only through the established LenderTrustHub migration workflow after
confirming the target database identity. Dry-run parse/normalize does not
require a database.

After migrate:

1. Record pre-ingest counts using `docs/sql/nj-lend-001-reconciliation.sql`.
2. `python scripts/nj-lend-001.py dry-run`
3. `python scripts/nj-lend-001.py execute` once.
4. Execute a second time and confirm insert counts are unchanged / conflict-do-nothing.
5. Re-run reconciliation.

## Artifacts

Committed:

- `docs/nj-dobi-regulatory-document-contract.md`
- `data/contracts/nj-dobi-regulatory-document-v1.schema.json`
- `docs/nj-lend-001-dobi-public-records-request.md`
- `data/fixtures/nj-lend-001/`
- generated summaries under `data/generated/nj-lend-001/` (small JSON)

Gitignored:

- `data/raw/nj_dobi/` HTML and PDF corpus

## Coverage notes

- OCF current pages: `/dobi/division_banking/ocf/enforcement/{year}.html` for 2014–2022.
- OCF archive: `/dobi/division_banking/bankdivenforce_{year}.html` for 2006–2013 (often INDEX_ONLY).
- OCF 2023–2026 year pages 404 as of acquisition: `SOURCE_NOT_ACQUIRED`, not zero actions.
- Depository current snapshot: `/dobi/division_banking/bankdivenforce.html` (listed years are not a claim that unlisted years had zero actions).
- FI list: `/dobi/bankwebinfo.htm`, page published 9/2/2026.
- Licensee search is an active-only POST form (`bnkLicenseeSearchServlet`) behind Incapsula. No bulk roster. No CAPTCHA/WAF bypass.

## Identity

Exact NMLS / FDIC / 7-digit DOBI reference only. Name-only is unresolved or unsafe-rejected. Individuals remain internal-only. Order numbers are event identifiers.
