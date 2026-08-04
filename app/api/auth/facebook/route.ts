import { NextResponse } from 'next/server';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  AUTH_CALLBACK_URL,
  PRODUCTION_SITE_ORIGIN,
  lendingAuthErrorUrl,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL('/my-lending?auth=error', PRODUCTION_SITE_ORIGIN)
    );
  }

  const { searchParams } = new URL(request.url);
  const next = sanitizePostLoginPath(searchParams.get('next'));
  const supabase = await createClientIfConfigured();
  if (!supabase) {
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  const redirectTo = `${AUTH_CALLBACK_URL}?next=${encodeURIComponent(next)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo },
  });

  if (error || !data.url) {
    console.error('[auth/facebook]', error?.message);
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  return NextResponse.redirect(data.url);
}
