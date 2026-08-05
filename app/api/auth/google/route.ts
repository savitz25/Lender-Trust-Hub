import { NextResponse } from 'next/server';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  authExternalRedirectUrl,
  ensureLendingOAuthUrl,
  HUB_CANONICAL_ORIGIN,
  lendingAuthErrorUrl,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL('/my-lending?auth=error', HUB_CANONICAL_ORIGIN)
    );
  }

  const { searchParams } = new URL(request.url);
  const next = sanitizePostLoginPath(searchParams.get('next'));
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  // Bridge to Move by default so redirect is allowlisted; Move re-forwards code here.
  const redirectTo = authExternalRedirectUrl(next);
  console.info('[auth/google] redirectTo', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
      skipBrowserRedirect: false,
    },
  });

  if (error || !data.url) {
    console.error('[auth/google]', error?.message);
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  return NextResponse.redirect(ensureLendingOAuthUrl(data.url, next));
}
