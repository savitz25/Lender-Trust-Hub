import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { fetchNationalProfile, type ProfileFetchResult } from '@/lib/national-profile/fetch';
import { getCohortBySlug } from '@/lib/national-profile/cohort';
import type { ProfileIntelligence } from '@/lib/identity/profile-intelligence';
import { getPhase1Row, type Phase1Row } from './phase1';
import { getPhase2Row, type Phase2Row } from './phase2';
import { toFloridaPublicProfile, type FloridaPublicProfile } from './public-projection';

export type PublicLenderKind = 'national_only' | 'national_plus_florida' | 'florida_only';

export type PublicLenderFetch =
  | {
      kind: 'national_only';
      national: ProfileFetchResult;
      florida: null;
      fetchMs: number;
      queries: number;
    }
  | {
      kind: 'national_plus_florida' | 'florida_only';
      national: ProfileFetchResult | null;
      florida: FloridaPublicProfile;
      phase1: Phase1Row | null;
      phase2: Phase2Row | null;
      fetchMs: number;
      queries: number;
    };

async function loadFloridaBySlug(slug: string): Promise<{ raw: Record<string, unknown>; ms: number } | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const t0 = Date.now();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lender_state_company_profiles' as never)
    .select('profile, nmls_id, institution_id, confirmed_ofr_event_count, public_projection_status')
    .eq('slug', slug)
    .maybeSingle();
  const ms = Date.now() - t0;
  if (error || !data) return null;
  const row = data as {
    profile?: Record<string, unknown>;
    public_projection_status?: string;
  };
  if (!row.profile || row.public_projection_status !== 'internal_only') return null;
  return { raw: row.profile, ms };
}

async function loadNationalByEntityId(entityId: string): Promise<{ profile: ProfileIntelligence; ms: number } | null> {
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
 * Fail-closed public fetch.
 * National 181: existing behavior only.
 * Florida Phase 1 30: Florida snapshot ± national LPI compose.
 * Florida Phase 2 100: Florida-only keyed lookup, no LPI.
 * Any other Florida internal slug: null → 404.
 */
export async function fetchPublicLenderProfile(slug: string): Promise<PublicLenderFetch | null> {
  const nationalEntry = getCohortBySlug(slug);
  const phase1 = getPhase1Row(slug);
  const phase2 = getPhase2Row(slug);

  if (nationalEntry && !phase1) {
    const national = await fetchNationalProfile(slug);
    if (!national) return null;
    return { kind: 'national_only', national, florida: null, fetchMs: national.fetchMs, queries: national.queries };
  }

  if (!phase1 && !phase2) return null;

  const fl = await loadFloridaBySlug(slug);
  if (!fl) return null;

  if (phase1) {
    const florida = toFloridaPublicProfile(fl.raw, { cohort: phase1.cohort, kind: phase1.kind, slug });
    if (florida.nmls_id !== phase1.nmls_id) return null;
    if (phase1.cohort === 'B' && florida.ofr.confirmed_event_observations < 1) return null;
    if (phase1.cohort === 'C' && florida.ofr.confirmed_event_observations !== 0) return null;

    let queries = 1;
    let fetchMs = fl.ms;
    let national: ProfileFetchResult | null = null;
    if (phase1.kind === 'NATIONAL_PLUS_FLORIDA') {
      const live = await loadNationalByEntityId(phase1.institution_id);
      queries += 1;
      fetchMs += live?.ms || 0;
      if (live) {
        national = {
          entry: {
            key: slug,
            slug,
            stableKey: phase1.stable_key || `nmls-inst:${phase1.nmls_id}`,
            entityId: phase1.institution_id,
            displayName: phase1.name,
            notes: 'FL-LEND-007 Phase 1 compose',
          },
          profile: live.profile,
          source: 'snapshot_pk',
          fetchMs: live.ms,
          queries: 1,
        };
      }
    }

    return {
      kind: phase1.kind === 'NATIONAL_PLUS_FLORIDA' ? 'national_plus_florida' : 'florida_only',
      national,
      florida,
      phase1,
      phase2: null,
      fetchMs,
      queries,
    };
  }

  if (!phase2) return null;
  const florida = toFloridaPublicProfile(fl.raw, { cohort: phase2.cohort, kind: 'FLORIDA_ONLY', slug });
  if (florida.nmls_id !== phase2.nmls_id) return null;
  if (phase2.has_national_snapshot) return null;
  if (phase2.cohort === 'B2' && florida.ofr.confirmed_event_observations < 1) return null;
  if (phase2.cohort === 'C2' && florida.ofr.confirmed_event_observations !== 0) return null;

  return {
    kind: 'florida_only',
    national: null,
    florida,
    phase1: null,
    phase2,
    fetchMs: fl.ms,
    queries: 1,
  };
}
