import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { parseLenderAsk } from '../ask-lender/parse';
import { NEBRASKA_LENDER_SNAPSHOT as s } from './snapshot';

test('Nebraska lender grains stay on the 2024 annual-report clock', () => {
  assert.equal(s.mortgageBankerCompanyLicenses, 499);
  assert.equal(s.mortgageLoanOriginators, 3954);
  assert.equal(s.stateCharteredBanks, 134);
  assert.equal(s.savingsAndLoanAssociations, 0);
  assert.equal(s.savingsAndLoanIsPrintedZero, true);
  assert.equal(s.mortgageBrokerRoster, 'NOT_ACQUIRED');
  assert.equal(s.branchRoster, 'NOT_ACQUIRED');
  assert.equal(s.nmlsIdentityRoster, 'NOT_ACQUIRED');
  assert.equal(s.hmda.hmdaIsLicensing, false);
  assert.equal(s.hmda.acceptedStatewideAggregate, 'NOT_ACQUIRED');
  assert.equal(s.graphWrites, 0);
  assert.notEqual(s.mortgageBankerCompanyLicenses, s.mortgageLoanOriginators);
});

test('Nebraska lender page does not invent a current NMLS census', () => {
  const page = readFileSync('app/nebraska/page.tsx', 'utf8');
  assert.match(page, /499 Mortgage Banker Company Licenses/);
  assert.match(page, /NOT_ACQUIRED/);
  assert.match(page, /HMDA is not licensing/);
  assert.doesNotMatch(page, /omaha\/|lincoln\//i);
  assert.match(readFileSync('app/sitemap.ts', 'utf8'), /\/nebraska/);
  assert.match(readFileSync('lib/seo/published-state-path.ts', 'utf8'), /'nebraska'/);
  assert.match(readFileSync('lib/seo/published-state-path.ts', 'utf8'), /'utah'/);
  assert.match(parseLenderAsk('Nebraska mortgage banker licenses').failReason ?? '', /499 Mortgage Banker Company Licenses/);
  assert.match(parseLenderAsk('Nebraska mortgage loan originators').failReason ?? '', /3,954/);
  assert.match(parseLenderAsk('Nebraska HMDA').failReason ?? '', /NOT_ACQUIRED/);
  assert.doesNotMatch(parseLenderAsk('Nevada mortgage lenders').failReason ?? '', /499 Mortgage Banker Company Licenses/);
  assert.doesNotMatch(parseLenderAsk('mortgage Omaha').failReason ?? '', /499 Mortgage Banker Company Licenses/);
  assert.match(parseLenderAsk('best Nebraska mortgage lender').failReason ?? '', /does not rank/);
});
