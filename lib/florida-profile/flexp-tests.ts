import { INDEXING_COHORT, RENDER_COHORT } from '@/lib/national-profile/publication';
import { DISCOVERY_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { FLORIDA_SNAPSHOT } from '@/lib/florida-intelligence/snapshot';
import { FLORIDA_PHASE1_COUNT, FLORIDA_PHASE1_GATE, FLORIDA_PHASE1_ROWS } from './phase1';
import {
  FLORIDA_PHASE2_COUNT,
  FLORIDA_PHASE2_FINGERPRINT,
  FLORIDA_PHASE2_GATE,
  FLORIDA_PHASE2_ROWS,
  FLORIDA_PHASE2_VERSION,
} from './phase2';
import { FLORIDA_PHASE1_COPY } from './copy';
import { floridaCompanyJsonLdHasForbiddenRatings } from './jsonld';
import { publicProfileLeakHits } from './public-projection';

export type Flexp = { id: string; pass: boolean; detail: string };

export function runFlexpTests(): Flexp[] {
  const out: Flexp[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });

  const b2 = FLORIDA_PHASE2_ROWS.filter((r) => r.cohort === 'B2');
  const c2 = FLORIDA_PHASE2_ROWS.filter((r) => r.cohort === 'C2');
  const p2Slugs = FLORIDA_PHASE2_ROWS.map((r) => r.slug);
  const p2Ids = FLORIDA_PHASE2_ROWS.map((r) => r.institution_id);
  const p1Slugs = new Set(FLORIDA_PHASE1_ROWS.map((r) => r.slug));
  const p1Ids = new Set(FLORIDA_PHASE1_ROWS.map((r) => r.institution_id));
  const nationalSlugs = new Set(RENDER_COHORT.map((r) => r.slug).concat(INDEXING_COHORT.map((r) => r.slug)));
  const nationalIds = new Set(RENDER_COHORT.map((r) => r.institution_id).concat(INDEXING_COHORT.map((r) => r.institution_id)));
  const hashes = FLORIDA_PHASE2_ROWS.map((r) => r.selection_hash || '');

  check('FLEXP2', FLORIDA_PHASE1_COUNT === 30 && FLORIDA_PHASE1_ROWS.length === 30, String(FLORIDA_PHASE1_COUNT));
  check('FLEXP3', FLORIDA_PHASE2_COUNT === 100 && FLORIDA_PHASE2_ROWS.length === 100, String(FLORIDA_PHASE2_COUNT));
  check('FLEXP4', b2.length === 50, String(b2.length));
  check('FLEXP5', c2.length === 50, String(c2.length));
  check('FLEXP6', FLORIDA_PHASE2_ROWS.every((r) => r.has_national_snapshot === false && r.kind === 'FLORIDA_ONLY'), 'no LPI');
  check('FLEXP7', p2Slugs.every((s) => !nationalSlugs.has(s)) && p2Ids.every((id) => !nationalIds.has(id)), 'national overlap 0');
  check('FLEXP8', p2Slugs.every((s) => !p1Slugs.has(s)) && p2Ids.every((id) => !p1Ids.has(id)), 'phase1 overlap 0');
  check('FLEXP10', hashes.every((h) => /^[0-9a-f]{64}$/.test(h)), 'sha256 present');
  const b2Hash = b2.map((r) => r.selection_hash || '');
  const c2Hash = c2.map((r) => r.selection_hash || '');
  check('FLEXP10-b2-sorted', b2Hash.every((h, i) => i === 0 || h >= b2Hash[i - 1]), 'B2 hash ascending');
  check('FLEXP10-c2-sorted', c2Hash.every((h, i) => i === 0 || h >= c2Hash[i - 1]), 'C2 hash ascending');
  check('FLEXP11', FLORIDA_PHASE2_GATE.search === false, 'not quality-ranked; search off');
  check('FLEXP12', FLORIDA_PHASE2_VERSION === 'fl-lend-008-phase2-v1' && FLORIDA_PHASE2_FINGERPRINT.length === 64, FLORIDA_PHASE2_VERSION);
  check('FLEXP13', new Set(p2Ids).size === 100, 'unique institutions');
  check('FLEXP14', new Set(p2Slugs).size === 100, 'unique slugs');
  check('FLEXP15', p2Slugs.every((s) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)), 'canonical slug shape');
  check('FLEXP16', b2.every((r) => r.ofr >= 1), 'B2 ofr>=1');
  check('FLEXP17', c2.every((r) => r.ofr === 0), 'C2 ofr=0');
  check('FLEXP20', FLORIDA_PHASE1_COPY.noEvent.includes('July-2015-forward') && !/clean record|no violations|safe lender/i.test(FLORIDA_PHASE1_COPY.noEvent), 'no-event copy');
  check('FLEXP21', /not an admission/i.test(FLORIDA_PHASE1_COPY.consentNotAdmission), 'consent');
  check('FLEXP22', /not automatically an adverse/i.test(FLORIDA_PHASE1_COPY.notAutomaticallyAdverse), 'final action');
  check('FLEXP25', FLORIDA_PHASE1_COPY.servicerYes === 'OFR MLD credential reports SERVICER=Yes.', 'servicer');
  check('FLEXP26', /not service territory/i.test(FLORIDA_PHASE1_COPY.addressNotTerritory), 'address');
  check('FLEXP28', /not regulator findings/i.test(FLORIDA_PHASE1_COPY.cfpbNotFindings), 'cfpb');
  check('FLEXP31', !floridaCompanyJsonLdHasForbiddenRatings({ foo: 'bar' }), 'ratings helper');
  check('FLEXP-leak', publicProfileLeakHits({ name: 'x', nmls_id: '1' }).length === 0, 'leak helper');
  check('FLEXP42-phase1-index', FLORIDA_PHASE1_GATE.robotsIndex === true && FLORIDA_PHASE1_GATE.sitemap === true, 'phase1 remains index');
  check('FLEXP44', FLORIDA_PHASE2_GATE.robotsIndex === true && FLORIDA_PHASE2_COUNT === 100, 'phase2 index,follow');
  check('FLEXP45', FLORIDA_PHASE2_GATE.sitemap === true, 'phase2 in florida sitemap');
  check('FLEXP50', DISCOVERY_SEARCHABLE_COUNT === 181 && FLORIDA_PHASE1_GATE.search === false && FLORIDA_PHASE2_GATE.search === false, 'searchable 181');
  check('FLEXP51', RENDER_COHORT.length === 181, String(RENDER_COHORT.length));
  check('FLEXP52', INDEXING_COHORT.length === 180, String(INDEXING_COHORT.length));
  check('FLEXP55', FLORIDA_SNAPSHOT.fingerprint === '616a961b7524fd5fd48ba7dcedcc553aabe9b658a586557908622912f5f08edc', 'si fingerprint');
  check('FLEXP62', FLORIDA_PHASE1_COUNT + FLORIDA_PHASE2_COUNT === 130, 'no 131st');

  return out;
}
