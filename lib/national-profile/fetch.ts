import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { NATIONAL_PROFILE_GATE, getCohortBySlug, type NationalProfileCohortEntry } from './cohort';
import type { ProfileIntelligence } from '@/lib/identity/profile-intelligence';

export type ProfileFetchResult = {
  entry: NationalProfileCohortEntry;
  profile: ProfileIntelligence;
  source: 'snapshot_pk';
  fetchMs: number;
  queries: number;
};

async function loadSnapshotByEntityId(
  entityId: string
): Promise<{ profile: ProfileIntelligence; ms: number } | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const t0 = Date.now();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lender_profile_intelligence' as never)
    .select('profile')
    .eq('entity_id', entityId)
    .maybeSingle();
  const ms = Date.now() - t0;
  if (error || !data) return null;
  const row = data as { profile?: ProfileIntelligence };
  if (!row.profile) return null;
  return { profile: row.profile, ms };
}

/**
 * Public profiles read only public.lender_profile_intelligence by entity_id.
 * Missing credentials or missing snapshot → null (route 404). Never fixture JSON.
 */
export async function fetchNationalProfile(slug: string): Promise<ProfileFetchResult | null> {
  const entry = getCohortBySlug(slug);
  if (!entry) return null;
  const live = await loadSnapshotByEntityId(entry.entityId);
  if (!live || live.profile.contract_version !== NATIONAL_PROFILE_GATE.contractVersion) {
    return null;
  }
  return { entry, profile: live.profile, source: 'snapshot_pk', fetchMs: live.ms, queries: 1 };
}
