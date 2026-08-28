import { jsonLdHasForbiddenRatings } from './jsonld';
import { buildNationalDiscoveryJsonLd } from './discovery-jsonld';
import { INDEXING_COHORT, getIndexingRow, getRenderRow, nationalIndexingSitemapCount } from './publication';
import {
  COMBINED_SEARCHABLE_COUNT,
  DISCOVERY_INDEXABLE_COUNT,
  DISCOVERY_RECORDS,
  DISCOVERY_SEARCHABLE_COUNT,
  FLORIDA_DISCOVERY_RECORDS,
  FLORIDA_SEARCHABLE_COUNT,
  SEARCH_POOL,
  browseDiscovery,
  nationalPresentationName,
  parseDiscoveryQuery,
  searchDiscovery,
} from './discovery';
import { NATIONAL_PROFILE_GATE, nationalProfilePath } from './cohort';

export type DiscResult = { id: string; pass: boolean; detail: string };

export function runDiscContractTests(): DiscResult[] {
  const out: DiscResult[] = [];
  const check = (id: string, pass: boolean, detail: string) => out.push({ id, pass, detail });

  check('DISC-count', DISCOVERY_SEARCHABLE_COUNT === 181 && DISCOVERY_RECORDS.length === 181, `searchable ${DISCOVERY_RECORDS.length}`);
  check('DISC-indexable', DISCOVERY_INDEXABLE_COUNT === 180 && INDEXING_COHORT.length === 180, '180 frozen');
  check('DISC2', searchDiscovery('Rocket Mortgage').some((h) => h.record.slug === 'rocket-mortgage' && h.match === 'canonical_exact'), 'exact name');
  check('DISC3', searchDiscovery('rocket').some((h) => h.record.slug === 'rocket-mortgage'), 'partial name');
  check('DISC4', searchDiscovery('NMLS 3030')[0]?.record.slug === 'rocket-mortgage' && searchDiscovery('NMLS 3030')[0]?.matchedIdentifier === 'nmls', 'NMLS exact');
  const oregon = searchDiscovery('FDIC 16243');
  check('DISC5', oregon[0]?.record.slug === 'bank-of-eastern-oregon' && oregon[0]?.matchedIdentifier === 'fdic', 'FDIC exact');
  const navy = searchDiscovery('399807');
  check('DISC6-nmls-navy', navy.some((h) => h.record.slug === 'navy-federal-credit-union'), 'NMLS digits');
  const lei = searchDiscovery('549300FGXN1K3HLB1R50');
  check('DISC7', lei[0]?.record.slug === 'rocket-mortgage' && lei[0]?.matchedIdentifier === 'lei', 'LEI exact');
  check(
    'DISC7-prefix',
    searchDiscovery('LEI 549300FGXN1K3HLB1R50')[0]?.record.slug === 'rocket-mortgage',
    'LEI prefix still exact'
  );
  check(
    'DISC7-spaced-name-not-lei',
    parseDiscoveryQuery('AXE CAPITAL LENDING LLC').identifierKind == null &&
      searchDiscovery('AXE CAPITAL LENDING LLC').some((h) => h.record.slug === 'axe-capital-lending-llc' && h.match === 'canonical_exact'),
    '20-letter legal name with spaces is not a LEI'
  );
  const parsedNmls = parseDiscoveryQuery('NMLS 3030');
  check('DISC8', parsedNmls.identifierKind === 'nmls' && parsedNmls.identifierValue === '3030', 'namespaces parsed');
  const nmls3030 = searchDiscovery('nmls 3030');
  const asFdic = searchDiscovery('fdic 3030');
  check('DISC8b', nmls3030[0]?.record.slug === 'rocket-mortgage' && asFdic.every((h) => h.record.slug !== 'rocket-mortgage'), 'NMLS 3030 is not FDIC 3030');
  check('DISC9', searchDiscovery('QUICKEN LOANS INC.').some((h) => h.record.slug === 'rocket-mortgage' && h.match === 'historical_exact'), 'historical name on same identity');
  check('DISC10', searchDiscovery('Freedom Mortgage Company').every((h) => h.record.slug !== 'freedom-mortgage-corporation' || h.match !== 'canonical_exact') || searchDiscovery('Freedom Mortgage Company').length === 0 || !searchDiscovery('Freedom Mortgage Company')[0].record.canonical_name.toLowerCase().includes('company'), 'Company label does not merge onto Corporation via name-only');
  check('DISC11', browseDiscovery('bank').length > 0 && browseDiscovery('bank').every((h) => h.record.depository === 'FDIC'), 'bank browse');
  check('DISC12', browseDiscovery('credit_union').length > 0 && browseDiscovery('credit_union').every((h) => h.record.depository === 'NCUA'), 'CU browse');
  check('DISC13', browseDiscovery('nonbank').length > 0 && browseDiscovery('nonbank').every((h) => h.record.depository === 'NONBANK'), 'nonbank browse');
  check(
    'DISC14',
    browseDiscovery('servicer').every((h) => h.record.servicer_role === 'CONFIRMED' || h.record.servicer_role === 'HISTORICAL'),
    'servicer browse excludes NOT ESTABLISHED'
  );
  check(
    'DISC15',
    searchDiscovery('rocket').every((h) => h.href.startsWith('/lender/') && !h.href.startsWith('/lenders/')),
    'links only /lender/{slug}'
  );
  check(
    'DISC16',
    DISCOVERY_RECORDS.every((r) => Boolean(getRenderRow(r.slug))),
    'every search row is render-enabled'
  );
  check('DISC17', getRenderRow('phh-home-loans')?.index === false && !getIndexingRow('phh-home-loans'), 'PHH hold not indexed');
  check('DISC18', nationalIndexingSitemapCount() === 180, 'sitemap 180');
  check('DISC19', nationalIndexingSitemapCount() === INDEXING_COHORT.length, 'sitemap = cohort');
  check('DISC20', nationalProfilePath('rocket-mortgage') === '/lender/rocket-mortgage', '/lender path');
  const boa = DISCOVERY_RECORDS.find((r) => r.slug === 'bank-of-america');
  const navyRow = DISCOVERY_RECORDS.find((r) => r.slug === 'navy-federal-credit-union');
  check(
    'DISC-hygiene',
    Boolean(
      boa &&
        boa.presentation_name === 'Bank of America Mortgage' &&
        !boa.presentation_name.includes('(DC)') &&
        navyRow &&
        !navyRow.presentation_name.includes('Jacksonville')
    ),
    'canonical presentation for locality display artifacts'
  );
  check(
    'DISC-hygiene-fn',
    nationalPresentationName('Bank of America Mortgage', 'Bank of America Mortgage (DC)') === 'Bank of America Mortgage',
    'presentation helper'
  );
  check('DISC27', !/best lender|top 180|recommended/i.test(JSON.stringify(searchDiscovery('bank'))), 'no ranking in results object');
  const ld = buildNationalDiscoveryJsonLd();
  check('DISC28', !jsonLdHasForbiddenRatings(ld), 'discovery jsonld no ratings');
  check('DISC-gate', NATIONAL_PROFILE_GATE.mode === 'controlled_index', 'gate');
  check('DISC-no-bhc', DISCOVERY_RECORDS.every((r) => !r.stable_key.startsWith('rssd-bhc:')), 'no BHCs in search');
  check('FLSEARCH-national', DISCOVERY_SEARCHABLE_COUNT === 181 && DISCOVERY_RECORDS.length === 181, 'national 181 intact');
  check('FLSEARCH-fl', FLORIDA_SEARCHABLE_COUNT === 130 && FLORIDA_DISCOVERY_RECORDS.length === 130, 'florida 130');
  check('FLSEARCH-union', COMBINED_SEARCHABLE_COUNT === 311 && SEARCH_POOL.length === 311, '311 unique');
  const natIds = new Set(DISCOVERY_RECORDS.map((r) => r.institution_id));
  const flIds = new Set(FLORIDA_DISCOVERY_RECORDS.map((r) => r.institution_id));
  check('FLSEARCH-overlap', [...flIds].every((id) => !natIds.has(id)), 'national∩florida=0');
  check(
    'FLSEARCH-name',
    searchDiscovery('ISLAND MORTGAGE, INC.').some((h) => h.record.slug === 'island-mortgage-inc' && h.match === 'canonical_exact'),
    'florida exact name'
  );
  check(
    'FLSEARCH-nmls',
    searchDiscovery('NMLS 1000869')[0]?.record.slug === 'island-mortgage-inc' &&
      searchDiscovery('NMLS 1000869')[0]?.matchedIdentifier === 'nmls',
    'florida exact NMLS institution'
  );
  check(
    'FLSEARCH-partial',
    searchDiscovery('island mortgage').some((h) => h.record.slug === 'island-mortgage-inc'),
    'florida partial name'
  );
  check(
    'FLSEARCH-national-still',
    searchDiscovery('NMLS 3030')[0]?.record.slug === 'rocket-mortgage',
    'national NMLS still first-class'
  );
  const leak = JSON.stringify(FLORIDA_DISCOVERY_RECORDS);
  check(
    'FLSEARCH-leak',
    !/raw_metadata|review_before_public|content_sha256|identity-resolution|service_role/.test(leak),
    'florida projection public-safe'
  );
  check(
    'FLSEARCH-person-branch-nmls-absent',
    FLORIDA_DISCOVERY_RECORDS.every((r) => r.nmls && !r.stable_key.startsWith('nmls-person:') && !r.stable_key.startsWith('nmls-branch:')),
    'only NMLS_INSTITUTION in florida search'
  );
  const b2 = searchDiscovery('axe capital lending');
  const c2 = searchDiscovery('think one mortgage');
  check(
    'FLSEARCH-no-ofr-rank',
    Boolean(b2[0] && c2[0] && b2[0].rank === c2[0].rank),
    'B2 and C2 same match rank family for comparable partials'
  );
  return out;
}
