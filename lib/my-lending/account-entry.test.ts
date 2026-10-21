import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LenderProfileSignInLink, MyTrustHubAccountEntry } from '../../components/my-lending/my-trusthub-account-entry';
import { lendingAccountPresentation, MY_TRUSTHUB_ACCOUNT_ENTRY_HREF } from './account-presentation';
import { ISOLATED_PROJECT, lenderAccountSignInDestination, type PilotEnv } from './isolated-pilot';

const B4 = 'https://conumers-trust-hub-git-b4-lender-ask-710157-savitz25-s-projects.vercel.app';
const PARE = 'https://conumers-trust-hub-git-mth-v2-3-pare-3127df-savitz25-s-projects.vercel.app';
const MOVE = 'https://move-trust-hub-git-mth-v2-3-move-cur-0a05f1-savitz25-s-projects.vercel.app';
const PRODUCTION = 'https://www.asktrusthub.com/my/sign-in';
const PREVIEW = B4 + '/my/sign-in';
const LENDER = 'https://lender-pilot.preview.example';
const PRODUCTION_HOSTS = ['https://www.asktrusthub.com', PARE, MOVE];

function pilot(serverParent: string | undefined, publicParent: string | undefined): PilotEnv {
  return {
    VERCEL_ENV: 'preview',
    MY_TRUSTHUB_V23_PARENT_ORIGIN: serverParent,
    NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN: publicParent,
    MY_TRUSTHUB_V23_LENDER_ORIGIN: LENDER,
    MY_TRUSTHUB_V23_ISOLATED_PROJECT: ISOLATED_PROJECT,
  };
}

function navbarMarkup(href: string | null, variant: 'desktop' | 'icon' | 'drawer') {
  return renderToStaticMarkup(createElement(MyTrustHubAccountEntry, { variant, href }));
}

function profileMarkup(href: string) {
  return renderToStaticMarkup(createElement(LenderProfileSignInLink, {
    href,
    keepOpen: false,
    onSignIn: () => undefined,
  }));
}

let savedAccountFlag: string | undefined;

beforeEach(() => {
  savedAccountFlag = process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
  delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
});

afterEach(() => {
  if (savedAccountFlag === undefined) delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
  else process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY = savedAccountFlag;
});

function assertNoOutboundAccount(markup: string, label: string) {
  for (const host of PRODUCTION_HOSTS) {
    assert.equal(markup.includes(host), false, `${label} includes ${host}`);
  }
  assert.equal(markup.includes('<a'), false, label);
}

test('approved isolated configuration renders Preview for the profile and navbar entries', () => {
  const href = lenderAccountSignInDestination(pilot(B4, B4));
  assert.equal(href, PREVIEW);
  for (const variant of ['desktop', 'icon', 'drawer'] as const) {
    const markup = navbarMarkup(href, variant);
    assert.equal((markup.match(/<a\b/g) ?? []).length, 1, variant);
    assert.ok(markup.includes(`href="${PREVIEW}"`), variant);
    assert.match(markup, /My TrustHub/);
    assert.equal(markup.includes('https://www.asktrusthub.com'), false, variant);
    assert.equal(markup.includes(PARE), false, variant);
    assert.equal(markup.includes(MOVE), false, variant);
  }
  const profile = profileMarkup(href!);
  assert.ok(profile.includes(`href="${PREVIEW}"`));
  assert.match(profile, /Sign in to My TrustHub/);
  assert.equal(profile.includes('https://www.asktrusthub.com'), false);
  assert.equal(profile.includes(PARE), false);
});

test('unapproved isolated parents render no production account destination', () => {
  const malformed = [
    undefined,
    '',
    ' ',
    'not-a-url',
    B4 + '/my/sign-in',
    B4 + '/',
    B4 + '?next=/',
    'http://conumers-trust-hub-git-b4-lender-ask-710157-savitz25-s-projects.vercel.app',
    'https://evil.example',
    B4.toUpperCase(),
    PARE,
    MOVE,
    'https://www.asktrusthub.com',
  ];
  for (const parent of malformed) {
    for (const env of [pilot(parent, parent), pilot(B4, parent), pilot(parent, B4)]) {
      const href = lenderAccountSignInDestination(env);
      assert.equal(href, null, JSON.stringify(env));
      for (const variant of ['desktop', 'icon', 'drawer'] as const) {
        assertNoOutboundAccount(navbarMarkup(href, variant), `${variant} ${String(parent)}`);
      }
      assertNoOutboundAccount(href ? profileMarkup(href) : '', `profile ${String(parent)}`);
    }
  }
});

test('production mode keeps the production account destination', () => {
  assert.equal(MY_TRUSTHUB_ACCOUNT_ENTRY_HREF, PRODUCTION);
  const presentation = lendingAccountPresentation();
  assert.equal(presentation.mode, 'my_trusthub');
  if (presentation.mode === 'my_trusthub') assert.equal(presentation.accountHref, PRODUCTION);
  const cases = [
    lenderAccountSignInDestination({}),
    lenderAccountSignInDestination({ VERCEL_ENV: 'production' }),
    lenderAccountSignInDestination({ ...pilot(B4, B4), VERCEL_ENV: 'production' }),
    lenderAccountSignInDestination({ VERCEL_ENV: 'preview', NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN: PARE }),
    lenderAccountSignInDestination({
      ...pilot(B4, B4),
      NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1',
      MTH_LENDER_PARENT_SAVE_MODE: 'production',
      NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage',
    }),
  ];
  for (const href of cases) {
    assert.equal(href, PRODUCTION);
    for (const variant of ['desktop', 'icon', 'drawer'] as const) {
      const markup = navbarMarkup(href, variant);
      assert.ok(markup.includes(`href="${PRODUCTION}"`), variant);
    }
    const profile = profileMarkup(href!);
    assert.ok(profile.includes(`href="${PRODUCTION}"`));
    assert.match(profile, /Sign in to My TrustHub/);
  }
});

test('the navbar disable flag hides every account-entry variant', () => {
  for (const href of [PREVIEW, PRODUCTION, null]) {
    for (const variant of ['desktop', 'icon', 'drawer'] as const) {
      assert.equal((navbarMarkup(href, variant).match(/<a\b/g) ?? []).length, href ? 1 : 0, variant);
      process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY = '0';
      assert.equal(navbarMarkup(href, variant), '', `${variant} disabled`);
      delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
    }
  }
});
