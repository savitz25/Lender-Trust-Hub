import { NextResponse } from 'next/server';
import { requestMagicLink } from '@/lib/my-lending/request-magic-link';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; next?: string };
    const result = await requestMagicLink(body.email ?? '', body.next);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true, delivery: result.delivery });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
