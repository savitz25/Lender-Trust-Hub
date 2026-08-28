-- FL-LEND-002D-06-sponsorship.sql
-- ASSOCIATED_WITH only when sponsor Company Id is exact-attached.
-- No SPONSORED_BY (would require DROP of relationship_type check).
-- No person→branch.

begin;

insert into public.lender_entity_relationships (
  id, from_entity_id, to_entity_id, relationship_type, confidence,
  source_dataset, notes, valid_from, ofr_status, source_record_id
)
select distinct
  uuid_generate_v5(
    '9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid,
    'rel:ASSOCIATED_WITH:'||uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||s.individual_nmls_id)::text||':'||r.entity_id::text
  ),
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||s.individual_nmls_id),
  r.entity_id,
  'ASSOCIATED_WITH',
  'confirmed',
  'FL_OFR_NMLS_PRR_141420',
  'Sponsoring institution observed in the OFR-produced NMLS roster as of 2026-08-27.',
  date '2026-08-27',
  s.sponsorship_status,
  s.source_record_id
from public.staging_fl_ofr_sponsorships s
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = s.sponsor_company_nmls_id
 and r.source_dataset = 'FL_OFR_NMLS_PRR_141420'
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
join public.lender_national_entities p
  on p.id = uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||s.individual_nmls_id)
 and p.entity_kind = 'person_mlo'
where coalesce(s.individual_nmls_id,'') ~ '^[0-9]{3,12}$'
on conflict (from_entity_id, to_entity_id, relationship_type) do nothing;

select
  count(*) as sponsorship_source_rows,
  count(*) filter (
    where r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
  ) as sponsor_resolved
from public.staging_fl_ofr_sponsorships s
left join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = s.sponsor_company_nmls_id
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS';

commit;
