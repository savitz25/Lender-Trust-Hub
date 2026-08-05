import 'server-only';

import { createClientIfConfigured } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  authCallbackUrl,
  resolveSiteOrigin,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

export type RequestMagicLinkResult =
  | { ok: true; delivery: 'supabase'; emailRedirectTo: string }
  | { ok: false; status: number; error: string };

/**
 * Magic link via Supabase OTP mailer.
 * Always sets emailRedirectTo to this hub’s /auth/callback (never Move Site URL).
 */
export async function requestMagicLink(
  emailRaw: string,
  nextRaw?: string | null,
  request?: Request | null
): Promise<RequestMagicLinkResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, status: 400, error: 'Enter a valid email address.' };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Sign-in is not configured yet. Please try again later.',
    };
  }

  const nextPath = sanitizePostLoginPath(nextRaw);
  const origin = resolveSiteOrigin(request);
  const emailRedirectTo = authCallbackUrl(nextPath, origin);

  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return { ok: false, status: 503, error: 'Sign-in is not configured yet.' };
  }

  try {
    console.info('[my-lending] magic-link emailRedirectTo', emailRedirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error('[my-lending] signInWithOtp', error.message, error.code);
      const lower = error.message.toLowerCase();
      if (lower.includes('redirect') || lower.includes('url not allowed')) {
        return {
          ok: false,
          status: 500,
          error:
            'Sign-in redirect is not allow-listed in Supabase. Add https://www.lendertrusthub.com/** to Auth → Redirect URLs.',
        };
      }
      return {
        ok: false,
        status: 500,
        error: error.message.includes('rate')
          ? 'Too many sign-in emails recently. Please wait and try again.'
          : 'Could not send the sign-in link. Please try again shortly.',
      };
    }
    return { ok: true, delivery: 'supabase', emailRedirectTo };
  } catch (err) {
    console.error('[my-lending] OTP magic link failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Could not send the sign-in link. Please try again shortly.',
    };
  }
}
