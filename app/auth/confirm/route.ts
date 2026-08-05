import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import {
  HUB_CANONICAL_ORIGIN,
  lendingAuthErrorUrl,
  lendingAuthSuccessUrl,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

/** Email OTP confirm — session cookies on this hub only. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') || 'magiclink') as EmailOtpType;
  const next = sanitizePostLoginPath(searchParams.get('next'));

  if (!token_hash || !isSupabaseConfigured()) {
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  const successUrl = lendingAuthSuccessUrl(next, HUB_CANONICAL_ORIGIN);
  const errorUrl = lendingAuthErrorUrl(next, HUB_CANONICAL_ORIGIN);
  let response = NextResponse.redirect(successUrl);
  const cookieStore = await cookies();

  const supabase = createServerClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
            /* ignore */
          }
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    console.error('[auth/confirm]', error.message);
    return NextResponse.redirect(errorUrl);
  }

  return response;
}
