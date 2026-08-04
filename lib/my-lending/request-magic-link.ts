import 'server-only';

import { createClientIfConfigured } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import {
  AUTH_CALLBACK_URL,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

export type RequestMagicLinkResult =
  | { ok: true; delivery: 'supabase' }
  | { ok: false; status: number; error: string };

/**
 * Magic link via Supabase OTP mailer (Move/Insurance parity path).
 * Optional Resend+generateLink can be added later when RESEND is configured.
 */
export async function requestMagicLink(
  emailRaw: string,
  nextRaw?: string | null
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
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return { ok: false, status: 503, error: 'Sign-in is not configured yet.' };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${AUTH_CALLBACK_URL}?next=${encodeURIComponent(nextPath)}`,
        shouldCreateUser: true,
      },
    });
    if (error) {
      return {
        ok: false,
        status: 500,
        error: error.message.includes('rate')
          ? 'Too many sign-in emails recently. Please wait and try again.'
          : 'Could not send the sign-in link. Please try again shortly.',
      };
    }
    return { ok: true, delivery: 'supabase' };
  } catch (err) {
    console.error('[my-lending] OTP magic link failed', err);
    return {
      ok: false,
      status: 500,
      error: 'Could not send the sign-in link. Please try again shortly.',
    };
  }
}
