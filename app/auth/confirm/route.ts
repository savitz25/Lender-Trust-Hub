import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClientIfConfigured } from '@/lib/supabase/server';
import {
  lendingAuthErrorUrl,
  lendingAuthSuccessUrl,
  sanitizePostLoginPath,
} from '@/lib/my-lending/auth-constants';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') || 'magiclink') as EmailOtpType;
  const next = sanitizePostLoginPath(searchParams.get('next'));

  if (token_hash) {
    const supabase = await createClientIfConfigured();
    if (!supabase) {
      return NextResponse.redirect(lendingAuthErrorUrl(next));
    }
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(lendingAuthSuccessUrl(next));
    }
    console.error('[auth/confirm]', error.message);
  }

  return NextResponse.redirect(lendingAuthErrorUrl(next));
}
