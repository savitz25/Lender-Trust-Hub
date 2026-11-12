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

/**
 * Crawlers and headless drivers. Substring match, case-insensitive.
 * A normal Chrome, Safari, or Firefox user agent does not contain these tokens.
 */
const AUTOMATED_BROWSER_UA =
  /bot|spider|crawler|crawl|slurp|headless|phantomjs|puppeteer|playwright|selenium|webdriver|lighthouse|pagespeed|facebookexternalhit|embedly|linkedinbot|twitterbot|slackbot|discordbot|telegrambot|whatsapp|pinterestbot|redditbot|semrush|ahrefs|petalbot|bytespider|gptbot|claudebot|amazonbot|uptimerobot|pingdom|statuscake/i;

export function isAutomatedBrowser(signals?: { webdriver?: boolean; userAgent?: string | null }): boolean {
  try {
    const webdriver =
      signals?.webdriver ?? (typeof navigator !== 'undefined' && Boolean(navigator.webdriver));
    if (webdriver) return true;
    const userAgent =
      signals?.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    if (!userAgent) return false;
    return AUTOMATED_BROWSER_UA.test(userAgent);
  } catch {
    return false;
  }
}

export function shouldEnablePosthog(): boolean {
  try {
    if (!posthogKey()) return false;
    if (analyticsEnvironment() === 'development' && !posthogDebugEnabled()) return false;
    if (isAutomatedBrowser()) return false;
    return true;
  } catch {
    return false;
  }
}
