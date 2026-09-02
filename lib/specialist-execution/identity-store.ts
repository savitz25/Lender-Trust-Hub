import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/config';

export type IdentityIdentifierType = 'NMLS_INSTITUTION' | 'NMLS_BRANCH' | 'NMLS_PERSON' | 'LEI';

export type ExactIdentityRecord = {
  entityId: string;
  identifierType: IdentityIdentifierType;
  identifierValue: string;
  entityKind: 'institution' | 'branch' | 'person_mlo' | string;
  legalName: string | null;
  displayName: string | null;
  currentStatus: string | null;
  publicProjectionStatus: string | null;
  reviewStatus: string | null;
  sourceDataset: string | null;
  observedAt: string | null;
  relatedNmls: string | null;
  relatedLei: string | null;
};

type IdentifierRow = {
  entity_id: string;
  identifier_type: IdentityIdentifierType;
  identifier_value: string;
  source_dataset: string | null;
  observed_at: string | null;
  lender_national_entities: {
    entity_kind: string;
    legal_name: string | null;
    display_name: string | null;
    current_status: string | null;
    public_projection_status: string | null;
    review_status: string | null;
  } | null;
};

type RelatedIdentifierRow = {
  identifier_type: 'NMLS_INSTITUTION' | 'LEI';
  identifier_value: string;
};

export type ExactIdentityStore = {
  lookupNmls(value: string): Promise<ExactIdentityRecord[]>;
  lookupLei(value: string): Promise<ExactIdentityRecord[]>;
};

function adminClient() {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) throw new Error('Lender identity store is not configured.');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function lookup(types: IdentityIdentifierType[], value: string): Promise<ExactIdentityRecord[]> {
  const client = adminClient();
  const { data, error } = await client
    .from('lender_identifiers')
    .select('entity_id,identifier_type,identifier_value,source_dataset,observed_at,lender_national_entities!inner(entity_kind,legal_name,display_name,current_status,public_projection_status,review_status)')
    .in('identifier_type', types)
    .eq('identifier_value', value)
    .limit(10);
  if (error) throw error;

  const rows = (data ?? []) as unknown as IdentifierRow[];
  if (rows.length === 0) return [];
  const entityIds = [...new Set(rows.map((row) => row.entity_id))];
  const { data: relatedData, error: relatedError } = await client
    .from('lender_identifiers')
    .select('entity_id,identifier_type,identifier_value')
    .in('entity_id', entityIds)
    .in('identifier_type', ['NMLS_INSTITUTION', 'LEI']);
  if (relatedError) throw relatedError;
  const related = (relatedData ?? []) as unknown as Array<RelatedIdentifierRow & { entity_id: string }>;

  return rows.map((row) => {
    const entity = row.lender_national_entities;
    const forEntity = related.filter((item) => item.entity_id === row.entity_id);
    return {
      entityId: row.entity_id,
      identifierType: row.identifier_type,
      identifierValue: row.identifier_value,
      entityKind: entity?.entity_kind ?? 'unknown',
      legalName: entity?.legal_name ?? null,
      displayName: entity?.display_name ?? null,
      currentStatus: entity?.current_status ?? null,
      publicProjectionStatus: entity?.public_projection_status ?? null,
      reviewStatus: entity?.review_status ?? null,
      sourceDataset: row.source_dataset,
      observedAt: row.observed_at,
      relatedNmls: forEntity.find((item) => item.identifier_type === 'NMLS_INSTITUTION')?.identifier_value ?? null,
      relatedLei: forEntity.find((item) => item.identifier_type === 'LEI')?.identifier_value ?? null,
    };
  });
}

export const canonicalExactIdentityStore: ExactIdentityStore = {
  lookupNmls: (value) => lookup(['NMLS_INSTITUTION', 'NMLS_BRANCH', 'NMLS_PERSON'], value),
  lookupLei: (value) => lookup(['LEI'], value),
};
