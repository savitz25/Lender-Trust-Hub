# LEND-NAT-002B — Human SQL Editor package (schema only)

Use this **only** if builder-controlled `DATABASE_URL` apply cannot run.  
**Do not run the backfill in the SQL Editor.** After schema exists, run:

```bash
npx tsx scripts/lend-nat-002b-activate.ts --env-file <production-env> --apply
```

## A. Project / database identifier

| Item | Value |
| --- | --- |
| Provider | Supabase PostgreSQL |
| Project ref | `arepfylnilkjmyduhwbz` |
| Host | `arepfylnilkjmyduhwbz.supabase.co` |
| Evidence | Live `GET https://www.lendertrusthub.com/api/auth/network-handoff/health` returns `supabaseHost: arepfylnilkjmyduhwbz.supabase.co`. Docs: `docs/NETWORK-AUTH.md` — shared with Move. Live `/api/health/supabase` connected, `lenderCount: 0` (directory is not this table). |
| Dashboard | https://supabase.com/dashboard/project/arepfylnilkjmyduhwbz/sql |

This is the **Ask Trust Hub shared** production project (Move + Insurance + Lender auth). Additive `lender_*` tables only.

## B. Migration filename

`supabase/migrations/20260826120000_national_institution_identity_spine.sql`

## C. Migration SHA-256

```
14117cdc8d5c98ce6c00aa2e9e9a25156950e90e42498f452b91188a42eaf7f4
```

Hash of the file bytes in the LEND-NAT-002 commit `b21827e555d1b1ed9a68428ac5196a1ae4562e92`. Re-hash before paste:

```bash
python -c "import hashlib,pathlib; print(hashlib.sha256(pathlib.Path('supabase/migrations/20260826120000_national_institution_identity_spine.sql').read_bytes()).hexdigest())"
```

If the hash differs, **do not paste**.

## D. Human instructions

1. Open the project above — confirm the ref is `arepfylnilkjmyduhwbz`.
2. SQL Editor → New query.
3. Paste the **entire** migration file. Do not edit.
4. Run once.
5. Run the verification SQL in §E. Confirm §F.
6. **Stop.** Do not insert graph rows by hand.

## E. Post-execution verification SQL

```sql
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'lender_national_entities',
    'lender_identifiers',
    'lender_entity_names',
    'lender_source_record_links',
    'legacy_lender_bridges',
    'lender_identity_conflicts',
    'lender_entity_classifications',
    'lender_entity_relationships'
  )
order by 1;

select conrelid::regclass as table_name, contype, conname
from pg_constraint
where conrelid::regclass::text like 'lender_%'
   or conrelid::regclass::text = 'legacy_lender_bridges'
order by 1, 3;

select
  (select count(*) from public.lender_national_entities) as entities,
  (select count(*) from public.lender_identifiers) as identifiers,
  (select count(*) from public.lender_source_record_links) as source_links,
  (select count(*) from public.legacy_lender_bridges) as bridges,
  (select count(*) from public.lender_identity_conflicts) as conflicts;
```

## F. Expected results

- All 8 tables present.
- `rls_enabled = true` on each.
- Unique constraints on `stable_key`, `(identifier_type, identifier_value)`, `(source_dataset, source_record_id)`, `(legacy_source, legacy_row_id)`.
- Check constraints include entity kinds `institution|branch|person_mlo` and identifier namespaces `NMLS_INSTITUTION`, `NMLS_BRANCH`, `NMLS_PERSON`, `LEI`, `FDIC_CERT`, …
- **Row counts all 0** before builder backfill.
- `public.lenders` directory table is **not** altered.

## G. Do not run the backfill in SQL Editor

Builder scripts perform the deterministic 460 / 5,176 / 5,764 / 1,049 / 39 cohort.

**DO NOT RUN THE BACKFILL MANUALLY IN SQL EDITOR.**
