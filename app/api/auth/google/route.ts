import { NextResponse } from 'next/server';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  authCallbackUrl,
  ensureLendingOAuthUrl,
  lendingAuthErrorUrl,
  resolveSiteOrigin,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(request: Request) {
  const origin = resolveSiteOrigin(request);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/my-lending?auth=error', origin));
  }

  const { searchParams } = new URL(request.url);
  const next = sanitizePostLoginPath(searchParams.get('next'));
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
  }

  const redirectTo = authCallbackUrl(next, origin);
  console.info('[auth/google] redirectTo', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  });

  if (error || !data.url) {
    console.error('[auth/google]', error?.message);
    return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
  }

  return NextResponse.redirect(ensureLendingOAuthUrl(data.url, next, origin));
}
