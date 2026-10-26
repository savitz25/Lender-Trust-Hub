import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryCTAs } from '../components/fdic/CategoryCTAs';
import { US_STATES } from '../lib/fdic/states';
import { getStateSlugsWithAutoProviders } from '../lib/auto/stateProviders';

const autoStateSlugs = new Set(getStateSlugsWithAutoProviders());
const supportedState = US_STATES.find((state) => autoStateSlugs.has(state.slug));
const unsupportedState = US_STATES.find((state) => !autoStateSlugs.has(state.slug));
assert.ok(supportedState, 'fixture has a state with published auto inventory');
assert.ok(unsupportedState, 'fixture has a state without published auto inventory');

const supportedHtml = renderToStaticMarkup(
  createElement(CategoryCTAs, { stateMeta: supportedState }),
);
assert.ok(
  supportedHtml.includes(`href="/auto-loan-companies/${supportedState.slug}"`),
  'states with auto inventory retain their Auto Loans link',
);
assert.ok(!supportedHtml.includes('/credit-repair/'), 'credit repair coming-soon routes are not linked');
assert.ok(!supportedHtml.includes('/mca-companies/'), 'MCA coming-soon routes are not linked');

const unsupportedHtml = renderToStaticMarkup(
  createElement(CategoryCTAs, { stateMeta: unsupportedState }),
);
assert.ok(
  !unsupportedHtml.includes('/auto-loan-companies/'),
  'states without auto inventory do not link to 404 state routes',
);

console.log('L1 internal link checks passed');
