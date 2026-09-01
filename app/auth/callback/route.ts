import { NextResponse } from 'next/server';
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

/**
 * Exchange OAuth / magic-link code and set session cookies on lendertrusthub.com.
 * Cookies are written onto the redirect response (required for session to stick).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizePostLoginPath(searchParams.get('next'));
  const oauthError = searchParams.get('error');

  if (oauthError) {
    console.error('[auth/callback] provider error', oauthError);
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  if (!code) {
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  const successUrl = lendingAuthSuccessUrl(next, HUB_CANONICAL_ORIGIN);
  const errorUrl = lendingAuthErrorUrl(next, HUB_CANONICAL_ORIGIN);

  // Build redirect first; attach session cookies to THIS response
  const response = NextResponse.redirect(successUrl);
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
            /* ignore read-only */
          }
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth/callback] exchange failed', error.message);
    return NextResponse.redirect(errorUrl);
  }

  console.info('[auth/callback] session set on Lender', { next });
  return response;
}
