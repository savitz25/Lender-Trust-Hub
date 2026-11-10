import assert from 'node:assert/strict';
import test from 'node:test';
import {
  maskReplayAttribute,
  sanitizeAnalyticsPathname,
  sanitizeAnalyticsUrl,
  sanitizeCaptureResult,
} from './privacy';

const SECRET = 'best mortgage lender in miami';

test('URL sanitizer strips q and other free-text query params', () => {
  const cleaned = sanitizeAnalyticsUrl(
    `https://www.lendertrusthub.com/ask?q=${encodeURIComponent(SECRET)}&state=FL&geo=broward&page=2&keyword=${encodeURIComponent('how many lenders')}&utm_source=ask`,
  );
  assert.ok(cleaned);
  const url = new URL(cleaned);
  assert.equal(url.searchParams.has('q'), false);
  assert.equal(url.searchParams.has('keyword'), false);
  assert.equal(url.searchParams.get('state'), 'FL');
  assert.equal(url.searchParams.get('geo'), 'broward');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('utm_source'), 'ask');
  assert.equal(cleaned.includes(SECRET), false);
  assert.equal(cleaned.includes('how many lenders'), false);
});

test('URL sanitizer strips email, tokens, and hash fragments', () => {
  const cleaned = sanitizeAnalyticsUrl(
    'https://preview.lendertrusthub.com/ask?email=person@example.com&access_token=abc&state=NY#q=hidden',
  );
  assert.equal(cleaned, 'https://preview.lendertrusthub.com/ask?state=NY');
});

test('pathname sanitizer removes a copied search string', () => {
  assert.equal(
    sanitizeAnalyticsPathname(`/ask?q=${encodeURIComponent(SECRET)}&state=FL`),
    '/ask?state=FL',
  );
  assert.equal(sanitizeAnalyticsPathname('/lenders/rocket-mortgage'), '/lenders/rocket-mortgage');
});

test('before_send sanitizes url properties and keeps the PostHog token', () => {
  const event = sanitizeCaptureResult({
    event: '$pageview',
    token: 'phc_project_token',
    properties: {
      token: 'phc_project_token',
      distinct_id: '018f6b4e-7c2a-7b3d-8e1a-9c0d1e2f3a4b',
      $current_url: `https://www.lendertrusthub.com/ask?q=${encodeURIComponent(SECRET)}&state=FL`,
      $session_entry_url: `https://www.lendertrusthub.com/ask?q=${encodeURIComponent(SECRET)}`,
      $referrer: `https://www.asktrusthub.com/search?q=${encodeURIComponent(SECRET)}&hub=lender`,
      $pathname: `/ask?q=${encodeURIComponent(SECRET)}&state=FL`,
      q: SECRET,
      email: 'person@example.com',
    },
  });
  assert.equal(event.token, 'phc_project_token');
  assert.equal(event.properties.token, 'phc_project_token');
  assert.equal(event.properties.distinct_id, '018f6b4e-7c2a-7b3d-8e1a-9c0d1e2f3a4b');
  assert.equal(event.properties.$current_url, 'https://www.lendertrusthub.com/ask?state=FL');
  assert.equal(event.properties.$session_entry_url, 'https://www.lendertrusthub.com/ask');
  assert.equal(event.properties.$referrer, 'https://www.asktrusthub.com/search?hub=lender');
  assert.equal(event.properties.$pathname, '/ask?state=FL');
  assert.equal(event.properties.q, undefined);
  assert.equal(event.properties.email, undefined);
  assert.equal(JSON.stringify(event).includes(SECRET), false);
  assert.equal((event.properties as Record<string, unknown>).$title, 'Lender Trust Hub');
});

test('before_send drops an email-shaped distinct id and masks replay attributes', () => {
  const event = sanitizeCaptureResult({
    event: '$autocapture',
    properties: {
      distinct_id: 'person@example.com',
      $current_url: 'https://www.lendertrusthub.com/lenders/example',
      $pathname: '/lenders/example',
    },
  });
  assert.equal(event.properties.distinct_id, undefined);
  assert.equal(
    maskReplayAttribute('href', `/ask?q=${encodeURIComponent(SECRET)}&state=TX`),
    'https://www.lendertrusthub.com/ask?state=TX',
  );
  assert.equal(maskReplayAttribute('data-searched-name', SECRET), '');
  assert.equal(maskReplayAttribute('class', 'intel-ask-result'), 'intel-ask-result');
});

test('sanitizer returns the event when the url cannot be parsed', () => {
  const event = sanitizeCaptureResult({
    event: 'search_submitted',
    properties: { surface: 'ask_form', success: true },
  });
  assert.equal(event.properties.surface, 'ask_form');
  assert.equal(event.properties.success, true);
});
