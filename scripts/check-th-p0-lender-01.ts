/**
 * TH-P0-LENDER-01 regression guard.
 *
 * Confirmed live production contradiction (fixed by this ticket):
 *   /lenders/doce-mortgage-group publicly rendered a "technical composite
 *   factors" disclosure block with decomposed x/N scoring — "NMLS identity
 *   evidence: 28/28", "CFPB complaint pattern: 8/16", "BBB grade: 0/12", etc.
 *   — even though the homepage says "No Trust Score. No ranking. You
 *   decide." Removing only the aggregate total is not enough; the per-factor
 *   point allocations are themselves a proprietary score.
 *
 *   npm run check:th-p0-lender-01
 */
import { readFileSync } from 'fs';
import { join } from 'path';

const errors: string[] = [];
function assert(cond: unknown, msg: string) {
  if (!cond) errors.push(msg);
}

const root = join(__dirname, '..');
const researchDisplaySrc = readFileSync(
  join(root, 'components/research/research-score-display.tsx'),
  'utf8'
);
const methodologySrc = readFileSync(join(root, 'app/methodology/page.tsx'), 'utf8');
const matchButtonSrc = readFileSync(join(root, 'components/MatchLenderButton.tsx'), 'utf8');
const calcMatchCtaSrc = readFileSync(
  join(root, 'components/calculators/shared/CalcMatchCTA.tsx'),
  'utf8'
);

// --- No decomposed x/N factor scoring rendered on the live profile page ---
assert(
  !/\{f\.points\}\s*\/\s*\{f\.maxPoints\}/.test(researchDisplaySrc),
  'research score display must not render per-factor "points/maxPoints" (decomposed x/N scoring)'
);
assert(
  !/points}\/{f\.maxPoints/.test(researchDisplaySrc),
  'research score display must not render a "N/M" style factor score fragment'
);

// --- Methodology page must not publish factor-weight point allocations ---
assert(
  !/up to 28|up to 26|up to 16 |up to 12|NMLS identity evidence — up to/.test(methodologySrc),
  'methodology page must not publish decomposed factor-weight point allocations'
);
assert(
  methodologySrc.includes('SOURCE → VERIFY → EXPLAIN → DISCLOSE → UPDATE → YOU DECIDE'),
  'methodology page must state the canonical network doctrine sequence (SOURCE → VERIFY → EXPLAIN → DISCLOSE → UPDATE → YOU DECIDE)'
);
assert(
  !/SOURCE\s*→\s*VERIFY\s*→\s*DISCLOSE\s*→\s*SCORE/.test(methodologySrc),
  'methodology page must not describe the legacy SOURCE → VERIFY → DISCLOSE → SCORE sequence'
);
assert(
  !/Research Score \+ Data Confidence \+ NMLS status/.test(methodologySrc),
  'methodology page must not describe a "Research Score" step as a research aid'
);

// --- "Match Me" lead-marketplace-style wording must not return on a CTA ---
// that only links to a filtered public directory (buildMatchUrl → /local-lenders).
assert(
  !/Match Me to/.test(matchButtonSrc),
  'MatchLenderButton must not imply a personalized "match" service when it only filters the public directory'
);
assert(
  !/Match Me to/.test(calcMatchCtaSrc),
  'CalcMatchCTA must not imply a personalized "match" service when it only filters the public directory'
);

if (errors.length) {
  console.error('TH-P0-LENDER-01 FAIL');
  for (const e of errors) console.error(' -', e);
  process.exit(1);
}
console.log('TH-P0-LENDER-01 PASS');
