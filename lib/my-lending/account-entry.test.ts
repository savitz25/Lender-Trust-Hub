import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MyTrustHubAccountEntry } from '../../components/my-lending/my-trusthub-account-entry';
import { lendingAccountPresentation, MY_TRUSTHUB_ACCOUNT_ENTRY_HREF } from './account-presentation';

test('My TrustHub desktop, icon and drawer entries use the canonical signed-out destination', () => {
  const original = process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
  try {
    delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
    const destination = 'https://www.asktrusthub.com/my/sign-in';
    assert.equal(MY_TRUSTHUB_ACCOUNT_ENTRY_HREF, destination);
    const presentation = lendingAccountPresentation();
    assert.equal(presentation.mode, 'my_trusthub');
    if (presentation.mode === 'my_trusthub') assert.equal(presentation.accountHref, destination);
    for (const variant of ['desktop', 'icon', 'drawer'] as const) {
      const markup = renderToStaticMarkup(createElement(MyTrustHubAccountEntry, { variant }));
      assert.equal((markup.match(/<a\b/g) ?? []).length, 1, variant);
      assert.ok(markup.includes(`href="${destination}"`), variant);
      assert.match(markup, /My TrustHub/);
      process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY = '0';
      assert.equal(renderToStaticMarkup(createElement(MyTrustHubAccountEntry, { variant })), '');
      delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
    }
  } finally {
    if (original === undefined) delete process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY;
    else process.env.NEXT_PUBLIC_LENDER_MY_TRUSTHUB_ACCOUNT_ENTRY = original;
  }
});
