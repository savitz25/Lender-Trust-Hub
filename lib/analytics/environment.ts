export type AnalyticsEnvironment = 'production' | 'preview' | 'development';

function asEnvironment(value: string | null | undefined): AnalyticsEnvironment | undefined {
  if (value === 'production' || value === 'preview' || value === 'development') return value;
  return undefined;
}

/**
 * Deployment environment for analytics super properties.
 * Server code reads VERCEL_ENV. The root layout copies that value onto
 * `<html data-analytics-environment>` so the browser bundle does not need
 * VERCEL_ENV inlined.
 */
export function analyticsEnvironment(): AnalyticsEnvironment {
  if (typeof document !== 'undefined') {
    const fromDom = asEnvironment(document.documentElement?.getAttribute('data-analytics-environment'));
    if (fromDom) return fromDom;
  }
  return (
    asEnvironment(process.env.VERCEL_ENV) ||
    asEnvironment(process.env.NEXT_PUBLIC_VERCEL_ENV) ||
    'development'
  );
}

export function posthogKey(): string {
  return (process.env.NEXT_PUBLIC_POSTHOG_KEY || '').trim();
}

/** Ingest host. Defaults to the US PostHog cloud. */
export function posthogHost(): string {
  return (process.env.NEXT_PUBLIC_POSTHOG_HOST || '').trim() || 'https://us.i.posthog.com';
}

/**
 * Development (local `next dev`, or VERCEL_ENV=development) does not send.
 * Set NEXT_PUBLIC_POSTHOG_DEBUG=1 to send from development.
 */
export function posthogDebugEnabled(): boolean {
  const flag = (process.env.NEXT_PUBLIC_POSTHOG_DEBUG || '').trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function shouldEnablePosthog(): boolean {
  try {
    if (!posthogKey()) return false;
    if (analyticsEnvironment() === 'development' && !posthogDebugEnabled()) return false;
    return true;
  } catch {
    return false;
  }
}
