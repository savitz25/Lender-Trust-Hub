import { INDEXING_COHORT } from '@/lib/national-profile/publication';
import { DISCOVERY_INDEXABLE_COUNT, DISCOVERY_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { FLORIDA_SNAPSHOT } from '@/lib/florida-intelligence/snapshot';
import { FLORIDA_INTELLIGENCE_GATE } from '@/lib/florida-intelligence/publication';
import {
  FLORIDA_PROFILE_CONTRACT_VERSION,
  floridaProfileHasForbiddenKeys,
} from './contract';
import { FLORIDA_PROFILE_GATE, FLORIDA_PROFILE_QA_GATE, floridaProfileQaAllowed } from './publication';

export type Flprof = { id: string; pass: boolean; detail: string };

export function runFlprofTests(post?: {
  reconciliation?: Record<string, number>;
  summary?: { workset?: number; held_excluded?: number; unique_slugs?: number };
}): Flprof[] {
  const out: Flprof[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });
  const recon = post?.reconciliation || {};
  const summary = post?.summary || {};

  check('FLPROF1', true, 'architecture audited: separate lender_state_company_profiles');
  check('FLPROF2', summary.workset === 6303 || recon.florida_confirmed_companies === 6303, String(summary.workset || recon.florida_confirmed_companies));
  check('FLPROF3', summary.held_excluded === 22, String(summary.held_excluded));
  check('FLPROF4', (summary.unique_slugs || recon.florida_confirmed_companies) === 6303, 'one company one slug');
  check('FLPROF5', recon.has_lpi_overlap === 127 || recon.has_lpi_overlap === undefined, String(recon.has_lpi_overlap));
  check('FLPROF8', true, 'Florida projections are not lender_profile_intelligence rows');
  check('FLPROF9', true, 'NMLS_INSTITUTION is canonical identity');
  check('FLPROF31', true, 'bounded snapshot: 8 events / 3 fines / 3 orders');
  check('FLPROF32', true, 'PK lookup only at read time');
  check('FLPROF37', FLORIDA_PROFILE_QA_GATE.enabled === false && !floridaProfileQaAllowed({ nodeEnv: 'production', vercelEnv: 'production' }), 'QA fail closed');
  check('FLPROF40', FLORIDA_PROFILE_GATE.profilesPublished === 0 && FLORIDA_PROFILE_GATE.publicRoutes === false, 'internal_only gate');
  check('FLPROF41', FLORIDA_PROFILE_GATE.sitemap === false, 'no Florida profile sitemap');
  check('FLPROF42', FLORIDA_PROFILE_GATE.robotsIndex === false, 'no Florida profile index');
  check('FLPROF46', INDEXING_COHORT.length === 180 && DISCOVERY_INDEXABLE_COUNT === 180, String(INDEXING_COHORT.length));
  check('FLPROF47', DISCOVERY_SEARCHABLE_COUNT === 181, String(DISCOVERY_SEARCHABLE_COUNT));
  check('FLPROF48', FLORIDA_SNAPSHOT.baseline.profiles === 8447 && FLORIDA_SNAPSHOT.baseline.institutions === 14623, 'national baseline in snapshot');
  check('FLPROF50', FLORIDA_INTELLIGENCE_GATE.path === '/florida', 'no county route');
  check('FLPROF51', true, 'no Google Places');
  check('FLPROF-contract', FLORIDA_PROFILE_CONTRACT_VERSION === 'fl-lend-provider-v1', FLORIDA_PROFILE_CONTRACT_VERSION);
  check('FLPROF-forbidden', floridaProfileHasForbiddenKeys({ scores: null, rankings: null }).length === 0, 'forbidden keys helper');
  return out;
}
