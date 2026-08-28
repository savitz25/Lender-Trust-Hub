-- FL-LEND-002D-07-contacts.sql
-- Business: review_before_public on exact-attached institutions.
-- Person: internal_only on person_mlo entities. Never public_candidate.

begin;

insert into public.lender_entity_contacts (
  id, entity_id, contact_kind, contact_role, classification, phone, email,
  address1, city, state, zip, source_dataset, source_record_id, observed_at, raw_metadata
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'ct:'||r.entity_id::text||':'||c.contact_kind||':'||c.source_record_id),
  r.entity_id,
  c.contact_kind,
  'business',
  'review_before_public',
  nullif(c.phone,''),
  nullif(c.email,''),
  c.address1, c.city, c.state, c.zip,
  c.source_dataset, c.source_record_id, c.source_observed_on,
  jsonb_build_object('role','company_contact')
from public.staging_fl_ofr_business_contacts c
join public.lender_source_identity_resolutions r
  on r.identifier_type = 'NMLS_INSTITUTION'
 and r.identifier_value = c.company_nmls_id
 and r.resolution_class = 'ATTACHED_EXISTING_EXACT_NMLS'
where c.classification = 'review_before_public'
on conflict (entity_id, contact_kind, source_record_id) do nothing;

insert into public.lender_entity_contacts (
  id, entity_id, contact_kind, contact_role, classification, email,
  source_dataset, source_record_id, observed_at, raw_metadata
)
select
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid,
    'ct:'||uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||c.individual_nmls_id)::text||':email:'||c.source_record_id),
  uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||c.individual_nmls_id),
  'email',
  'professional',
  'internal_only',
  c.email,
  c.source_dataset, c.source_record_id, c.source_observed_on,
  jsonb_build_object('public_eligible', false)
from public.staging_fl_ofr_person_contacts c
join public.lender_national_entities e
  on e.id = uuid_generate_v5('9b3c2d11-7e54-4a80-91f0-0c1d2e3f4a5b'::uuid, 'person:'||c.individual_nmls_id)
 and e.entity_kind = 'person_mlo'
where c.classification = 'internal_only'
  and coalesce(c.email,'') like '%@%'
on conflict (entity_id, contact_kind, source_record_id) do nothing;

select
  count(*) filter (where e.entity_kind = 'institution') as business_contacts,
  count(*) filter (where e.entity_kind = 'person_mlo') as person_contacts,
  count(*) filter (where e.entity_kind = 'person_mlo' and c.classification = 'public_candidate') as person_public_candidate
from public.lender_entity_contacts c
join public.lender_national_entities e on e.id = c.entity_id;

commit;
