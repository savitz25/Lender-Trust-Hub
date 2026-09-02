import { NextResponse } from 'next/server';
import { executeSpecialistV2Request, type SpecialistRequest } from '@/lib/specialist-execution/v2';

export const dynamic = 'force-dynamic';

function respond(result: Awaited<ReturnType<typeof executeSpecialistV2Request>>) {
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q) return respond(await executeSpecialistV2Request({ query: '', queryType: 'market_cohort', page: 0 }));
  const page = Number(url.searchParams.get('page') || '1');
  const limit = Number(url.searchParams.get('limit') || '25');
  return respond(await executeSpecialistV2Request({ ...({ query: q } as SpecialistRequest), page, limit }));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SpecialistRequest;
    return respond(await executeSpecialistV2Request(body));
  } catch {
    return respond(await executeSpecialistV2Request({ query: '', queryType: 'market_cohort', page: 0 }));
  }
}
