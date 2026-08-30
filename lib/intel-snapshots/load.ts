import 'server-only';

import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/supabase/config';
import type { SnapshotGeography, SnapshotLoadResult, SnapshotLoadSource } from './contracts';

type SnapshotRow = {
  payload: unknown;
  fingerprint: string;
  generated_at: string;
  publication_status: 'published' | 'superseded';
};

function snapshotClient() {
  const url = getSupabaseUrl();
  const service = getSupabaseServiceRoleKey();
  const anon = getSupabaseAnonKey();
  if (!url) return null;
  const key = service || anon;
  if (!key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchSnapshot(
  contractName: string,
  geography: SnapshotGeography,
  status: 'published' | 'superseded',
): Promise<SnapshotRow | null> {
  const client = snapshotClient();
  if (!client) return null;
  const { data, error } = await client
    .from('lender_intelligence_snapshots')
    .select('payload, fingerprint, generated_at, publication_status')
    .eq('contract_name', contractName)
    .eq('geography', geography)
    .eq('publication_status', status)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as SnapshotRow;
}

export async function loadPublishedSnapshot<T extends { fingerprint?: string; generated_at?: string }>(
  contractName: string,
  geography: SnapshotGeography,
  accepted: T,
): Promise<SnapshotLoadResult<T>> {
  try {
    const published = await fetchSnapshot(contractName, geography, 'published');
    if (published?.payload && published.fingerprint) {
      return {
        status: 'ok',
        source: 'published' satisfies SnapshotLoadSource,
        payload: published.payload as T,
        fingerprint: published.fingerprint,
        generatedAt: published.generated_at,
      };
    }
    const superseded = await fetchSnapshot(contractName, geography, 'superseded');
    if (superseded?.payload && superseded.fingerprint) {
      return {
        status: 'ok',
        source: 'superseded',
        payload: superseded.payload as T,
        fingerprint: superseded.fingerprint,
        generatedAt: superseded.generated_at,
      };
    }
  } catch {
    // Fail closed to last accepted published artifact. Never live SQL. Never stale constants.
  }
  if (accepted?.fingerprint) {
    return {
      status: 'ok',
      source: 'accepted_artifact',
      payload: accepted,
      fingerprint: accepted.fingerprint,
      generatedAt: accepted.generated_at || '',
    };
  }
  return { status: 'unavailable', reason: 'No published or last-accepted intelligence snapshot is available.' };
}
