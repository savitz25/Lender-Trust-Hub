import {
  MAJOR_GEORGIA_COUNTY_SLUGS,
  getHmdaCountyEvidence,
  getHmdaLenderEvidenceBySlug,
  loadHmdaStateData,
} from '../lib/hmda';

const ga = loadHmdaStateData('GA');
console.log('major config', MAJOR_GEORGIA_COUNTY_SLUGS.size);
console.log('county markets', ga.countyMarkets.length);
console.log('mappings', ga.mappings.length);
const panelReady = ga.countyMarkets.filter((c) =>
  MAJOR_GEORGIA_COUNTY_SLUGS.has(c.countySlug)
);
console.log(
  'panel-ready counties',
  panelReady.length,
  panelReady
    .map((c) => c.countySlug)
    .sort()
    .join(', ')
);
for (const slug of [
  'jackson',
  'rockdale',
  'lowndes',
  'glynn',
  'clarke',
  'fulton',
  'effingham',
]) {
  const e = getHmdaCountyEvidence('georgia', slug);
  console.log('county', slug, e ? `OK apps=${e.applications}` : 'NULL');
}
for (const slug of [
  'synovus-bank',
  'planet-home-lending',
  'mutual-of-omaha-mortgage',
  'zillow-home-loans',
  'rocket-mortgage',
  'union-home-mortgage-reeves-team',
  'amerihome-mortgage',
]) {
  const e = getHmdaLenderEvidenceBySlug(slug);
  console.log(
    'lender',
    slug,
    e
      ? `OK primary=${e.stateSlug} orig=${e.stateOriginations} other=${(e.otherStates || []).map((s) => s.stateCode).join(',')}`
      : 'NULL'
  );
}
