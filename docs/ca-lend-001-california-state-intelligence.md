# CA-LEND-001 — California mortgage state intelligence

Public route: `/california`

Contract: `lender-ca-state-intel-v1`

Snapshot: `lib/california-intelligence/accepted-snapshot.json`

Acquisition: `scripts/build-ca-public-snapshot.py`

## Universes (not summed)

- HMDA 2025 California property-location geography: 1,014,489 applications / 569,218 originations / 58 counties
- CalHFA approved-lender directory: branch rows, not unique companies, not licenses
- CRMLA 2024 annual report: 389 licensees / 5,104 branches as of 2024-12-31 — not a live roster

Current CRMLA bulk roster: `SOURCE_NOT_ACQUIRED`

## Rules

HMDA ≠ license roster. CalHFA approved lender ≠ endorsement. DRE MLO endorsement ≠ CRMLA company license. NMLS ID ≠ current California authority. Complaint ≠ violation. Missing ≠ zero. No Trust Score. No California county routes.
