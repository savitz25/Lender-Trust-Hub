import { NextResponse } from 'next/server';
import { requestMagicLink } from '@/lib/my-lending/request-magic-link';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; next?: string };
    const result = await requestMagicLink(body.email ?? '', body.next, request);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      delivery: result.delivery,
      // Safe to expose: public callback URL for this hub only (debug / ops)
      emailRedirectTo: result.emailRedirectTo,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
