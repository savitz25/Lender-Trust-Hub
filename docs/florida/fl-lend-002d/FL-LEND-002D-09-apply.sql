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

-- After 02-classify, this gate must hold before 03–07.
do $$
declare att int; unres int;
begin
  if to_regclass('public.lender_source_identity_resolutions') is null then
    raise exception 'STOP: run 02-classify before apply';
  end if;
  select
    count(*) filter (where resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'),
    count(*) filter (where resolution_class = 'UNRESOLVED_SOURCE_COMPANY_NMLS')
  into att, unres
  from public.lender_source_identity_resolutions
  where source_dataset = 'FL_OFR_NMLS_PRR_141420'
    and identifier_type = 'NMLS_INSTITUTION';
  if att is null then
    raise exception 'STOP: run 02-classify first';
  end if;
  if att <> 6309 or unres <> 3907 then
    raise exception 'STOP identity gate att=% unres=% expected 6309/3907; no net-new mint', att, unres;
  end if;
end $$;

select 'Identity gate locked: 6309 exact attach / 3907 holds / 0 conflict. Run 03–07 for exact-attached only, then 10-verify, then 03–07 again.' as instruction;
