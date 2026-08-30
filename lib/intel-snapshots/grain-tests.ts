import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import national from '@/lib/home-intel/accepted-snapshot.json';
import florida from '@/lib/florida-intelligence/accepted-snapshot.json';
import { fingerprintSnapshotPayload } from './fingerprint';
import { FLORIDA_SNAPSHOT_CONTRACT, NATIONAL_SNAPSHOT_CONTRACT } from './contracts';

export type GrainCheck = { id: string; pass: boolean; detail: string };

export function runSnapshotGrainTests(): GrainCheck[] {
  const out: GrainCheck[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });

  check('002E-n-contract', national.snapshotVersion === NATIONAL_SNAPSHOT_CONTRACT, national.snapshotVersion);
  check('002E-f-contract', florida.contract === FLORIDA_SNAPSHOT_CONTRACT, florida.contract);
  check('002E-n-fp', fingerprintSnapshotPayload(national) === national.fingerprint, national.fingerprint);
  check('002E-f-fp', fingerprintSnapshotPayload(florida) === florida.fingerprint, florida.fingerprint);
  const nationalClock = { ...national, generated_at: '2099-01-01T00:00:00+00:00' };
  const floridaClock = { ...florida, generated_at: '2099-01-01T00:00:00+00:00' };
  check('002E-n-fp-clock', fingerprintSnapshotPayload(nationalClock) === national.fingerprint, 'generated_at excluded');
  check('002E-f-fp-clock', fingerprintSnapshotPayload(floridaClock) === florida.fingerprint, 'generated_at excluded');

  check('002E-id-nmls', national.institutions !== national.nmlsInstitution, 'institution ≠ NMLS credential');
  check('002E-id-lpi', national.institutions !== national.lpiSnapshots, 'institution ≠ LPI snapshot');
  check('002E-pub', national.publicRender === 181 && national.publicIndex === 180 && national.floridaPublic === 130, 'file-backed publication');
  check('002E-ppc', national.graph.person_public_candidate === 0, 'person_public_candidate=0');
  check('002E-branch-entity', national.graph.branch_entities !== national.graph.nmls_branch, 'branch entity ≠ NMLS_BRANCH slot or equal-count disclosed');
  check('002E-hmda-county', national.hmdaGrain === 'county' && national.applications === 11529787, 'national county grain');
  check('002E-fl-hmda-state', florida.hmda.criterion.includes('state_code=FL') && florida.hmda.applications === 927616, 'FL state grain');
  check('002E-hmda-not-summed', florida.hmda.applications !== national.applications, 'state grain ≠ national county sum');
  check('002E-creds-companies', florida.licensing.approved_credentials !== florida.licensing.unique_nmls, 'creds ≠ companies');
  check('002E-not-164936-hero', florida.licensing.unique_nmls !== 164936 && florida.licensing.approved_credentials !== 164936, 'hero not all rows');
  check('002E-held-not-3907', florida.licensing.held_nmls === 22 && florida.graph.unresolved_source_company_nmls === 3907, 'Approved hold ≠ source hold');
  check('002E-branch-grain', florida.graph.fl_branch_entities !== florida.graph.fl_branch_license_rows, 'branch entity ≠ license');
  check('002E-mlo-grain', florida.graph.fl_lo_nmls !== florida.graph.fl_lo_license_rows, 'MLO nmls ≠ LO row');
  check('002E-person-mlo', florida.graph.person_mlo_entities !== florida.graph.fl_lo_license_rows, 'person_mlo ≠ LO row');
  check(
    '002E-every-national-grain',
    Object.keys(national.grains).length >= 10 && Object.values(national.grains).every((g) => g.length > 8),
    String(Object.keys(national.grains).length),
  );
  check(
    '002E-every-florida-grain',
    Object.keys(florida.grains).length >= 10 && Object.values(florida.grains).every((g) => g.length > 8),
    String(Object.keys(florida.grains).length),
  );

  const homePage = readFileSync(join(process.cwd(), 'app/page.tsx'), 'utf8');
  const flPage = readFileSync(join(process.cwd(), 'app/florida/page.tsx'), 'utf8');
  const homeBuild = readFileSync(join(process.cwd(), 'lib/home-intel/build.ts'), 'utf8');
  const flComp = readFileSync(join(process.cwd(), 'components/florida/florida-state-intelligence.tsx'), 'utf8');
  check('002E-home-loader', homePage.includes('loadLenderHomeIntel') && homePage.includes('force-dynamic'), 'home loader');
  check('002E-fl-loader', flPage.includes('loadFloridaIntelligence') && flPage.includes('force-dynamic'), 'florida loader');
  check('002E-no-live-sql-pages', !/from\('lender_national_entities'\)|select count\(\*\)/.test(homePage + flPage), 'pages are not live SQL');
  check('002E-home-no-old-json', !homeBuild.includes("./snapshot.json"), 'compose uses accepted snapshot');
  check('002E-fl-no-hard-6325', !flComp.includes('6,325') && !flComp.includes('6,435'), 'no stale FL copy');
  check('002E-fl-no-no-branch', !/No Branch or MLO identity layer exists yet/.test(flComp), 'stale branch/MLO copy removed');
  check('002E-fl-no-ask-cta', !flPage.includes('/ask'), 'florida page is not Ask');
  check('002E-home-snapshot-path', homePage.includes('loadLenderHomeIntel'), 'home still snapshot-loaded');
  return out;
}
