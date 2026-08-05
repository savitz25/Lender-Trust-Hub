/**
 * My Lending / network auth constants.
 * Same Supabase Auth project as Move when env points at shared project.
 *
 * CRITICAL: magic-link emailRedirectTo and OAuth redirectTo must always target
 * this hub’s origin (lendertrusthub.com), never Move’s Site URL.
 */

export const MY_LENDING_PATH = '/my-lending';
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_CONFIRM_PATH = '/auth/confirm';

/** Canonical production origin for this hub — never movetrusthub.com */
export const HUB_CANONICAL_ORIGIN = 'https://www.lendertrusthub.com';
const HUB_HOST_FRAGMENT = 'lendertrusthub.com';

/**
 * Resolve this hub’s public origin for Auth redirects.
 * Priority:
 * 1) Request Host when it is this hub (or localhost)
 * 2) NEXT_PUBLIC_SITE_URL only if it is this hub
 * 3) Canonical production origin
 *
 * Wrong env (e.g. Move URL on Lender Vercel) is ignored so OTP never lands on Move.
 */
export function resolveSiteOrigin(request?: Request | null): string {
  if (request) {
    const hostRaw = (
      request.headers.get('x-forwarded-host') ||
      request.headers.get('host') ||
      ''
    )
      .split(',')[0]
      .trim()
      .toLowerCase();

    if (hostRaw.includes(HUB_HOST_FRAGMENT)) {
      const proto = (
        request.headers.get('x-forwarded-proto') ||
        'https'
      )
        .split(',')[0]
        .trim();
      return `${proto}://${hostRaw}`.replace(/\/$/, '');
    }

    if (
      hostRaw.startsWith('localhost') ||
      hostRaw.startsWith('127.0.0.1')
    ) {
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
        return env;
      }
      console.warn(
        '[auth] NEXT_PUBLIC_SITE_URL is not a Lender host; ignoring for redirects:',
        env
      );
    } catch {
      /* ignore bad env */
    }
  }

  return HUB_CANONICAL_ORIGIN;
}

/** @deprecated Prefer resolveSiteOrigin(request) — kept for non-request call sites */
export const PRODUCTION_SITE_ORIGIN = resolveSiteOrigin();

export function authCallbackUrl(
  nextPath: string,
  origin?: string
): string {
  const base = (origin || resolveSiteOrigin()).replace(/\/$/, '');
  return `${base}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(nextPath)}`;
}

export function authConfirmUrl(
  params: { tokenHash: string; type: string; nextPath: string },
  origin?: string
): string {
  const base = (origin || resolveSiteOrigin()).replace(/\/$/, '');
  const url = new URL(`${base}${AUTH_CONFIRM_PATH}`);
  url.searchParams.set('token_hash', params.tokenHash);
  url.searchParams.set('type', params.type);
  url.searchParams.set('next', params.nextPath);
  return url.toString();
}

/** Static callback URL using resolved origin (no request). Prefer authCallbackUrl + request. */
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
    const base = HUB_CANONICAL_ORIGIN;
    const parsed = new URL(next, base);
    if (parsed.origin !== new URL(base).origin) {
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
  const url = new URL(path, origin || resolveSiteOrigin());
  url.searchParams.set('auth', 'success');
  return url.toString();
}

export function lendingAuthErrorUrl(
  next?: string | null,
  origin?: string
): string {
  const path = sanitizePostLoginPath(next);
  const url = new URL(path, origin || resolveSiteOrigin());
  url.searchParams.set('auth', 'error');
  return url.toString();
}

/**
 * Force Supabase OAuth authorize URL redirect_to onto this hub’s callback.
 */
export function ensureLendingOAuthUrl(
  oauthUrl: string,
  nextPath?: string | null,
  origin?: string
): string {
  try {
    const parsed = new URL(oauthUrl);
    const next = sanitizePostLoginPath(nextPath);
    parsed.searchParams.set('redirect_to', authCallbackUrl(next, origin));
    return parsed.toString();
  } catch {
    return oauthUrl;
  }
}
