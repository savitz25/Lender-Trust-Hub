# NJ-LEND-002 production runbook

Internal-only New Jersey RMLA / servicer / NJHMFA / HMDA overlay ingest for
LenderTrustHub.

## Safety

- Repository: `savitz25/Lender-Trust-Hub`
- Branch: `nj-lend-002-rmla-servicer-hmfa-hmda`
- Do not run Vercel commands.
- Do not create `/new-jersey`.
- Do not modify `.vercel/project.json`.
- Do not copy database credentials from another repository.
- Do not bypass Incapsula, CAPTCHA, or NMLS Consumer Access controls.
- Do not bulk-harvest Mortgage Loan Originators.
- First snapshots are `baseline_only`. Do not emit historical customer alerts.

## Canonical project

Production execute is allowed only against the LenderTrustHub database
(`hidcrbexurginnuqgipx`). If that session is not present in this worktree,
merge dormant code and leave execute pending.

Apply NJ-LEND-001 (`20260902120000_nj_lend_001_regulatory_event_ledger.sql`)
before this migration if it is still pending.

## Commands

From the repository root:

```bash
python scripts/nj-lend-002.py inspect
python scripts/nj-lend-002.py dry-run
python scripts/nj-lend-002.py execute
python scripts/nj-lend-002.py verify
python scripts/nj-lend-002-tests.py
npx tsx scripts/assert-nj-lend-002.mts
```

HMDA overlay reads the committed slice at `data/hmda/new-jersey/`. Do not
download another national HMDA universe.

## Migration

Additive file:

`supabase/migrations/20260903160000_nj_lend_002_state_authority_program_market.sql`

Apply only through the established LenderTrustHub migration workflow after
confirming the target database identity. Dry-run parse/normalize does not
require a database.

After migrate:

1. Record pre-ingest counts using `docs/sql/nj-lend-002-reconciliation.sql`.
2. `python scripts/nj-lend-002.py dry-run`
3. `python scripts/nj-lend-002.py execute` once.
4. Execute a second time and confirm insert counts are unchanged / conflict-do-nothing.
5. Re-run reconciliation.
6. Confirm `lender_monitoring_events.monitoring_state = baseline_only` and historical alerts = 0.

## Artifacts

Committed:

- `docs/nj-lend-002-public-metric-contract.md`
- `docs/nj-lend-002-rmla-license-roster-request.md`
- `docs/nj-lend-002-mortgage-servicer-annual-report-request.md`
- `docs/nj-lend-002-dobi-complaint-aggregate-request.md`
- `docs/nj-lend-002-source-coverage.md`
- `data/reports/nj-lend-002-audited-state-snapshot.json`
- `data/fixtures/nj-lend-002/`

Gitignored:

- `data/nj-raw/`
- large execute SQL dumps
