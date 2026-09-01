/**
 * List high-visibility directory slugs without CFPB mapping (or without snapshot data).
 */
import { lenders } from '../lib/mockData';
import { getMappedCfpbSlugs } from '../lib/cfpb/mappings';
import { getCfpbComplaintEvidenceBySlug } from '../lib/cfpb/queries';
import { getHmdaLenderEvidenceBySlug } from '../lib/hmda';
import { dedupeLendersByEntity } from '../lib/verification/entity-identity';

const mapped = new Set(getMappedCfpbSlugs());
const entities = dedupeLendersByEntity(lenders);

const rows: {
  slug: string;
  name: string;
  nmls: string;
  hmdaFl: number | null;
  hasCfpb: boolean;
}[] = [];

for (const l of entities) {
  const hmda = getHmdaLenderEvidenceBySlug(l.slug);
  const cfpb = getCfpbComplaintEvidenceBySlug(l.slug);
  rows.push({
    slug: l.slug,
    name: l.name,
    nmls: l.nmlsId,
    hmdaFl: hmda?.floridaOriginations ?? null,
    hasCfpb: Boolean(cfpb),
  });
}

const unmapped = rows
  .filter((r) => !mapped.has(r.slug))
  .sort((a, b) => (b.hmdaFl ?? 0) - (a.hmdaFl ?? 0));

console.log('distinct entities', entities.length);
console.log('cfpb mapped slugs', mapped.size);
console.log('unmapped with any HMDA FL volume:', unmapped.filter((r) => r.hmdaFl).length);
console.log('\nTop unmapped by FL HMDA originations:');
for (const r of unmapped.slice(0, 40)) {
  console.log(
    String(r.hmdaFl ?? '—').padStart(8),
    r.slug.padEnd(42),
    r.name.slice(0, 40),
    'nmls',
    r.nmls
  );
}

console.log('\nUnmapped national brands (no HMDA link but major names):');
const brandHints =
  /bank of america|wells|chase|quicken|veterans united|new american|guild|movement|navy federal|penfed|fairway|cross.?country|amex|american express|citibank|citi bank|fifth third|huntington|keybank|capital one|discover|synchrony|quicken|loan depot|rocket|freedom|penny|nationstar|mr.?cooper|shellpoint|uwm|united wholesale|guaranteed rate|better|sofi|ally|usaa|flagstar|truist|regions|pnc|td bank|citizens|ameris|southstate|first horizon|dhi|lennar|eagle|academy|carrington|lakeview|homebridge|prmg|paramount|prmi|primary residential|cmg|cardinal|amerihome|newrez|loandepot|loan depot|fairway|prime lending|vystar|suncoast|space coast|achieva|fairwinds|midflorida|community first|campus usa|gte|trustco|seacoast|city national|synovus|amerisave|village capital|lower|kind|figure|zillow|mutual of omaha|union home|kiavi|angel oak|planet home|nfm|click|mortgage firm|a&d mortgage|ad mortgage/i;

for (const r of unmapped.filter((r) => brandHints.test(r.name) || brandHints.test(r.slug))) {
  if (r.hmdaFl) continue; // already listed above if has volume
  console.log(' ', r.slug, '|', r.name);
}
