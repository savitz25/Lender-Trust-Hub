import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  isReplayEvent,
  maskReplayAttribute,
  sanitizeAnalyticsPathname,
  sanitizeAnalyticsRequestBody,
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
  assert.match(source, /capture_copied_text:\s*false/);
  assert.match(source, /capture_value_css_selector_allowlist:\s*\[\]/);
  assert.match(source, /disable_session_recording:\s*true/);
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
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { doNotTrack: '0', cookieEnabled: true, globalPrivacyControl: true },
    });
    assert.equal(analyticsBrowserOptOut(), true);
  } finally {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previous });
  }
});

test('identify, pageview, and custom event payloads drop email, search, and auth fields', () => {
  const secret = 'best mortgage lender in miami';
  const email = 'person@example.com';
  const identify = sanitizeCaptureResult({
    event: '$identify',
    properties: {
      distinct_id: email,
      email,
      $email: email,
      password: 'hunter2-secret',
      access_token: 'auth-secret-value',
      otp: '998877',
      q: secret,
      search: secret,
      $ip: '203.0.113.10',
      $current_url: `https://www.lendertrusthub.com/ask?q=${encodeURIComponent(secret)}&access_token=abc&email=${encodeURIComponent(email)}&state=FL`,
      $set: { email, name: 'Pat Example', search: secret },
    },
    $set: { email, password: 'hunter2-secret', search: secret },
  });
  const identifyJson = JSON.stringify(identify);
  assert.equal(identifyJson.includes(email), false);
  assert.equal(identifyJson.includes(secret), false);
  assert.equal(identifyJson.includes('hunter2-secret'), false);
  assert.equal(identifyJson.includes('auth-secret-value'), false);
  assert.equal(identifyJson.includes('998877'), false);
  assert.equal(identifyJson.includes('203.0.113.10'), false);
  assert.equal(identify?.properties?.$geoip_disable, true);
  assert.equal(identify?.properties?.$ip, undefined);
  assert.match(String(identify?.properties?.$current_url), /state=FL/);
  assert.equal(String(identify?.properties?.$current_url).includes('q='), false);

  const pageview = sanitizeCaptureResult(
    suppressExceptionCapture({
      event: '$pageview',
      properties: {
        $current_url: `https://www.lendertrusthub.com/search?q=${encodeURIComponent(secret)}&email=${encodeURIComponent(email)}&state=FL`,
        $exception_message: secret,
        $exception_list: [{ type: 'Error', value: secret }],
      },
    }),
  );
  const pageJson = JSON.stringify(pageview);
  assert.equal(pageview?.event, '$pageview');
  assert.equal(pageJson.includes(secret), false);
  assert.equal(pageJson.includes(email), false);
  assert.equal(pageview?.properties?.$geoip_disable, true);

  const custom = sanitizeCaptureResult({
    event: 'search_submitted',
    properties: {
      surface: 'ask_form',
      success: true,
      stateCode: 'FL',
      query: secret,
      email,
      password: 'hunter2-secret',
    },
  });
  assert.equal(custom?.properties?.surface, 'ask_form');
  assert.equal(custom?.properties?.success, true);
  assert.equal(custom?.properties?.stateCode, 'FL');
  const customJson = JSON.stringify(custom);
  assert.equal(customJson.includes(secret), false);
  assert.equal(customJson.includes(email), false);
  assert.equal(customJson.includes('hunter2-secret'), false);
});

test('sdk privacy 002 strips auth properties, adversarial urls, and private attributes', () => {
  const urls = [
    'https://qa.invalid/?state=qa%40example.invalid',
    'https://qa.invalid/?state=qa%2540example.invalid',
    'https://qa.invalid/?custom=%E0%A4%A',
    'https://qa.invalid/?custom=qa%40example.invalid',
    'https://qa.invalid/?auth_code=123456',
    'https://qa.invalid/?redirect_uri=https%3A%2F%2Ftarget.invalid%2F%3Fcode%3D123456',
    'https://qa.invalid/search/qa%40example.invalid',
    'https://qa.invalid/auth/callback?code=ab&state=FL',
  ];
  for (const input of urls) {
    const output = sanitizeAnalyticsUrl(input) || '';
    assert.equal(decodeURIComponent(output).includes('qa@example'), false, input);
    assert.equal(decodeURIComponent(output).includes('123456'), false, input);
  }
  assert.match(sanitizeAnalyticsUrl('https://qa.invalid/auth/callback?code=ab&state=FL') || '', /state=FL/);

  const event = sanitizeCaptureResult({
    event: '$autocapture',
    properties: {
      code: '123456',
      auth_code: '654321',
      stateCode: 'FL',
      $elements_chain: 'button:attr__data-note="PRIVATE_NOTE"attr__id="safe"attr_id="safe"',
      $elements: [{ tag_name: 'button', 'attr__data-note': 'PRIVATE_NOTE', attr__id: 'safe', attr_id: 'safe' }],
    },
  });
  const json = JSON.stringify(event);
  assert.equal(json.includes('123456'), false);
  assert.equal(json.includes('654321'), false);
  assert.equal(json.includes('PRIVATE_'), false);
  assert.equal(event?.properties?.stateCode, 'FL');
  assert.equal(event?.properties?.$geoip_disable, true);
});

test('sdk privacy 003 strips encoded urls and nested flag fields', () => {
  const urls = [
    'https://qa.invalid/search?%2571=eldercare-sensitive-query',
    'https://qa.invalid/search?redirect_uri=https%3A%2F%2Ftarget.invalid%2F%3FauthCode%3DAuthZ9x7',
    'https://qa.invalid/search?%2570assword=PwdZ9x7',
    'https://qa.invalid/search?searchTerm=eldercare-sensitive-query',
    'https://qa.invalid/search#access_token=AuthZ9x7',
  ];
  for (const input of urls) {
    const output = sanitizeAnalyticsUrl(input) || '';
    assert.equal(/eldercare-sensitive-query|AuthZ9x7|PwdZ9x7/.test(output), false, input);
  }
  assert.match(sanitizeAnalyticsUrl('https://qa.invalid/auth/callback?code=ab&state=FL') || '', /state=FL/);
  const body = sanitizeAnalyticsRequestBody(
    JSON.stringify({
      token: 'phc_test',
      distinct_id: 'visitor',
      person_properties: {
        query: 'eldercare-sensitive-query',
        question: 'family-sensitive-question',
        search: 'treatment-sensitive-search',
        token: 'AuthZ9x7',
        password: 'PwdZ9x7',
        email: 'alex@example.invalid',
        $lib: 'web',
      },
    }),
  );
  assert.ok(body);
  assert.match(body, /phc_test/);
  assert.match(body, /"\$lib":"web"/);
  assert.equal(
    /eldercare-sensitive-query|family-sensitive-question|treatment-sensitive-search|AuthZ9x7|PwdZ9x7|alex@/.test(body),
    false,
  );
});

