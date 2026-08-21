/**
 * SHARE-002 metadata contract — Lender Trust Hub.
 * Run: node scripts/assert-share-002.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const readBin = (rel) => readFileSync(join(root, rel));

const failures = [];
function assert(cond, msg) {
  if (!cond) failures.push(msg);
}

function pngSize(rel) {
  const buf = readBin(rel);
  if (buf.subarray(0, 8).toString('binary') !== '\x89PNG\r\n\x1a\n') {
    throw new Error(`${rel} is not a PNG`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const shareHub = read('lib/seo/share-hub.ts');
const layout = read('app/layout.tsx');
const lenderPage = read('app/lenders/[slug]/page.tsx');
const toolPage = read('app/tools/loan-estimate-analyzer/page.tsx');

assert(shareHub.includes("id: 'lender'"), 'SHARE_HUB.id is lender');
assert(shareHub.includes("host: 'www.lendertrusthub.com'"), 'SHARE_HUB.host');
assert(shareHub.includes("origin: 'https://www.lendertrusthub.com'"), 'SHARE_HUB.origin');
assert(shareHub.includes("ogImagePath: '/brand/lender-trust-hub-og.png'"), 'dedicated OG PNG');
assert(shareHub.includes('ogWidth: 1200') && shareHub.includes('ogHeight: 630'), '1200×630');
assert(shareHub.includes("twitterCard: 'summary_large_image'"), 'twitter large');
assert(!shareHub.includes('logo-header.png'), 'share hub is not the header logo');

assert(layout.includes("from '@/lib/seo/share-hub'"), 'layout imports SHARE_HUB');
assert(layout.includes('shareOgImageAbsoluteUrl'), 'layout uses absolute OG URL');
assert(layout.includes('SHARE_HUB.twitterCard'), 'twitter card from SHARE_HUB');
assert(!layout.includes('lender-trust-hub-logo-header.png'), '720×217 header logo is not the social image');
assert(!layout.includes('width: 720'), 'layout OG is not 720 wide');
assert(!layout.includes('height: 217'), 'layout OG is not 217 tall');
assert(!layout.includes('localhost'), 'no localhost in layout');
assert(!layout.includes('127.0.0.1'), 'no 127.0.0.1');
assert(!layout.includes('.vercel.app'), 'no vercel.app');
assert(!/https:\/\/www\.(ask|move|insurance|contractor|senior|investor)trusthub\.com/.test(layout), 'no other Hub origin');

assert(lenderPage.includes('www.lendertrusthub.com'), 'lender page canonical is Lender host');
assert(toolPage.includes('www.lendertrusthub.com'), 'tool page canonical is Lender host');

const card = pngSize('public/brand/lender-trust-hub-og.png');
assert(card.width === 1200 && card.height === 630, `OG PNG is 1200×630, got ${card.width}×${card.height}`);

if (failures.length) {
  console.error('SHARE-002 Lender assertions failed:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('SHARE-002 Lender assertions passed (1200×630 PNG replaced 720×217 header logo, twitter large, no localhost).');
