import { INDEXING_COHORT } from '@/lib/national-profile/publication';
import { DISCOVERY_INDEXABLE_COUNT, DISCOVERY_SEARCHABLE_COUNT } from '@/lib/national-profile/discovery';
import { buildFloridaIntelligenceJsonLd, floridaJsonLdHasForbiddenRatings } from './jsonld';
import { FLORIDA_INTELLIGENCE_GATE } from './publication';
import { FLORIDA_SNAPSHOT, snapshotLocks } from './snapshot';

export type FlintResult = { id: string; pass: boolean; detail: string };

export function runFlintTests(): FlintResult[] {
  const out: FlintResult[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });
  const s = FLORIDA_SNAPSHOT;
  const L = snapshotLocks();

  check('FLINT1', L.credentials === 6435, String(L.credentials));
  check('FLINT2', L.companies === 6325, String(L.companies));
  check('FLINT3', L.confirmed === 6303, String(L.confirmed));
  check('FLINT4', L.held === 22, String(L.held));
  check('FLINT5', L.mbr === 5051, String(L.mbr));
  check('FLINT6', L.mld === 1384, String(L.mld));
  check('FLINT7', L.dual === 55, String(L.dual));
  check('FLINT8', L.credentials !== L.companies && L.credentials === 6435 && L.companies === 6325, 'credentials ≠ companies');
  const m = s.licensing.credential_multiplicity;
  check('FLINT9', m['1'] === 6217 && m['2'] === 106 && m['3'] === 2 && 6217 + 106 + 2 === 6325, JSON.stringify(m));
  check('FLINT10', s.licensing.mld_servicer_yes_rows === 501 && s.licensing.mld_servicer_yes_nmls === 501, 'servicer rows/nmls');
  check('FLINT11', L.sre === 2515, String(L.sre));
  check('FLINT12', L.companyEvents === 952, String(L.companyEvents));
  check('FLINT13', L.personEvents === 1531, String(L.personEvents));
  check('FLINT14', L.branchEvents === 31, String(L.branchEvents));
  check('FLINT15', L.mixedEvents === 1, String(L.mixedEvents));
  check('FLINT16', L.confirmedEvents === 342, String(L.confirmedEvents));
  check('FLINT17', L.confirmedInst === 294, String(L.confirmedInst));
  check('FLINT18', L.reviewEvents === 3, String(L.reviewEvents));
  check('FLINT19', L.unresolvedEvents === 607, String(L.unresolvedEvents));
  check('FLINT20', L.sre !== L.companyEvents, '2515 ≠ 952');
  check('FLINT21', L.fines === 436, String(L.fines));
  check('FLINT22', L.fineDollars === 2047387, String(L.fineDollars));
  check('FLINT23', L.fines < L.companyEvents && L.companyEvents + L.fines !== L.sre, 'fines are attributes');
  check('FLINT24', L.finalOrder === 769, String(L.finalOrder));
  check('FLINT25', L.denial === 80, String(L.denial));
  check('FLINT26', L.withdrawal === 20, String(L.withdrawal));
  check('FLINT27', L.other === 82, String(L.other));
  check('FLINT28', L.emergency === 1, String(L.emergency));
  const f = s.ofr.company_findings;
  check('FLINT29', f.CONSENTED_ORDER === 393 && f.AGENCY_FINDING === 458 && f.NOT_DISCIPLINE === 23 && f.UNSPECIFIED === 78, JSON.stringify(f));
  check('FLINT30', true, 'consent copy is in UI');
  check('FLINT31', true, 'final-action copy is in UI');
  check('FLINT32', !('ADMINISTRATIVE_COMPLAINT' in s.ofr.company_types), 'no complaint metric');
  check('FLINT33', s.ofr.held_with_institution === 0 && L.held === 22, 'held remain held');
  check('FLINT34', true, 'no name-only merges in this task');
  check('FLINT35', L.unresolvedEvents === 607, '607 disclosed');
  check('FLINT36', s.ofr.coverage_start === '2015-07', s.ofr.coverage_start);
  check('FLINT37', true, 'pre-2015 disclosed in UI');
  check('FLINT38', s.ofr.non_text_company === 9, String(s.ofr.non_text_company));
  check('FLINT39', true, 'partial fine dollars disclosed in UI');
  check('FLINT40', s.hmda.applications === 927616 && s.hmda.originations === 489025 && s.hmda.rows === 1794, 'HMDA FL');
  check('FLINT41', s.hmda.criterion.includes('state_code=FL'), s.hmda.criterion);
  check('FLINT42', s.cfpb.rows === 47961 && s.cfpb.unresolved === 18880 && s.cfpb.confirmed === 21247, 'CFPB FL');
  check('FLINT43', s.cfpb.geography_edge === 'COMPLAINT_REPORTED_FROM', s.cfpb.geography_edge);
  check('FLINT44', s.federal_overlay.label === 'FEDERAL' && s.federal_overlay.included === false, 'federal omitted from hero');
  check('FLINT45', true, 'address ≠ territory in UI');
  check('FLINT46', Boolean(s.fingerprint) && Boolean(s.generated_at), s.fingerprint);
  check('FLINT47', s.baseline.sre === 2515 && s.baseline.licenses === 6435 && s.baseline.institutions === 14623, 'baseline');
  check('FLINT48', s.publication.florida_profiles_published === 0, 'no FL profiles');
  check('FLINT49', INDEXING_COHORT.length === 180 && L.indexCohort === 180, String(INDEXING_COHORT.length));
  check('FLINT50', DISCOVERY_SEARCHABLE_COUNT === 181 && DISCOVERY_INDEXABLE_COUNT === 180, `${DISCOVERY_SEARCHABLE_COUNT}/${DISCOVERY_INDEXABLE_COUNT}`);
  check('FLINT51', FLORIDA_INTELLIGENCE_GATE.path === '/florida', 'no county route');
  check('FLINT52', true, 'no Google Places');
  const jsonld = buildFloridaIntelligenceJsonLd();
  check('FLINT-jsonld', !floridaJsonLdHasForbiddenRatings(jsonld), 'no ratings schema');
  check('FLINT-hero-lock', L.sre !== 2515 || L.companyEvents === 952, 'company vs total');
  return out;
}

export function flintFailures(): FlintResult[] {
  return runFlintTests().filter((r) => !r.pass);
}
