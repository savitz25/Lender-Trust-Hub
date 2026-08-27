/**
 * LEND-NAT-014 contract tests (IDX). No live CFPB/HMDA scans.
 */
import { PROFILE_CONTRACT_VERSION } from '@/lib/identity/profile-intelligence';
import { jsonLdHasForbiddenRatings, buildNationalProfileJsonLd } from './jsonld';
import {
  NATIONAL_PROFILE_COHORT,
  NATIONAL_PROFILE_GATE,
  NATIONAL_PROFILE_QA_COHORT,
  getCohortBySlug,
  nationalProfilePath,
} from './cohort';
import {
  INDEXING_COHORT,
  INDEXING_COHORT_VERSION,
  RENDER_COHORT,
  getIndexingRow,
  getRenderRow,
  nationalIndexingSitemapCount,
  nationalIndexingSitemapLocs,
  publicLenderRobots,
} from './publication';
import { nationalProfileDescription, nationalProfileTitle } from './seo';

export type IdxResult = { id: string; pass: boolean; detail: string };

export function runIdxContractTests(): IdxResult[] {
  const out: IdxResult[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });

  const slugs = INDEXING_COHORT.map((r) => r.slug);
  const uniqueSlugs = new Set(slugs);
  const renderSlugs = new Set(RENDER_COHORT.map((r) => r.slug));
  const qa = NATIONAL_PROFILE_QA_COHORT;

  check('IDX2', INDEXING_COHORT.every((r) => r.publication_status === 'PUBLICATION_ELIGIBLE'), 'index cohort is publication-eligible');
  check('IDX4', slugs.length === uniqueSlugs.size, 'indexing slugs unique');
  check(
    'IDX5',
    new Set(INDEXING_COHORT.map((r) => r.institution_id)).size === INDEXING_COHORT.length,
    'one institution_id per indexed profile'
  );
  check(
    'IDX6',
    NATIONAL_PROFILE_COHORT.every((r) => nationalProfilePath(r.slug).startsWith('/lender/')) &&
      !NATIONAL_PROFILE_COHORT.some((r) => r.slug.startsWith('lenders/')),
    '/lender vs /lenders remain separate paths'
  );

  const rocket = getIndexingRow('rocket-mortgage');
  check('IDX7', Boolean(rocket && String(rocket.hmda_period).includes('2025')), 'HMDA 2025 vintage on Rocket');
  check('IDX8', INDEXING_COHORT.some((r) => r.hmda !== 'AVAILABLE'), 'missing HMDA does not block the cohort');
  check('IDX9-src', INDEXING_COHORT.every((r) => r.cfpb_n === 0 || r.content_families.includes('cfpb')), 'CFPB family only when attributed');
  check(
    'IDX16',
    INDEXING_COHORT.length >= 100 && INDEXING_COHORT.length <= 250,
    `cohort size ${INDEXING_COHORT.length}`
  );
  check('IDX17', INDEXING_COHORT.every((r) => r.index === true), 'only cohort rows marked index');
  check(
    'IDX18',
    RENDER_COHORT.filter((r) => !r.index).every((r) => r.publication_status !== 'PUBLICATION_ELIGIBLE' || r.cohort_reason?.includes('noindex')),
    'non-index render rows are noindex'
  );
  const phh = getRenderRow('phh-home-loans');
  check(
    'IDX18-phh',
    Boolean(phh && phh.index === false && phh.publication_status === 'PUBLICATION_HOLD' && !getIndexingRow('phh-home-loans')),
    'PHH Home Loans remains render/noindex (HOLD)'
  );
  check('IDX19', nationalIndexingSitemapCount() === INDEXING_COHORT.length, 'sitemap size = indexing cohort');
  check(
    'IDX19b',
    nationalIndexingSitemapLocs().every((u) => u.includes('/lender/') && !u.includes('/lenders/')),
    'national sitemap uses /lender/{slug}'
  );
  check('IDX20', publicLenderRobots({ isLanding: true }).index === false, '/lender landing noindex');

  const rocketRobots = publicLenderRobots({ slug: 'rocket-mortgage' });
  const holdRobots = publicLenderRobots({ slug: 'phh-home-loans' });
  const unknownRobots = publicLenderRobots({ slug: 'not-a-real-national-lender' });
  check('IDX17-robots', rocketRobots.index === true && rocketRobots.follow === true, 'Rocket index,follow');
  check('IDX18-robots', holdRobots.index === false && unknownRobots.index === false, 'non-cohort noindex,nofollow');
  check(
    'IDX17-off',
    publicLenderRobots({ slug: 'rocket-mortgage', productionLaunchEnabled: false }).index === false,
    'launch flag fail-closed'
  );

  const qaPass = qa.filter((e) => Boolean(getIndexingRow(e.slug)));
  const qaHold = qa.filter((e) => !getIndexingRow(e.slug) && Boolean(getRenderRow(e.slug)));
  check('IDX-qa-render', qa.every((e) => renderSlugs.has(e.slug)), 'original 10 still render');
  check('IDX-qa-index', qaPass.length === 9 && qaHold.length === 1, '9 of original 10 index; PHH hold');

  check(
    'IDX14',
    !/best lender|top lender|approval odds|reviews/i.test(
      nationalProfileTitle('Rocket Mortgage') + nationalProfileDescription('Rocket Mortgage')
    ) && /not a ranking/i.test(nationalProfileDescription('Rocket Mortgage')),
    'title/meta have no ranking claims'
  );
  const ld = buildNationalProfileJsonLd({
    name: 'Rocket Mortgage',
    slug: 'rocket-mortgage',
    identifiers: [{ identifier_type: 'NMLS_INSTITUTION', identifier_value: '3030' }],
  });
  check('IDX15', !jsonLdHasForbiddenRatings(ld), 'no aggregateRating/reviewRating');
  check('IDX25-gate', NATIONAL_PROFILE_GATE.mode === 'controlled_index' && NATIONAL_PROFILE_GATE.contractVersion === PROFILE_CONTRACT_VERSION, 'controlled index gate');
  check('IDX-cohort-version', INDEXING_COHORT_VERSION === 'lend-nat-014-v1' && NATIONAL_PROFILE_GATE.cohortVersion === 'lend-nat-014-v1', 'cohort version');
  check(
    'IDX29',
    INDEXING_COHORT.every((r) => !r.stable_key.includes('person') && !r.stable_key.includes('branch')) &&
      RENDER_COHORT.every((r) => !r.stable_key.includes('person') && !r.stable_key.includes('branch')),
    'no MLO/branch keys in cohorts'
  );
  check('IDX-path', getCohortBySlug('rocket-mortgage')?.slug === 'rocket-mortgage', 'QA slug still resolves');
  const mix = {
    hmda: INDEXING_COHORT.some((r) => r.hmda === 'AVAILABLE'),
    noHmda: INDEXING_COHORT.some((r) => r.hmda !== 'AVAILABLE'),
    cfpb: INDEXING_COHORT.some((r) => r.cfpb_n > 0),
    noCfpb: INDEXING_COHORT.some((r) => r.cfpb_n === 0),
    enf: INDEXING_COHORT.some((r) => r.enf_n > 0),
    noEnf: INDEXING_COHORT.some((r) => r.enf_n === 0),
    fdic: INDEXING_COHORT.some((r) => r.depository === 'FDIC'),
    ncua: INDEXING_COHORT.some((r) => r.depository === 'NCUA'),
    nonbank: INDEXING_COHORT.some((r) => r.depository === 'NONBANK'),
    servicer: INDEXING_COHORT.some((r) => r.servicer === 'CONFIRMED'),
    historical: INDEXING_COHORT.some((r) => r.servicer === 'HISTORICAL'),
  };
  check('IDX21-mix', Object.values(mix).every(Boolean), `cohort diversity ${JSON.stringify(mix)}`);
  check(
    'IDX-slug-hygiene',
    INDEXING_COHORT.every((r) => !/team|tampa|clovis|buckeye/i.test(r.slug)),
    'indexing slugs are institution slugs, not catalog locality/team clones'
  );

  return out;
}
