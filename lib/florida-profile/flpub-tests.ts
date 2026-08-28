import { INDEXING_COHORT, RENDER_COHORT } from '@/lib/national-profile/publication';
import { DISCOVERY_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { FLORIDA_SNAPSHOT } from '@/lib/florida-intelligence/snapshot';
import { FLORIDA_PHASE1_COUNT, FLORIDA_PHASE1_GATE, FLORIDA_PHASE1_ROWS } from './phase1';
import { publicProfileLeakHits } from './public-projection';
import { floridaCompanyJsonLdHasForbiddenRatings } from './jsonld';

export type Flpub = { id: string; pass: boolean; detail: string };

export function runFlpubTests(): Flpub[] {
  const out: Flpub[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });
  const a = FLORIDA_PHASE1_ROWS.filter((r) => r.cohort === 'A');
  const b = FLORIDA_PHASE1_ROWS.filter((r) => r.cohort === 'B');
  const c = FLORIDA_PHASE1_ROWS.filter((r) => r.cohort === 'C');
  const slugs = FLORIDA_PHASE1_ROWS.map((r) => r.slug);
  const nationalSlugs = new Set(RENDER_COHORT.map((r) => r.slug));
  check('FLPUB4', FLORIDA_PHASE1_COUNT === 30 && FLORIDA_PHASE1_ROWS.length === 30, String(FLORIDA_PHASE1_COUNT));
  check('FLPUB5', a.length === 10 && a.every((r) => r.has_national_snapshot && r.kind === 'NATIONAL_PLUS_FLORIDA'), String(a.length));
  check('FLPUB6', b.length === 10 && b.every((r) => r.ofr >= 1 && !r.has_national_snapshot), String(b.length));
  check('FLPUB7', c.length === 10 && c.every((r) => r.ofr === 0 && !r.has_national_snapshot), String(c.length));
  check('FLPUB13', new Set(slugs).size === 30, 'unique slugs');
  check('FLPUB14', slugs.every((s) => !nationalSlugs.has(s)), 'no national URL overlap');
  check('FLPUB15', slugs.every((s) => !nationalSlugs.has(s)), '21 overlap excluded');
  check('FLPUB17', RENDER_COHORT.length === 181, String(RENDER_COHORT.length));
  check('FLPUB18', INDEXING_COHORT.length === 180, String(INDEXING_COHORT.length));
  check('FLPUB19', DISCOVERY_SEARCHABLE_COUNT === 181, String(DISCOVERY_SEARCHABLE_COUNT));
  check('FLPUB20', FLORIDA_PHASE1_GATE.count === 30, String(FLORIDA_PHASE1_GATE.count));
  check('FLPUB36', b.every((r) => r.ofr >= 1), 'cohort B events');
  check('FLPUB37', c.every((r) => r.ofr === 0), 'cohort C zero');
  check('FLPUB45', !floridaCompanyJsonLdHasForbiddenRatings({ foo: 'bar' }), 'ratings helper');
  check('FLPUB-leak-empty', publicProfileLeakHits({ name: 'x', nmls_id: '1' }).length === 0, 'no leak keys');
  check('FLPUB48-snapshot', FLORIDA_SNAPSHOT.fingerprint === '616a961b7524fd5fd48ba7dcedcc553aabe9b658a586557908622912f5f08edc', 'si fingerprint');
  check('FLPUB-search-off', FLORIDA_PHASE1_GATE.search === false, 'no search expansion');
  return out;
}
