import { NextResponse } from 'next/server';
import { checkSupabaseHealth } from '@/lib/supabase/queries/health';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/supabase — verify Lender Trust Hub ↔ Supabase connection.
 * Safe for Vercel smoke tests (no secrets exposed).
 */
export async function GET() {
  const health = await checkSupabaseHealth();
  const status = health.connected ? 200 : health.configured ? 503 : 200;

  return NextResponse.json(
    {
      service: 'lender-trust-hub',
      supabase: health,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}