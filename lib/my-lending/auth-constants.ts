/**
 * My Lending / network auth constants.
 *
 * Shared Supabase Auth project uses Move as Site URL. Redirects that are not
 * allow-listed fall back to movetrusthub.com — so by default we use a Move
 * bridge callback + handoff to this hub (same pattern as Insurance monorepo).
 *
 * Set AUTH_OAUTH_DIRECT=1 only after Supabase Redirect URLs include
 * https://www.lendertrusthub.com/** and you want skip-the-bridge.
 */

export const MY_LENDING_PATH = '/my-lending';
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_CONFIRM_PATH = '/auth/confirm';

/** Canonical production origin — never movetrusthub.com */
export const HUB_CANONICAL_ORIGIN = 'https://www.lendertrusthub.com';
const HUB_HOST_FRAGMENT = 'lendertrusthub.com';

/** Shared project Site URL host — used as OAuth/magic bridge when not direct */
export const MOVE_AUTH_BRIDGE =
  process.env.MOVE_AUTH_BRIDGE_URL?.trim() ||
  'https://www.movetrusthub.com/auth/callback';

/**
 * When true, emailRedirectTo / OAuth redirectTo hit this hub directly.
 * Default false → Move bridge (allowlisted Site URL) then handoff.
 */
export function isDirectAuthRedirect(): boolean {
  return process.env.AUTH_OAUTH_DIRECT === '1' || process.env.AUTH_OAUTH_DIRECT === 'true';
}

/**
 * Origin for post-login redirects and confirm links on THIS hub.
 * Always canonical in production (www) so allow-list / cookies match.
 * Localhost only in development.
 */
export function resolveSiteOrigin(request?: Request | null): string {
  if (request && process.env.NODE_ENV === 'development') {
    const hostRaw = (
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();
    if (hostRaw.startsWith('localhost') || hostRaw.startsWith('127.0.0.1')) {
      const proto = (
        request.headers.get('x-forwarded-proto') ||
        'http'
      )
        .split(',')[0]
        .trim();
      return `${proto}://${hostRaw}`.replace(/\/$/, '');
    }
  }

  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (env) {
    try {
      if (new URL(env).hostname.toLowerCase().includes(HUB_HOST_FRAGMENT)) {
        // Normalize to www canonical for production hosts
        if (env.includes('lendertrusthub.com') && !env.includes('localhost')) {
          return HUB_CANONICAL_ORIGIN;
        }
        return env;
      }
      console.warn(
        '[auth] NEXT_PUBLIC_SITE_URL is not a Lender host; using canonical',
        env
      );
    } catch {
      /* ignore */
    }
  }

  return HUB_CANONICAL_ORIGIN;
}

export const PRODUCTION_SITE_ORIGIN = HUB_CANONICAL_ORIGIN;

/**
 * URL Supabase should redirect to after magic link / OAuth.
 * Prefer Move bridge (allowlisted) unless AUTH_OAUTH_DIRECT=1.
 */
export function authExternalRedirectUrl(nextPath: string): string {
  const next = sanitizePostLoginPath(nextPath);
  if (isDirectAuthRedirect()) {
    return `${HUB_CANONICAL_ORIGIN}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}&hub=lending`;
  }
  const bridge = new URL(MOVE_AUTH_BRIDGE);
  bridge.searchParams.set('next', next);
  bridge.searchParams.set('hub', 'lending');
  return bridge.toString();
}

/** This hub’s callback (for handoff targets and post-login). */
export function authCallbackUrl(nextPath: string, origin?: string): string {
  const base = (origin || HUB_CANONICAL_ORIGIN).replace(/\/$/, '');
  const next = sanitizePostLoginPath(nextPath);
  return `${base}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(next)}&hub=lending`;
}

export const AUTH_CALLBACK_URL = `${HUB_CANONICAL_ORIGIN}${AUTH_CALLBACK_PATH}`;

export function sanitizePostLoginPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return MY_LENDING_PATH;
  }
  if (next.startsWith('/auth/')) return MY_LENDING_PATH;
  if (
    next === '/my-move' ||
    next.startsWith('/my-move/') ||
    next === '/portal' ||
    next.startsWith('/portal/') ||
    next === '/my-insurance' ||
    next.startsWith('/my-insurance/')
  ) {
    return MY_LENDING_PATH;
  }
  try {
    const parsed = new URL(next, HUB_CANONICAL_ORIGIN);
    if (parsed.origin !== new URL(HUB_CANONICAL_ORIGIN).origin) {
      return MY_LENDING_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || MY_LENDING_PATH;
  } catch {
    return MY_LENDING_PATH;
  }
}

export function lendingAuthSuccessUrl(
  next?: string | null,
  origin?: string
): string {
  const path = sanitizePostLoginPath(next);
  const url = new URL(path, origin || HUB_CANONICAL_ORIGIN);
  url.searchParams.set('auth', 'success');
  return url.toString();
}

export function lendingAuthErrorUrl(
  next?: string | null,
  origin?: string
): string {
  const path = sanitizePostLoginPath(next);
  const url = new URL(path, origin || HUB_CANONICAL_ORIGIN);
  url.searchParams.set('auth', 'error');
  return url.toString();
}

/** Force OAuth authorize URL redirect_to onto bridge (or direct). */
export function ensureLendingOAuthUrl(
  oauthUrl: string,
  nextPath?: string | null
): string {
  try {
    const parsed = new URL(oauthUrl);
    parsed.searchParams.set(
      'redirect_to',
      authExternalRedirectUrl(sanitizePostLoginPath(nextPath))
    );
    return parsed.toString();
  } catch {
    return oauthUrl;
  }
}
