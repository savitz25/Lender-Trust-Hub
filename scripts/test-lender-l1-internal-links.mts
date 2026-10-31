import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryCTAs } from '../components/fdic/CategoryCTAs';
import { CrossVerticalNav } from '../components/directory/CrossVerticalNav';
import { InternalLinkHub } from '../components/directory/InternalLinkHub';
import { PersonalizedBanner } from '../components/directory/PersonalizedBanner';
import { RelatedDirectoryLinks } from '../components/directory/RelatedDirectoryLinks';
import { US_STATES } from '../lib/fdic/states';
import { getStateSlugsWithAutoProviders } from '../lib/auto/stateProviders';
import {
  publishedAutoStatePath,
  publishedFdicStatePath,
  publishedMortgageStatePath,
} from '../lib/directory/published-state-routes';

const autoStateSlugs = new Set(getStateSlugsWithAutoProviders());
const supportedState = US_STATES.find((state) => state.slug === 'florida');
const mortgageOnlyState = US_STATES.find((state) => state.slug === 'alabama');
const unavailableState = US_STATES.find((state) => state.slug === 'vermont');
assert.ok(supportedState && autoStateSlugs.has(supportedState.slug));
assert.ok(mortgageOnlyState && !autoStateSlugs.has(mortgageOnlyState.slug));
assert.ok(unavailableState);

assert.equal(publishedAutoStatePath('florida'), '/auto-loan-companies/florida');
assert.equal(publishedAutoStatePath('alabama'), null);
assert.equal(publishedAutoStatePath('vermont'), null);
assert.equal(publishedMortgageStatePath('alabama'), '/local-lenders/alabama');
assert.equal(publishedMortgageStatePath('vermont'), null);
assert.equal(publishedFdicStatePath('vermont'), '/fdic-insured-banks/vermont');
assert.equal(publishedFdicStatePath('not-a-state'), null);

function htmlFor(state: NonNullable<typeof supportedState>) {
  return renderToStaticMarkup(createElement(CategoryCTAs, { stateMeta: state }));
}

const supportedHtml = htmlFor(supportedState!);
assert.ok(supportedHtml.includes('href="/auto-loan-companies/florida"'));
assert.ok(supportedHtml.includes('href="/local-lenders/florida"'));
assert.ok(supportedHtml.includes('href="/calculators"'));
assert.ok(!supportedHtml.includes('/credit-repair/'));
assert.ok(!supportedHtml.includes('/mca-companies/'));

const mortgageOnlyHtml = htmlFor(mortgageOnlyState!);
assert.ok(mortgageOnlyHtml.includes('href="/local-lenders/alabama"'));
assert.ok(!mortgageOnlyHtml.includes('/auto-loan-companies/'));
assert.ok(!mortgageOnlyHtml.includes('/credit-repair/'));
assert.ok(!mortgageOnlyHtml.includes('/mca-companies/'));

const unavailableHtml = htmlFor(unavailableState!);
assert.ok(!unavailableHtml.includes('/auto-loan-companies/'));
assert.ok(!unavailableHtml.includes('/local-lenders/'));
assert.ok(unavailableHtml.includes('href="/calculators"'));
assert.ok(!unavailableHtml.includes('/credit-repair/'));
assert.ok(!unavailableHtml.includes('/mca-companies/'));

const alabamaNav = renderToStaticMarkup(
  createElement(CrossVerticalNav, {
    stateSlug: 'alabama',
    stateName: 'Alabama',
    activeVertical: 'fdic',
  }),
);
assert.ok(alabamaNav.includes('href="/fdic-insured-banks/alabama"'));
assert.ok(alabamaNav.includes('href="/local-lenders/alabama"'));
assert.ok(alabamaNav.includes('href="/calculators"'));
assert.ok(!alabamaNav.includes('/auto-loan-companies/'));

const vermontNav = renderToStaticMarkup(
  createElement(CrossVerticalNav, {
    stateSlug: 'vermont',
    stateName: 'Vermont',
    activeVertical: 'fdic',
  }),
);
assert.ok(vermontNav.includes('href="/fdic-insured-banks/vermont"'));
assert.ok(vermontNav.includes('href="/calculators"'));
assert.ok(!vermontNav.includes('/local-lenders/'));
assert.ok(!vermontNav.includes('/auto-loan-companies/'));

const hubNav = renderToStaticMarkup(createElement(CrossVerticalNav, { activeVertical: 'fdic' }));
assert.ok(hubNav.includes('href="/auto-loan-companies"'));
assert.ok(hubNav.includes('href="/local-lenders"'));
assert.ok(hubNav.includes('href="/fdic-insured-banks"'));

const alabamaLinks = renderToStaticMarkup(
  createElement(InternalLinkHub, { stateMeta: mortgageOnlyState! }),
);
assert.ok(alabamaLinks.includes('href="/local-lenders/alabama"'));
assert.ok(!alabamaLinks.includes('/auto-loan-companies/'));

const vermontLinks = renderToStaticMarkup(
  createElement(InternalLinkHub, { stateMeta: unavailableState! }),
);
assert.ok(!vermontLinks.includes('/local-lenders/'));
assert.ok(!vermontLinks.includes('/auto-loan-companies/'));
assert.ok(vermontLinks.includes('href="/calculators"'));

const profileLinks = renderToStaticMarkup(
  createElement(RelatedDirectoryLinks, { stateSlug: 'alabama', stateName: 'Alabama' }),
);
assert.ok(profileLinks.includes('href="/local-lenders/alabama"'));
assert.ok(profileLinks.includes('href="/fdic-insured-banks/alabama"'));
assert.ok(!profileLinks.includes('/auto-loan-companies/'));

const floridaProfileLinks = renderToStaticMarkup(
  createElement(RelatedDirectoryLinks, { stateSlug: 'florida', stateName: 'Florida' }),
);
assert.ok(floridaProfileLinks.includes('href="/auto-loan-companies/florida"'));

const vermontBanner = renderToStaticMarkup(
  createElement(PersonalizedBanner, {
    stateName: 'Vermont',
    stateSlug: 'vermont',
    vertical: 'fdic',
  }),
);
assert.ok(vermontBanner.includes('href="/local-lenders"'));
assert.ok(!vermontBanner.includes('/local-lenders/vermont'));

const floridaBanner = renderToStaticMarkup(
  createElement(PersonalizedBanner, {
    stateName: 'Florida',
    stateSlug: 'florida',
    vertical: 'fdic',
  }),
);
assert.ok(floridaBanner.includes('href="/local-lenders/florida"'));

const mortgagePage = readFileSync('app/local-lenders/[state]/page.tsx', 'utf8');
const autoPage = readFileSync('app/auto-loan-companies/[state]/page.tsx', 'utf8');
assert.ok(mortgagePage.includes('publishedAutoStatePath(slug)'));
assert.ok(!mortgagePage.includes('AUTO_CATEGORY.statePath'));
assert.ok(autoPage.includes('publishedFdicStatePath(slug)'));
assert.ok(autoPage.includes('publishedMortgageStatePath(slug)'));
assert.ok(!autoPage.includes('.statePath(slug)'));

console.log('L1 internal link checks passed');
