import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  isReplayEvent,
  maskReplayAttribute,
  sanitizeAnalyticsPathname,
  sanitizeAnalyticsUrl,
  sanitizeCaptureResult,
  stripElementsChainText,
  suppressExceptionCapture,
} from './privacy';
import { analyticsBrowserOptOut } from './environment';

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

const HERE = path.dirname(fileURLToPath(import.meta.url));

test('autocapture never carries element text, private note text or searched names', () => {
  const note = 'call underwriter about my divorce settlement';
  const event = sanitizeCaptureResult({
    event: '$autocapture',
    properties: {
      token: 'phc_test_token',
      $current_url: `https://www.lendertrusthub.com/ask?q=${encodeURIComponent(SECRET)}&state=FL`,
      $el_text: note,
      $elements_chain: `button.ph-chip:text="${note}"nth-child="1";div:attr__data-searched-name="${SECRET}"attr__title="${SECRET}"nth-child="2"`,
      $elements: [
        { tag_name: 'button', $el_text: note, text: note, 'attr__aria-label': note, attr__class: 'ph-chip' },
        { tag_name: 'div', 'attr__data-searched-name': SECRET, attr__href: `/ask?q=${encodeURIComponent(SECRET)}&state=FL` },
      ],
    },
  });
  assert.ok(event?.properties);
  assert.equal(event.properties.$el_text, undefined);
  const serialized = JSON.stringify(event);
  assert.equal(serialized.includes('divorce'), false);
  assert.equal(serialized.includes('mortgage lender in miami'), false);
  assert.equal(serialized.includes(encodeURIComponent(SECRET)), false);
  assert.match(String(event.properties.$elements_chain), /^button\.ph-chip:nth-child="1"/);
  const elements = event.properties.$elements as Array<Record<string, unknown>>;
  assert.equal(elements[0].attr__class, 'ph-chip');
});

test('elements chain text stripping handles escaped quotes', () => {
  assert.equal(
    stripElementsChainText('a.x:attr__href="/l"text="a \\"b\\" c"nth-child="2";p:text="s"'),
    'a.x:attr__href="/l"nth-child="2";p:',
  );
});

test('custom search events carry no raw search text', () => {
  const event = sanitizeCaptureResult({
    event: 'search_results_returned',
    properties: {
      token: 'phc_test_token',
      hub: 'lender',
      surface: 'ask',
      result_count: 4,
      q: SECRET,
      query: SECRET,
      search: SECRET,
      note: SECRET,
      $current_url: `https://www.lendertrusthub.com/search?search=${encodeURIComponent(SECRET)}&query=x&state=FL`,
    },
  });
  assert.ok(event?.properties);
  assert.equal(JSON.stringify(event).includes('miami'), false);
  assert.equal(event.properties.result_count, 4);
});

test('session replay payloads are recognized so before_send drops them', () => {
  assert.equal(isReplayEvent('$snapshot'), true);
  assert.equal(isReplayEvent('$autocapture'), false);
  assert.equal(isReplayEvent(undefined), false);
});

test('browser client disables session replay and the private note is no-capture', () => {
  const source = readFileSync(path.join(HERE, 'posthog-browser.ts'), 'utf8');
  assert.match(source, /disable_session_recording:\s*true/);
  assert.match(source, /mask_all_text:\s*true/);
  assert.match(source, /maskAllInputs:\s*true/);
  assert.match(source, /isReplayEvent\(event\.event\)\) return null/);
  const note = readFileSync(path.join(HERE, '../../components/my-lending/private-research-note.tsx'), 'utf8');
  assert.equal((note.match(/ph-no-capture/g) || []).length >= 2, true);
});

test('no $exception events are sent', () => {
  const dropped = suppressExceptionCapture({
    event: '$exception',
    properties: {
      $exception_list: [{ type: 'Error', value: 'best mortgage lender in miami' }],
      $exception_message: 'best mortgage lender in miami',
    },
  });
  assert.equal(dropped, null);

  const pageview = suppressExceptionCapture({
    event: '$pageview',
    properties: { $pathname: '/privacy', $exception_list: [{ type: 'Error' }] },
  });
  assert.equal(pageview?.event, '$pageview');
  assert.equal(pageview?.properties && '$exception_list' in pageview.properties, false);

  const source = readFileSync(path.join(HERE, 'posthog-browser.ts'), 'utf8');
  assert.match(source, /capture_exceptions:\s*false/);
  assert.match(source, /suppressExceptionCapture\(event\)/);
  assert.match(source, /respect_dnt:\s*true/);
});

test('Do Not Track or blocked cookies opt out of analytics', () => {
  const previous = globalThis.navigator;
  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { doNotTrack: '1', cookieEnabled: true },
    });
    assert.equal(analyticsBrowserOptOut(), true);
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { doNotTrack: '0', cookieEnabled: false },
    });
    assert.equal(analyticsBrowserOptOut(), true);
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { doNotTrack: '0', cookieEnabled: true },
    });
    assert.equal(analyticsBrowserOptOut(), false);
  } finally {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previous });
  }
});
