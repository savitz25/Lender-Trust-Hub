import { NextResponse } from 'next/server';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  lendingAuthErrorUrl,
  lendingAuthSuccessUrl,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizePostLoginPath(searchParams.get('next'));
  const oauthError = searchParams.get('error');

  if (oauthError) {
    console.error('[auth/callback] provider error', oauthError);
    return NextResponse.redirect(lendingAuthErrorUrl(next));
  }

  if (code) {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      return NextResponse.redirect(lendingAuthErrorUrl(next));
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(lendingAuthSuccessUrl(next));
    }
    console.error('[auth/callback] exchange failed', error.message);
  }

  return NextResponse.redirect(lendingAuthErrorUrl(next));
}
