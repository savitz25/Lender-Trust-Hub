import { lenders } from '../lib/mockData';
import { getCfpbComplaintEvidenceBySlug } from '../lib/cfpb/queries';
import { getMappedCfpbSlugs } from '../lib/cfpb/mappings';
import { dedupeLendersByEntity } from '../lib/verification/entity-identity';

const samples = [
  'bank-of-america-mortgage-silicon-valley',
  'bank-of-america-mortgage-west-valley',
  'veterans-united-jacksonville',
  'veterans-united-tampa',
  'guild-mortgage-jacksonville',
  'crosscountry-mortgage-panhandle',
  'movement-mortgage-greenville',
  'fairway-mortgage-upstate',
  'new-american-funding-jacksonville',
  'lennar-mortgage-clovis',
  'supreme-lending-south-florida',
  'acrisure-mortgage',
  'acrisure-mortgage-tampa',
  'union-home-mortgage-reeves-team',
  'city-national-bank-mortgage',
  'space-coast-credit-union',
  'homebridge-financial',
  'floridas-va-mortgage-center',
  'capital-city-home-loans',
];

console.log('primary mapping slugs', getMappedCfpbSlugs().length);

for (const s of samples) {
  const l = lenders.find((x) => x.slug === s);
  const e = getCfpbComplaintEvidenceBySlug(s, { nmlsId: l?.nmlsId });
  console.log(
    s.padEnd(48),
    e ? `YES total=${e.totalComplaints} via=${e.companiesMatched[0]}` : 'NO',
    l ? `nmls=${l.nmlsId}` : 'not in catalog'
  );
}

// count entities with cfpb
const entities = dedupeLendersByEntity(lenders);
let withCfpb = 0;
for (const l of entities) {
  if (getCfpbComplaintEvidenceBySlug(l.slug, { nmlsId: l.nmlsId })) withCfpb++;
}
console.log('\ndistinct entities with CFPB panel:', withCfpb, '/', entities.length);
