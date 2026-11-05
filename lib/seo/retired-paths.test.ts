import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';
import { US_STATES } from '@/lib/fdic/states';
import { getStateSlugsWithAutoProviders } from '@/lib/auto/stateProviders';
import {
  cleanLocalLendersQueryPath,
  parseJourneyContext,
  resolveLenderLandingPath,
} from '@/lib/network/journey-context';
import { dispositionForPathname } from './retired-paths';

const publishedAuto = new Set(getStateSlugsWithAutoProviders());

test('geography query URLs permanent-redirect to a clean path', () => {
  const journey = parseJourneyContext({
    state: 'FL',
    county: 'miami-dade',
    loanType: 'FHA',
  });
  assert.equal(cleanLocalLendersQueryPath(journey), '/local-lenders/florida/miami-dade');
  assert.equal(
    cleanLocalLendersQueryPath(parseJourneyContext({ state: 'florida' })),
    '/local-lenders/florida'
  );
  assert.equal(cleanLocalLendersQueryPath(parseJourneyContext({ loanType: 'FHA' })), null);
  assert.match(resolveLenderLandingPath(journey), /\?/);

  const page = readFileSync(join(process.cwd(), 'app/local-lenders/page.tsx'), 'utf8');
  assert.match(page, /permanentRedirect\(cleanPath\)/);
  assert.doesNotMatch(page, /from 'next\/navigation'[\s\S]*\bredirect\b/);
  assert.match(page, /import \{ permanentRedirect \} from 'next\/navigation'/);
});

test('retired paths are 410 or 301 and live paths are left alone', async () => {
  for (const path of ['/credit-repair', '/credit-repair/', '/credit-repair/florida', '/mca-companies', '/mca-companies/texas']) {
    assert.equal(dispositionForPathname(path).action, 'gone', path);
    const response = await middleware(new NextRequest(`https://example.com${path}?q=1`));
    assert.equal(response.status, 410, path);
  }

  for (const state of US_STATES) {
    const path = `/auto-loan-companies/${state.slug}`;
    const disposition = dispositionForPathname(path);
    if (publishedAuto.has(state.slug)) {
      assert.equal(disposition.action, 'next', path);
    } else {
      assert.equal(disposition.action, 'gone', path);
      const response = await middleware(new NextRequest(`https://example.com${path}`));
      assert.equal(response.status, 410, path);
    }
  }

  const nested = dispositionForPathname('/lender/fdic-insured-banks/florida');
  assert.deepEqual(nested, { action: 'redirect', status: 301, pathname: '/fdic-insured-banks/florida' });
  const nestedResponse = await middleware(
    new NextRequest('https://example.com/lender/fdic-insured-banks/florida?loanType=FHA')
  );
  assert.equal(nestedResponse.status, 301);
  assert.equal(nestedResponse.headers.get('location'), 'https://example.com/fdic-insured-banks/florida');

  assert.deepEqual(dispositionForPathname('/lenders/fdic-insured-banks/florida'), nested);
  assert.deepEqual(dispositionForPathname('/lender/auto-loan-companies/florida'), {
    action: 'redirect',
    status: 301,
    pathname: '/auto-loan-companies/florida',
  });
  assert.equal(dispositionForPathname('/lender/auto-loan-companies/wyoming').action, 'gone');
  assert.equal(dispositionForPathname('/lender/credit-repair').action, 'gone');
  assert.equal(dispositionForPathname('/lender/not-a-real-lender').action, 'gone');
  assert.equal(dispositionForPathname('/lenders/not-a-real-lender').action, 'gone');
  assert.equal(dispositionForPathname('/lender/rocket-mortgage').action, 'next');
  assert.equal(dispositionForPathname('/lenders/freedom-mortgage').action, 'next');
  assert.equal(dispositionForPathname('/lenders/freedom-mortgage/share-og').action, 'next');
  assert.deepEqual(dispositionForPathname('/auto-loan-companies/FL'), {
    action: 'redirect',
    status: 301,
    pathname: '/auto-loan-companies/florida',
  });
  assert.equal(dispositionForPathname('/auto-loan-companies/WY').action, 'gone');
  assert.equal(dispositionForPathname('/auto-loan-companies').action, 'next');
  assert.equal(dispositionForPathname('/fdic-insured-banks/florida').action, 'next');

  const fdicCode = await middleware(new NextRequest('https://example.com/fdic-insured-banks/FL?ref=test'));
  assert.equal(fdicCode.status, 301);
  assert.equal(fdicCode.headers.get('location'), 'https://example.com/fdic-insured-banks/florida?ref=test');
});
