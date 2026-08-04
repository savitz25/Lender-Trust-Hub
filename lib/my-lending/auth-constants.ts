/**
 * My Lending / network auth constants.
 * Same Supabase Auth project as Move when env points at shared project.
 */

export const MY_LENDING_PATH = '/my-lending';
export const AUTH_CALLBACK_PATH = '/auth/callback';
export const AUTH_CONFIRM_PATH = '/auth/confirm';

export const PRODUCTION_SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.lendertrusthub.com';

export const AUTH_CALLBACK_URL = `${PRODUCTION_SITE_ORIGIN}${AUTH_CALLBACK_PATH}`;

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
    const base = PRODUCTION_SITE_ORIGIN.includes('lendertrusthub.com')
      ? PRODUCTION_SITE_ORIGIN
      : 'https://www.lendertrusthub.com';
    const parsed = new URL(next, base);
    if (parsed.origin !== new URL(base).origin) {
      return MY_LENDING_PATH;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || MY_LENDING_PATH;
  } catch {
    return MY_LENDING_PATH;
  }
}

export function lendingAuthSuccessUrl(next?: string | null): string {
  const path = sanitizePostLoginPath(next);
  const url = new URL(path, PRODUCTION_SITE_ORIGIN);
  url.searchParams.set('auth', 'success');
  return url.toString();
}

export function lendingAuthErrorUrl(next?: string | null): string {
  const path = sanitizePostLoginPath(next);
  const url = new URL(path, PRODUCTION_SITE_ORIGIN);
  url.searchParams.set('auth', 'error');
  return url.toString();
}
