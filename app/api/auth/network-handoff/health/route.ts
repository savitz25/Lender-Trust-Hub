import { NextResponse } from 'next/server';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    hub: 'lender',
    serviceRole: isSupabaseAdminConfigured(),
    routes: {
      start: '/api/auth/network-handoff/start',
      complete: '/auth/network-handoff',
    },
  });
}
