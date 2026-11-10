import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsEnvironment, isAutomatedBrowser, posthogHost, shouldEnablePosthog } from './environment';
import { captureTrustEvent } from './trusthub';

const KEYS = ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST', 'NEXT_PUBLIC_POSTHOG_DEBUG', 'VERCEL_ENV', 'NEXT_PUBLIC_VERCEL_ENV'] as const;

function snapshotEnv(): Record<(typeof KEYS)[number], string | undefined> {
  return {
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_DEBUG: process.env.NEXT_PUBLIC_POSTHOG_DEBUG,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
  };
}

function restoreEnv(saved: Record<(typeof KEYS)[number], string | undefined>): void {
  for (const key of KEYS) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test('PostHog stays off without a key and in development unless debug is set', () => {
  const saved = snapshotEnv();
  try {
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    assert.equal(posthogHost(), 'https://us.i.posthog.com');

    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_DEBUG;
    process.env.VERCEL_ENV = 'preview';
    assert.equal(shouldEnablePosthog(), false);
    assert.doesNotThrow(() => shouldEnablePosthog());

    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.VERCEL_ENV = 'development';
    delete process.env.NEXT_PUBLIC_POSTHOG_DEBUG;
    assert.equal(analyticsEnvironment(), 'development');
    assert.equal(shouldEnablePosthog(), false);

    process.env.NEXT_PUBLIC_POSTHOG_DEBUG = '1';
    assert.equal(shouldEnablePosthog(), true);

    delete process.env.NEXT_PUBLIC_POSTHOG_DEBUG;
    process.env.VERCEL_ENV = 'preview';
    assert.equal(analyticsEnvironment(), 'preview');
    assert.equal(shouldEnablePosthog(), true);

    process.env.VERCEL_ENV = 'production';
    assert.equal(shouldEnablePosthog(), true);

    delete process.env.VERCEL_ENV;
    assert.equal(analyticsEnvironment(), 'development');
    assert.equal(shouldEnablePosthog(), false);
    assert.doesNotThrow(() => captureTrustEvent('search_submitted', { query: 'secret question', email: 'a@b.c' }));
  } finally {
    restoreEnv(saved);
  }
});

test('PostHog stays off for webdriver and common bot user agents', () => {
  const saved = snapshotEnv();
  const previousNavigator = globalThis.navigator;
  try {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    delete process.env.NEXT_PUBLIC_POSTHOG_DEBUG;
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    process.env.VERCEL_ENV = 'production';

    const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    assert.equal(isAutomatedBrowser({ webdriver: false, userAgent: chrome }), false);
    assert.equal(isAutomatedBrowser({ webdriver: true, userAgent: chrome }), true);
    assert.equal(
      isAutomatedBrowser({ webdriver: false, userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }),
      true,
    );
    assert.equal(
      isAutomatedBrowser({ webdriver: false, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36' }),
      true,
    );
    assert.equal(isAutomatedBrowser({ webdriver: false, userAgent: 'Mozilla/5.0 (compatible; bingbot/2.0)' }), true);
    assert.equal(isAutomatedBrowser({ webdriver: false, userAgent: 'Playwright/1.49.0' }), true);

    setNavigator({ webdriver: true, userAgent: chrome });
    assert.equal(shouldEnablePosthog(), false);
    assert.doesNotThrow(() => captureTrustEvent('$pageview', { surface: 'app_router' }));

    process.env.VERCEL_ENV = 'preview';
    assert.equal(shouldEnablePosthog(), false);

    setNavigator({ webdriver: false, userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)' });
    process.env.VERCEL_ENV = 'production';
    assert.equal(shouldEnablePosthog(), false);

    setNavigator({ webdriver: false, userAgent: chrome });
    assert.equal(shouldEnablePosthog(), true);
  } finally {
    restoreNavigator(previousNavigator);
    restoreEnv(saved);
  }
});

function setNavigator(value: { webdriver: boolean; userAgent: string }): void {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value });
}

function restoreNavigator(previous: Navigator | undefined): void {
  if (previous === undefined) {
    delete (globalThis as { navigator?: Navigator }).navigator;
    return;
  }
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previous });
}
