import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsEnvironment, posthogHost, shouldEnablePosthog } from './environment';
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
