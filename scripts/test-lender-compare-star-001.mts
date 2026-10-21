/**
 * LENDER-COMPARE-STAR-001 — /compare must not show a placeholder star rating,
 * and unsupported structured-data ratings must not be emitted.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompareLenderChoices } from '../components/compare/compare-lender-choices.tsx';
import { buildAutoStateJsonLd } from '../lib/auto/seo.ts';
import type { AutoLoanProvider } from '../lib/auto/types.ts';
import { LENDER_HEADER_NAV } from '../lib/design/lender-design-system.ts';
import type { StateMeta } from '../lib/fdic/types.ts';
import { lenders } from '../lib/mockData.ts';
import { buildNationalProfileJsonLd, jsonLdHasForbiddenRatings } from '../lib/national-profile/jsonld.ts';
import { hasDisplayableLenderRating } from '../lib/research/lender-rating.ts';
import { computeLenderResearchSignals } from '../lib/research/research-signals.ts';
import { buildLenderOrganizationSchema } from '../lib/seo/organization.ts';

const compareSource = fs.readFileSync(new URL('../app/compare/page.tsx', import.meta.url), 'utf8');
const choicesSource = fs.readFileSync(
  new URL('../components/compare/compare-lender-choices.tsx', import.meta.url),
  'utf8',
);
const navbarSource = fs.readFileSync(new URL('../components/Navbar.tsx', import.meta.url), 'utf8');
const homeSource = fs.readFileSync(
  new URL('../components/home-intel/lender-home-intelligence.tsx', import.meta.url),
  'utf8',
);
const cardSource = fs.readFileSync(new URL('../components/LenderCard.tsx', import.meta.url), 'utf8');
const profileSource = fs.readFileSync(new URL('../app/lenders/[slug]/page.tsx', import.meta.url), 'utf8');
const autoSeoSource = fs.readFileSync(new URL('../lib/auto/seo.ts', import.meta.url), 'utf8');
const fdicTemplate = fs.readFileSync(
  new URL('../public/templates/fdic-state-page-template.html', import.meta.url),
  'utf8',
);

const NAMED = [
  'United Wholesale Mortgage',
  'Rocket Mortgage',
  'Freedom Mortgage',
  'loanDepot',
  'JPMorgan Chase Bank',
];

function compareMarkup(): string {
  return renderToStaticMarkup(
    React.createElement(CompareLenderChoices, {
      lenders: lenders.slice(0, 10),
      selected: [],
      onToggle: () => undefined,
    }),
  );
}

test('compare page renders named lenders without a star, 0.0, or rating container', () => {
  const html = compareMarkup();
  for (const name of NAMED) {
    assert.match(html, new RegExp(name));
  }
  assert.doesNotMatch(html, /★/);
  assert.doesNotMatch(html, /0\.0/);
  assert.doesNotMatch(html, /lucide-star|fill-current|text-amber-700/);
  assert.doesNotMatch(html, /aria-label="[^"]*rating/i);
  assert.equal(html.includes('data-rating'), false);
  assert.match(html, /NMLS 3030/);
  assert.match(html, /Select Rocket Mortgage for comparison/);
  assert.match(compareSource, /href=\{`\/lenders\/\$\{l\.slug\}`\}/);
  for (const field of [
    'NMLS ID',
    'NMLS status',
    'Local HQ evidence',
    'Closing performance',
    'CFPB complaints',
    'Loan Types',
  ]) {
    assert.match(compareSource, new RegExp(field));
  }
});

test('desktop and mobile share the same no-rating compare markup', () => {
  assert.match(compareSource, /<CompareLenderChoices/);
  assert.doesNotMatch(compareSource, /<Star|rating\.toFixed|matchMedia|useMediaQuery/);
  assert.doesNotMatch(choicesSource, /<Star|rating\.toFixed|matchMedia|useMediaQuery|md:hidden|sm:hidden/);
  assert.equal(navbarSource.split('LENDER_HEADER_NAV.map').length, 3);
  assert.equal(
    LENDER_HEADER_NAV.find((item) => item.href === '/compare')?.label,
    'Compare companies',
  );
  const html = compareMarkup();
  assert.doesNotMatch(html, /Compare rates/);
  assert.doesNotMatch(html, /Compare lender rates/);
  assert.doesNotMatch(html, /Rate comparison/);
});

test('missing, null, and zero scores do not count as a displayable rating', () => {
  assert.equal(hasDisplayableLenderRating(null, 10), false);
  assert.equal(hasDisplayableLenderRating(undefined, 10), false);
  assert.equal(hasDisplayableLenderRating(0, 10), false);
  assert.equal(hasDisplayableLenderRating(4.5, 0), false);
  assert.equal(hasDisplayableLenderRating(4.5, null), false);
  assert.equal(hasDisplayableLenderRating(4.5, undefined), false);
  const rocket = lenders.find((lender) => lender.slug === 'rocket-mortgage');
  assert.ok(rocket);
  assert.equal(rocket.rating, 0);
  assert.equal(hasDisplayableLenderRating(rocket.rating, rocket.reviewCount), false);
  const detail = computeLenderResearchSignals(rocket).factors.find((factor) => factor.id === 'reputation')
    ?.detail;
  assert.ok(detail);
  assert.doesNotMatch(detail, /0\.0/);
  assert.doesNotMatch(detail, /★/);
});

test('lender structured data omits unsupported aggregate ratings', () => {
  const national = buildNationalProfileJsonLd({
    name: 'Rocket Mortgage',
    slug: 'rocket-mortgage',
    identifiers: [],
  });
  assert.equal(jsonLdHasForbiddenRatings(national), false);
  const org = JSON.stringify(buildLenderOrganizationSchema());
  assert.equal(org.includes('aggregateRating'), false);
  assert.equal(org.includes('ratingValue'), false);
  assert.equal(org.includes('reviewCount'), false);
  const auto = buildAutoStateJsonLd({ slug: 'florida', fullName: 'Florida' } as StateMeta, [
    {
      id: 'zero',
      slug: 'zero-lender',
      name: 'Zero Lender',
      rating: 0,
      reviewCount: 0,
      website: 'https://example.com',
    } as AutoLoanProvider,
  ]);
  const autoRaw = JSON.stringify(auto);
  assert.equal(autoRaw.includes('aggregateRating'), false);
  assert.equal(autoRaw.includes('ratingValue'), false);
  assert.equal(autoRaw.includes('"reviewCount"'), false);
  assert.equal(autoSeoSource.includes('aggregateRating'), false);
  assert.equal(fdicTemplate.includes('aggregateRating'), false);
  assert.equal(fdicTemplate.includes('ratingValue'), false);
  assert.equal(compareSource.includes('aggregateRating'), false);
});

test('compare does not promise rate comparison, and the no-score promise stays', () => {
  assert.match(compareSource, /not rate quotes, rankings, or approvals/);
  assert.doesNotMatch(compareSource, /Compare rates|Compare lender rates|Rate comparison/);
  assert.match(homeSource, /No Trust Score\. No ranking\./);
  assert.doesNotMatch(compareSource, /Trust Score/);
  assert.doesNotMatch(cardSource, /<Star|rating\.toFixed|fill-current/);
  assert.doesNotMatch(profileSource, /<Star|rating\.toFixed/);
});
