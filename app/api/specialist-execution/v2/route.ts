import { NextResponse } from 'next/server';
import { executeSpecialistV2, type SpecialistRequest } from '@/lib/specialist-execution/v2';

export const dynamic = 'force-dynamic';

function respond(result: ReturnType<typeof executeSpecialistV2>) {
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q) return respond(executeSpecialistV2({ query: '', queryType: 'market_cohort', page: 0 }));
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '25');
  return respond(executeSpecialistV2({ ...({ query: q } as SpecialistRequest), page, limit }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SpecialistRequest;
    return respond(executeSpecialistV2(body));
  } catch {
    return respond(executeSpecialistV2({ query: '', queryType: 'market_cohort', page: 0 }));
  }
}
