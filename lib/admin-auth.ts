/**
 * Shared admin session cookie name + helpers.
 * Edge-safe: no Supabase, no Node-only modules.
 */

export const ADMIN_COOKIE = 'lth_admin_session';

export function getAdminSecret(): string | undefined {
  return process.env.ADMIN_SECRET?.trim();
}

export function isAdminCookieValid(cookieValue: string | undefined): boolean {
  const secret = getAdminSecret();
  if (!secret || !cookieValue) return false;
  return cookieValue === secret;
}
