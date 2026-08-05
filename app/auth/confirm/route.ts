import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  lendingAuthErrorUrl,
  lendingAuthSuccessUrl,
  resolveSiteOrigin,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

/** Email OTP confirm (token_hash) — stay on this hub. */
export async function GET(request: Request) {
  const origin = resolveSiteOrigin(request);
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') || 'magiclink') as EmailOtpType;
  const next = sanitizePostLoginPath(searchParams.get('next'));

  if (token_hash) {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
    }
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(lendingAuthSuccessUrl(next, origin));
    }
    console.error('[auth/confirm]', error.message);
  }

  return NextResponse.redirect(lendingAuthErrorUrl(next, origin));
}
