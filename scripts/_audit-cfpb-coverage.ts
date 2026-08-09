import { CFPB_COMPANY_MAPPINGS, getMappedCfpbSlugs } from '../lib/cfpb/mappings';
import { getCfpbComplaintEvidenceBySlug, getCfpbMappedSlugsWithData } from '../lib/cfpb/queries';
import { loadCfpbSnapshot } from '../lib/cfpb/load';

const snap = loadCfpbSnapshot();
console.log(
  'mappings',
  CFPB_COMPANY_MAPPINGS.length,
  'snapshot',
  snap?.companies.length,
  'slugs with data',
  getCfpbMappedSlugsWithData().length
);

const wave3 = [
  'movement-mortgage-myrtle-beach',
  'navy-federal-jacksonville',
  'penfed-dc-mid-city',
  'primelending-columbus',
  'fairway-mortgage-augusta-sheppard',
  'guild-mortgage-west-valley',
  'crosscountry-mortgage-west-valley',
  'prmg',
  'dhi-mortgage-buckeye',
  'cmg-home-loans-dennis-vo',
  'prmi-aaron-swenson',
];

for (const s of wave3) {
  const e = getCfpbComplaintEvidenceBySlug(s);
  console.log(
    s.padEnd(40),
    e
      ? `total=${e.totalComplaints} recent=${e.complaintsLast24Months} companies=${e.companiesMatched.join(' | ')}`
      : 'NO'
  );
}

console.log('all mapped slugs', getMappedCfpbSlugs().length);
