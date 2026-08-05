import { NextResponse } from 'next/server';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  lendingAuthErrorUrl,
  lendingAuthSuccessUrl,
  resolveSiteOrigin,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

/**
 * Exchange OAuth / magic-link code for session on THIS hub only.
 * Post-login redirect stays on resolveSiteOrigin(request) — never Move.
 */
export async function GET(request: Request) {
  const origin = resolveSiteOrigin(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizePostLoginPath(searchParams.get('next'));
  const oauthError = searchParams.get('error');

  if (oauthError) {
    console.error('[auth/callback] provider error', oauthError);
    return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
  }

  if (code) {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(lendingAuthSuccessUrl(next, origin));
    }
    console.error('[auth/callback] exchange failed', error.message);
  }

  return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
}
