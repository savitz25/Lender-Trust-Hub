-- FL-LEND-002D-09-apply.sql
-- After 01-schema + CSV imports + 08-dry-run review:
-- run 02-classify, 03-company-credentials, 04-branches, 05-mlo, 06-sponsorship, 07-contacts
-- in that order, each file as its own SQL Editor statement.
-- This file is the checklist wrapper (SQL Editor pastes are size-limited).

do $$
begin
  if (select count(*) from staging_fl_ofr_companies) <> 10216 then
    raise exception 'STOP: staging companies %', (select count(*) from staging_fl_ofr_companies);
  end if;
  if (select count(*) from staging_fl_ofr_sponsorships) <> 53421 then
    raise exception 'STOP: staging sponsorships %', (select count(*) from staging_fl_ofr_sponsorships);
  end if;
  if (select count(distinct branch_nmls_id) from staging_fl_ofr_branches where source_clock = 'nmls_active') <> 6690 then
    raise exception 'STOP: PRR branch nmls %',
      (select count(distinct branch_nmls_id) from staging_fl_ofr_branches where source_clock = 'nmls_active');
  end if;
end $$;

select 'Run next: FL-LEND-002D-02-classify.sql then 03 through 07, then 10-verify. Then rerun 03-07 for idempotency.' as instruction;
