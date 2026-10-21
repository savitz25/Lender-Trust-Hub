/**
 * LENDER-COMPARE-STAR-001 — /compare must not show a placeholder star rating,
 * and unsupported structured-data ratings must not be emitted.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AutoProviderCard } from '../components/auto/AutoProviderCard.tsx';
import { CompareLenderChoices } from '../components/compare/compare-lender-choices.tsx';
import { LenderDirectoryClient } from '../components/directory/LenderDirectoryClient.tsx';
import { LenderEvidenceCard } from '../components/embed/lender-evidence-card.tsx';
import { autoProviders } from '../lib/auto/providers.ts';
import { buildAutoStateJsonLd } from '../lib/auto/seo.ts';
import type { AutoLoanProvider } from '../lib/auto/types.ts';
import { LENDER_HEADER_NAV } from '../lib/design/lender-design-system.ts';
import { filterAndSortLenders } from '../lib/directory/filter-lenders.ts';
import type { StateMeta } from '../lib/fdic/types.ts';
import { filterLenders } from '../lib/lenders.ts';
import { lenders } from '../lib/mockData.ts';
import { buildNationalProfileJsonLd, jsonLdHasForbiddenRatings } from '../lib/national-profile/jsonld.ts';
import { hasDisplayableLenderRating } from '../lib/research/lender-rating.ts';
import { computeLenderResearchSignals, getLenderEvidenceBadges } from '../lib/research/research-signals.ts';
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
const autoCardSource = fs.readFileSync(
  new URL('../components/auto/AutoProviderCard.tsx', import.meta.url),
  'utf8',
);
const directorySource = fs.readFileSync(
  new URL('../components/directory/LenderDirectoryClient.tsx', import.meta.url),
  'utf8',
);
const directoryPageSource = fs.readFileSync(
  new URL('../app/local-lenders/page.tsx', import.meta.url),
  'utf8',
);
const filterSource = fs.readFileSync(
  new URL('../lib/directory/filter-lenders.ts', import.meta.url),
  'utf8',
);
const embedSource = fs.readFileSync(
  new URL('../components/embed/lender-evidence-card.tsx', import.meta.url),
  'utf8',
);
const signalsSource = fs.readFileSync(
  new URL('../lib/research/research-signals.ts', import.meta.url),
  'utf8',
);
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
  assert.equal(hasDisplayableLenderRating(NaN, 10), false);
  assert.equal(hasDisplayableLenderRating(Infinity, 10), false);
  assert.equal(hasDisplayableLenderRating(-Infinity, 10), false);
  assert.equal(hasDisplayableLenderRating(-1, 12), false);
  assert.equal(hasDisplayableLenderRating(4.8, -3), false);
  assert.equal(hasDisplayableLenderRating(4.8, 634), true);
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

test('auto card does not render the synthetic Sunshine State rating', () => {
  const provider = autoProviders.find((item) => item.name === 'Sunshine State Auto Finance');
  assert.ok(provider);
  assert.equal(provider.rating, 4.8);
  assert.equal(provider.reviewCount, 634);
  const html = renderToStaticMarkup(
    React.createElement(AutoProviderCard, { provider, rank: 1 }),
  );
  assert.match(html, /Sunshine State Auto Finance/);
  assert.match(html, /Fort Lauderdale, Florida/);
  assert.match(html, /Credit Union/);
  assert.match(html, /Florida credit union auto loans/);
  assert.match(html, /APR 4\.9% – 12\.4%/);
  assert.match(html, /https:\/\/example\.com/);
  assert.doesNotMatch(html, /4\.8/);
  assert.doesNotMatch(html, /634/);
  assert.doesNotMatch(html, /★|lucide-star|fill-current|text-amber-700|bg-amber-500/);
  assert.doesNotMatch(html, /aria-label="[^"]*rating/i);
  assert.doesNotMatch(html, /highly rated|top provider|Trust Score/i);
  assert.doesNotMatch(autoCardSource, /hasDisplayableLenderRating|rating\.toFixed|reviewCount/);
});

test('no auto seed rating renders on an auto provider card', () => {
  for (const provider of autoProviders) {
    const html = renderToStaticMarkup(
      React.createElement(AutoProviderCard, { provider, rank: 1 }),
    );
    assert.match(html, new RegExp(provider.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(html, /★|lucide-star|fill-current|text-amber-700|bg-amber-500/);
    assert.equal(html.includes(`(${provider.reviewCount.toLocaleString()})`), false);
    assert.doesNotMatch(html, /aria-label="[^"]*rating/i);
  }
});

test('directory drops the min-rating control and ignores a legacy threshold', () => {
  const html = renderToStaticMarkup(
    React.createElement(LenderDirectoryClient, {
      lenders: lenders.slice(0, 8),
      pageSize: 8,
      showSearch: true,
    }),
  );
  assert.doesNotMatch(html, /Min rating/);
  assert.doesNotMatch(html, /4\.5\+ stars/);
  assert.doesNotMatch(html, /4\.0\+ stars/);
  assert.doesNotMatch(html, /3\.5\+ stars/);
  assert.match(html, /Loan type/);
  assert.match(html, /NMLS verified only/);
  assert.match(html, /BBB A\+ only/);
  assert.match(html, /United Wholesale Mortgage|Rocket Mortgage/);
  assert.doesNotMatch(directorySource, /Min rating|4\.5\+ stars|initialMinRating/);
  assert.doesNotMatch(directoryPageSource, /initialMinRating/);
  assert.match(directoryPageSource, /void firstParam\(params\.minRating\)/);
  assert.doesNotMatch(filterSource, /l\.rating >= query\.minRating/);

  const baseline = filterAndSortLenders(lenders, {});
  const legacy = filterAndSortLenders(lenders, { minRating: 4.5 });
  assert.deepEqual(
    legacy.map((lender) => lender.id),
    baseline.map((lender) => lender.id),
  );
  const nonsense = filterAndSortLenders(lenders, { minRating: Number.NaN });
  assert.equal(nonsense.length, baseline.length);
  const fha = filterAndSortLenders(lenders, { loanType: 'FHA' });
  assert.ok(fha.length > 0);
  assert.ok(fha.length < lenders.length);
  assert.ok(fha.every((lender) => lender.loanTypes.includes('FHA')));
  const verified = filterAndSortLenders(lenders, { nmlsVerifiedOnly: true });
  assert.ok(verified.length > 0);
  assert.ok(verified.every((lender) => lender.nmlsVerified));
  const searched = filterAndSortLenders(lenders, { search: 'Rocket' });
  assert.ok(searched.some((lender) => lender.name === 'Rocket Mortgage'));
  assert.ok(searched.length < lenders.length);

  const viaLegacyApi = filterLenders({ minRating: 4.5 });
  const viaOpenApi = filterLenders({});
  assert.deepEqual(
    viaLegacyApi.map((lender) => lender.id),
    viaOpenApi.map((lender) => lender.id),
  );
});

test('changed lender cards do not publish a positive unsourced rating', () => {
  const seeded = lenders[0];
  assert.ok(seeded);
  const synthetic = { ...seeded, rating: 4.8, reviewCount: 634, googleRating: 4.8 };
  const embedHtml = renderToStaticMarkup(
    React.createElement(LenderEvidenceCard, {
      lender: synthetic,
      hmda: null,
      cfpb: null,
      countyHmda: null,
      countyShareOriginations: null,
    }),
  );
  assert.match(embedHtml, new RegExp(synthetic.name));
  assert.doesNotMatch(embedHtml, /4\.8/);
  assert.doesNotMatch(embedHtml, /634/);
  assert.doesNotMatch(embedHtml, /Attributed rating snapshot|★|lucide-star/);
  assert.doesNotMatch(embedSource, /hasDisplayableLenderRating|rating\.toFixed|reviewCount/);

  const badges = getLenderEvidenceBadges(synthetic);
  const ratingBadge = badges.find((badge) => badge.id === 'ratings');
  assert.equal(ratingBadge?.present, false);
  assert.equal(ratingBadge?.label, 'No attributed rating');
  assert.doesNotMatch(ratingBadge?.detail ?? '', /4\.8|634/);
  const detail = computeLenderResearchSignals(synthetic).factors.find(
    (factor) => factor.id === 'reputation',
  )?.detail;
  assert.equal(detail, 'No supported rating on file');
  assert.doesNotMatch(signalsSource, /hasDisplayableLenderRating|Catalog snapshot/);

  const callers = [
    autoCardSource,
    embedSource,
    signalsSource,
    directorySource,
    compareSource,
  ];
  for (const source of callers) {
    assert.equal(source.includes('hasDisplayableLenderRating'), false);
  }
});
